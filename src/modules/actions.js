import { getTabs, stripHtml, getConditionCode, getExits } from "./helpers";
import { codeFormatted, appCode } from "./elements";
//import { getPages } from "../controllers/mxfile.js";
const copy = require("clipboard-copy");
const parseString = require("xml2js").parseString;
let bracketsCountError = false;
let loopMode = false;

const transformCode = (code) => {
  parseString(code, (err, result) => {
    //  подготовым данные по всем схемам
    //const tabs = getPages(result);
    //debugger;

    result.mxfile.diagram.forEach((diagram) => {
      let conditions = {}; // коллекция всех ромбов-условий
      let conditionsArray = []; // массив всех ромбов-условий
      let returns = {}; // коллекция всех возвращаяемых значений ДА/НЕТ
      let exits = []; // массив стрелок из ромбов
      let actions = {}; // коллекция всех блоков-действий
      let loop = {}; // описание схемы-цикла for

      let diagrammNameFull = diagram.mxGraphModel[0].root[0].mxCell
        .map((cell) => cell.$.value !== undefined && cell.$.value)
        .filter((value) => value && value.match(/Short|Long/g))[0];
      let diagramName = diagrammNameFull.split("(")[0].trim();
      let diagramArgs =
        diagrammNameFull.match(/\((.*)\)/) &&
        diagrammNameFull.match(/\((.*)\)/)[1].trim();
      let diagramType = "";

      if (diagramName.match(/Long/)) diagramType = "long";
      if (diagramName.match(/Short/)) diagramType = "short";

      let scheme = diagram.mxGraphModel[0].root[0].object;

      // получаем все блоки условий
      scheme.forEach((el) => {
        let native = el.$;

        // первым делом определим, может быть мы работаем со схемой-циклом?

        if (
          native["b-loop-init"] ||
          native["b-loop-body"] ||
          native["b-loop-step"] ||
          native["b-loop-condition"]
        ) {
          loopMode = true;
          // а раз мы работаем со схемой циклом - то тут сразу все можно выдать, дальше незачем искать блоки других типов
          if (native["b-loop-init"]) {
            loop.init = stripHtml(native.label);
          }
          if (native["b-loop-body"]) {
            loop.body = createCondition(stripHtml(native.label)).trim();
            loop.name = stripHtml(native["b-loop-body"]);
          }
          if (native["b-loop-step"]) {
            loop.step = stripHtml(native.label);
          }
          if (native["b-loop-condition"]) {
            loop.condition = stripHtml(native.label);
          }
          debugger;
        } else {
          // парсим блоки-действия
          if (native["b-action"]) {
            let resObj = {};

            resObj.id = native.id;
            resObj.type = "action";
            resObj.name = native["b-action"];
            resObj.value = stripHtml(native.label);

            resObj["exit-none"] = {};

            actions[resObj.id] = resObj;
          }

          // парсим возвращаемые значения
          if (native["b-return"]) {
            let resObj = {};

            resObj.id = native.id;
            resObj.type = "return";
            resObj.name = native["b-return"];
            returns[resObj.id] = resObj;
          }

          // парсим ромбы условий
          if (native["b-name"]) {
            let resObj = {};

            resObj.id = native.id;
            resObj.type = "condition";
            resObj.name = native["b-name"];
            resObj.value = stripHtml(native.label.replace(/[\s?]/gm, ""));

            resObj["exit-true"] = {};
            resObj["exit-false"] = {};
            resObj["text"] = createCondition(resObj.value);

            conditions[resObj.id] = resObj;
          }
        }
      });

      debugger;
      if (!loopMode) {
        // получаем все стрелки выхода из условий в отдельный массив и одновременно пушим стрелки в нужное условие
        exits = getExits(result, conditions, returns, actions);

        console.group("conditions");
        console.log(conditions);
        console.groupEnd();
        console.group("exits");
        console.log(exits);
        console.groupEnd();
        console.group("actions");
        console.log(actions);
        console.groupEnd();

        conditionsArray = Array.from(Object.values(conditions)).sort(
          (l, r) => +l.name.split(".")[1] - +r.name.split(".")[1]
        );

        // формируем блоки C# кода из данных массива условий
        conditionsArray.forEach((condition) => {
          const conditionData = {
            diagramType: diagramType,
            id: condition.id,
            conditions: conditions,
            actions: actions
          };
          const isLast = (condition) =>
            condition["exit-false"].name === "false" &&
            condition["exit-true"].name === "true";

          const isLastInverted = (condition) =>
            condition["exit-false"].name === "true" &&
            condition["exit-true"].name === "false";

          const isExitFalseAndAction = (condition) =>
            (condition["exit-false"].name === "false" ||
              condition["exit-false"].name === "true") &&
            condition["exit-true"].type === "action";

          const isExitTrueAndAction = (condition) =>
            (condition["exit-true"].name === "false" ||
              condition["exit-true"].name === "true") &&
            condition["exit-false"].type === "action";

          const isExitFalse = (condition) =>
            condition["exit-false"].name === "false" ||
            condition["exit-false"].name === "true";

          const isExitTrue = (condition) =>
            condition["exit-true"].name === "false" ||
            condition["exit-true"].name === "true";

          const isExitToLast = (condition) =>
            conditions[condition["exit-true"].id]["exit-true"].type ===
              "return" &&
            conditions[condition["exit-true"].id]["exit-false"].type ===
              "return";

          const isExitToLastInverted = (condition) =>
            conditions[condition["exit-false"].id]["exit-true"].type ===
              "return" &&
            conditions[condition["exit-false"].id]["exit-false"].type ===
              "return";

          if (!condition.ready) {
            // if (isLoopInverted(condition)) {
            //   // если выход по НЕТ идет в цикл
            //   condition.last = true;
            //   conditionData.type = "exit-loop-inverted";
            //   condition.code = getConditionCode(conditionData);
            // } else
            if (isLast(condition)) {
              // если это конечное условие и выход по ДА ведет в ДА, а выход по НЕТ ведет в НЕТ
              condition.last = true;
              conditionData.type = "last";
              condition.code = getConditionCode(conditionData);
            } else if (isLastInverted(condition)) {
              // если это конечное условие и выход по ДА ведет в НЕТ, а выход по НЕТ ведет в ДА
              condition.last = true;
              conditionData.type = "last-inverted";
              condition.code = getConditionCode(conditionData);
            } else if (isExitFalseAndAction(condition)) {
              // если выход по НЕТ ведет в НЕТ или ДА, а выход по ДА ведет в блок-действие
              conditionData.type = "exit-false-and-action";
              condition.code = getConditionCode(conditionData);
            } else if (isExitTrueAndAction(condition)) {
              // если выход по ДА ведет в НЕТ или ДА, а выход по НЕТ ведет в блок-действие
              conditionData.type = "exit-true-and-action";
              condition.code = getConditionCode(conditionData);
            } else if (isExitFalse(condition)) {
              // если выход по НЕТ ведет в ДА или НЕТ
              conditionData.type = "exit-false";
              condition.code = getConditionCode(conditionData);
            } else if (isExitTrue(condition)) {
              // если выход по ДА ведет в ДА или НЕТ
              conditionData.type = "exit-true";
              condition.code = getConditionCode(conditionData);
            } else {
              // если и выход по НЕТ и выход по ДА выходим в другие блоки условий или действий
              // то проверим
              debugger;
              if (condition["exit-false"].type === "action") {
                // если из условия по НЕТ выходим в блок-действие
                if (
                  actions[condition["exit-false"].id]["exit-none"].name ===
                    "true" ||
                  actions[condition["exit-false"].id]["exit-none"].name ===
                    "false"
                ) {
                  // если из блока-действия выход в да или нет, тоесть это последний блок цепочке
                  conditionData.type = "exit-to-last-action-inverted";
                  condition.code = getConditionCode(conditionData);
                } else {
                  conditionData.type = "exit-to-action-inverted";
                  condition.code = getConditionCode(conditionData);
                }
              } else if (condition["exit-true"].type === "action") {
                // если из условия по ДА выходим в блок-действие
                if (
                  actions[condition["exit-true"].id]["exit-none"].name ===
                    "true" ||
                  actions[condition["exit-true"].id]["exit-none"].name ===
                    "false"
                ) {
                  // если из блока-действия выход в да или нет, тоесть это последний блок цепочке
                  conditionData.type = "exit-to-last-action";
                  condition.code = getConditionCode(conditionData);
                } else {
                  conditionData.type = "exit-to-action";
                  condition.code = getConditionCode(conditionData);
                }
              } else if (isExitToLast(condition)) {
                // если выход по ДА ведет в последний блок-условие
                conditionData.type = "exit-to-last";
                condition.code = getConditionCode(conditionData);
              } else if (isExitToLastInverted(condition)) {
                // если выход по НЕТ ведет в последний блок-условие
                conditionData.type = "exit-to-last-inverted";
                condition.code = getConditionCode(conditionData);
              } else {
                conditionData.type = "both-to-next";
                condition.code = getConditionCode(conditionData);
              }
            }
          }
        });

        codeFormatted.value += `
\t\t\t\tpublic bool ${diagramName} (${diagramArgs ? diagramArgs : ""}) {
\t\t\t\t\tdebugPath = "";
${conditionsArray.map((el) => el.code).join("\n")}
\t\t\t\t}
      `;
      } else {
        // получим тип цикла
        const loopType =
          scheme
            .map((el) => (el.$["b-loop-exit"] ? el.$ : undefined))
            .filter((el) => el)[0]["b-loop-exit"] === "true";

        // дальше нужно определить тип цикла
        // usual - если условие на всех итерациях выполняется, возвращаем ДА, если на любой не выполнится, то вернем НЕТ
        // inverted - если условие на всех итерациях НЕ выполняется, возвращаем ДА, если на любой нвыполнится, то вернем ДА
        debugger;

        codeFormatted.value += `
\t\t\t\tpublic bool ${diagramName} (${diagramArgs ? diagramArgs : ""}) {
\t\t\t\t\tdebugPath = "";
\t\t\t\t\t
\t\t\t\t\tfor (${loop.init}; ${loop.condition}; ${loop.step}) {
\t\t\t\t\t\tif (${!loopType ? "\n\t\t\t\t\t\t\t!(" : ""}  
\t\t\t\t\t\t\t${!loopType ? "\t" : ""}${loop.body}${
          !loopType ? "\n\t\t\t\t\t\t\t)" : ""
        }
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${loop.name} ${loopType ? " T" : " F"} >";  
\t\t\t\t\t\t\t
\t\t\t\t\t\t\treturn ${loopType ? "true" : "false"};
\t\t\t\t\t\t}
\t\t\t\t\t}
\t\t\t\t\tdebugPath += "${loop.name} ${loopType ? " F" : " T"} >";
\t\t\t\t\t
\t\t\t\t\treturn ${loopType ? "false" : "true"};
\t\t\t\t}
      `;
      }
    });
  });
  copy(codeFormatted.value); // копируем отформатированный C# код в буфер обмена
};

const createCondition = (code) => {
  codeFormatted.classList = [];
  appCode.classList = [];
  appCode.classList.add("app-code");
  let tabLevel = 0;
  bracketsCountError = false;
  let formattedValue = "";
  let resultString = "";

  formattedValue = code
    .replace(
      // удалим лишние пробелы
      /[\s?]/gm,
      ""
    )
    .replace(
      // преобразуем все +- тики
      /(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}((\[n\+){0,}\d{0,}(\]){0,})==(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}((\[n\+){0,}\d{0,}(\]){0,})(\+-(\d{0,1}t))/gm,
      "$1$2$3<=$6$7$8+$12&&$1$2$3>=$6$7$8-$12"
    )
    .replace(
      // окультурим добавление тиков
      /(-|\+)(\d{1,})(t)/g,
      "$1$2*TickSize"
    )
    .replace(
      // переведем знаки $ в _value для ситуаций, когда перед долларом нет индекса например d_r$
      /(\$)/gm,
      "_value"
    )
    .replace(
      // после замена $ в _value могут появиться варианты td1_value когда индекс нужно поставить сразу после _value
      /(\d{1,})_value/gm,
      "_value$1"
    )
    .replace(
      // преобразуем значения с фигурными скобками в правильные: из d{vl}_2 в d_vl2
      /(d)\{(vh|vl)\}_(\d{1,})/g,
      "$1_$2$3"
    )

    .replace(
      // преобразуем значения с фигурными скобками в правильные: из d{vl}_r в d_vl_r
      /(d)\{(vh|vl)\}(_r|_l|_m|_b|_x|_t)/gm,
      "$1_$2$3"
    )
    .replace(
      // обработаем отдельно стоящие модули, как содержащие выражения |vl1 - p1|, так и содержащие просто значения |td_value1|
      /(\|)((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d{0,})((\+|-)((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d{0,}))){0,})(\|)/gm,
      "Math.Abs($2)"
    );
  for (let i = 0; i < formattedValue.length; i++) {
    if (formattedValue[i] === "&") {
      if (formattedValue[i - 1] === "&") {
        resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
      } else {
        resultString += formattedValue[i];
      }
    } else if (formattedValue[i] === "|") {
      if (formattedValue[i - 1] === "|") {
        if (formattedValue[i - 2] !== "|") {
          if (formattedValue[i + 1] !== "|") {
            // защита от форматирования модуля
            resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
          } else resultString += formattedValue[i];
        } else {
          if (formattedValue[i + 1] === "|") {
            resultString += formattedValue[i];
          } else resultString += formattedValue[i] + "\n" + getTabs(tabLevel);
        }
      } else if (
        formattedValue[i + 1] === "|" &&
        formattedValue[i + 2] !== "|"
      ) {
        resultString += formattedValue[i];
      } else resultString += formattedValue[i];
    } else if (formattedValue[i] === "(") {
      resultString += formattedValue[i];
      tabLevel++;
      resultString += "\n" + getTabs(tabLevel);
    } else if (formattedValue[i] === ")") {
      tabLevel--;
      tabLevel = tabLevel < 0 ? 0 : tabLevel;
      resultString += "\n" + getTabs(tabLevel) + formattedValue[i];
    } else {
      resultString += formattedValue[i];
    }
  }
  //resultString = formattedValue;

  resultString = resultString
    .replace(
      // корректировка лишних табуляций и переносов строк в скобках функции Math.Abs()
      /\.Abs\(\n\t{0,}(.*)\n\t{0,}\)/gm,
      ".Abs($1)"
    )
    .replace(
      // && перенесем на новую строку;
      /(&&)/gm,
      "\n$1\n"
    )
    .replace(
      // || перенесем на новую строку;
      /(\|\|)/gm,
      "\n$1\n"
    )
    .replace(
      // содержимое квадратных скобок перенесем в круглые
      /(\[)([n|i]\+\d{1,}|start(_r|_l|_m|_b|_x|_t){0,1}|i|start|size123(\+\d){0,})(\])/gm,
      "($2)"
    )
    .replace(
      // исправим неправильную корректировку описание объема вместо v_value на v
      /v_value/g,
      "v"
    )
    .replace(
      // обрамим лидирующую сумму или разницу в скобки, чтобы при дальше при при добавлении .ApproxCompare() корректно сравнивалось с выражением целым, а не с первой частью
      /(((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(_value){0,}(\d{1,}){0,})(\+|-)((\d{1,}\*TickSize|td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(_value){0,}(\d{0,}){0,}))(\.|<=|>=|!=|==|<|>){0,}/gm,
      "Instrument.MasterInstrument.RoundToTickSize($1)$13"
    )
    .replace(
      // все индексы типа l3 vh1 приведем к виду функций _l(3) и _vh(1)
      /(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d|start|i|size123(\+\d){0,})/gm,
      "_$1$2($3)"
    )
    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(n+1) c(n+1) переведем в _o(n+1) и _c(n+1)
      /((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}\((n|i)((\+|-)\d{1,}){0,}\))/gm,
      "_$1"
    )

    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(start_r) переведем в _o(istart_r)
      /((td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}\((start_r|start_l|start_m|start_b|start_x)((\+|-)\d{1,}){0,}\))/gm,
      "_$2(getBar(i$4))"
    )
    .replace(
      // заменим все сравнения через корректное ApproxCompare
      /(.{1,})(>=|<=|==|!=|>|<)(.{1,})/gm,
      "$1.ApproxCompare($3)$20"
    )
    .replace(
      // заменим все разности на Instrument.MasterInstrument.RoundToTickSize
      /(ApproxCompare)(\()((_(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\())(n\+\d{1,}|\d|start|i|size123(\+\d){0,})(\))(\+|-)(.{0,}))(\))/gm,
      "$1$2Instrument.MasterInstrument.RoundToTickSize($3)$10"
    )
    .replace(
      // добавим правильное отображение типа уровня в условии
      /(nl|ns)(\.type).ApproxCompare\((p_r|vl_r|vh_r|vh1|vl1|p2|d_r)\)==0/gm,
      "$1$2 == handlarVXv2EnumLevelType.$3"
    )
    .replace(
      // заменим значение тиков в скобке (3t) на (3*TickSize)
      /\((\d){1,}t\)/gm,
      "($1*TickSize)"
    )
    .replace(
      // добавим слева и с права от плюса и минуса пробелы для улучшения читаемости условий
      /(\+|-)/gm,
      " $1 "
    )
    .replace(
      // удалим все расставленные переносы строк, чтобы дальше корректно отформатировать отступы
      /(\n)(&&|\|\|)(\n)/gm,
      "$2"
    )
    .replace(
      // добавим недостающий пробел в таких местах )|| и )&&, чтобы стало так ) || и ) &&
      /(\))(&&|\|\|)/gm,
      "$1 $2"
    )
    .replace(
      // добавим недостающие пробелы форматирования в конце строк
      /(>=|<=|!=|==|>|<)(\d){1,}(&&|\|\|){0,}$/gm,
      " $1 $2 $3"
    )
    .replace(
      // уберем лишние пробелы, табуляцию и пренос строк в вызовах фйнкций без параметров типа springCommonShort()
      /\((\n|\t){1,}\)/gm,
      "()"
    )
    .replace(
      // уберем перевод строки сразу после открывающей скобки в вызове любой функции getBar(ns.start+1)
      /(getBar)(\()((\n\s){1,})/gm,
      "$1$2"
    )
    .replace(
      // окончательно удалим все табы и переносы строк в скобках при вызове функций
      /((getBar|find123Short)(\()(.){1,})((\n|\t|\s){1,})(\))/gm,
      "$1$7"
    )
    .replace(
      // ошибочно отформатированное fin_d(1)23 преобразуем в find123
      /(fin_d\(1\)23(Short|Long)\(((\n|\t|\s){1,})(i|n)((\n|\t|\s){1,})\))/gm,
      "find123$2($5)"
    )
    .replace(
      // ошибочно отформатированное сравнение с null приведем к нормальному виду
      /\.ApproxCompare\(null\) (==|!=) 0/gm,
      " $1 null"
    )
    .replace(
      // ошибочно отформатированное сравнение int переменных (n,i) приведем к нормальному виду
      /(n|i)\.ApproxCompare\((\d)\) (>|<|<=|>=|==|!=) 0/gm,
      "$1 $3 $2"
    );

  //resultString = resultString

  // контроль наличия номер бара в названии переменной, где номер бара обязательный
  let barIndexMissingForAMX = resultString.match(/amx\./g)?.length;
  let barIndexMissingForAMXRanges = [];
  let textVariable = "amx.";
  let selectionStartIndex = resultString.indexOf(textVariable);
  let selectionEndIndex = selectionStartIndex + textVariable.length;
  barIndexMissingForAMXRanges.push([selectionStartIndex, selectionEndIndex]);

  // контроль количества закрываемых и открываемых скобок
  let openBracketsCount =
    resultString.match(/\(/g) && resultString.match(/\(/g).length;
  let closeBrqcketsCount =
    resultString.match(/\)/g) && resultString.match(/\)/g).length;
  bracketsCountError = openBracketsCount !== closeBrqcketsCount;

  // контроль ошибки, когда идут подряд && && или || ||
  let logicSignsCountError1 =
    resultString.replace(/\s+/g, "").match(/&&&&/g)?.length > 0;

  let logicSignsCountError2 =
    resultString.replace(/\s+/g, "").match(/\|\|\|\|/g)?.length > 0;

  let logicSignsCountError3 =
    resultString.replace(/\s+/g, "").match(/&&\|\|/g)?.length > 0;

  let logicSignsCountError4 =
    resultString.replace(/\s+/g, "").match(/\|\|&&/g)?.length > 0;

  if (bracketsCountError) appCode.classList.add("errorBracketsCount");
  if (logicSignsCountError1) appCode.classList.add("errorLogicSignsCount1");
  if (logicSignsCountError2) appCode.classList.add("errorLogicSignsCount2");
  if (logicSignsCountError3) appCode.classList.add("errorLogicSignsCount3");
  if (logicSignsCountError4) appCode.classList.add("errorLogicSignsCount4");
  if (barIndexMissingForAMX > 0) appCode.classList.add("errorBarIndex");
  return resultString;
};

export { transformCode, createCondition };
