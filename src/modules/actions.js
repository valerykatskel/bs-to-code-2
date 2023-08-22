import {
  getTabs,
  stripHtml,
  getConditionCode,
  getExits,
  fixBScode
} from "./helpers";
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
              if (
                condition["exit-false"].type === "action" &&
                condition["exit-true"].type === "action"
              ) {
                // если из условия по НЕТ выходим в блок-действие
                // и если из условия по ДА выходим в блок-действие
                if (
                  (actions[condition["exit-false"].id]["exit-none"].name ===
                    "true" ||
                    actions[condition["exit-false"].id]["exit-none"].name ===
                      "false") &&
                  (actions[condition["exit-true"].id]["exit-none"].name ===
                    "true" ||
                    actions[condition["exit-true"].id]["exit-none"].name ===
                      "false")
                ) {
                  // если из обоих блоков-действий выход в да или нет,
                  // то есть это последние блоки-действий в  цепочке
                  debugger;
                  conditionData.type = "exit-to-both-last-actions";
                  condition.code = getConditionCode(conditionData);
                } else {
                  conditionData.type = "exit-to-action-inverted";
                  condition.code = getConditionCode(conditionData);
                }
              } else if (condition["exit-false"].type === "action") {
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
      /(td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}((\[n\+){0,}\d{0,}(\]){0,})==(td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}((\[n\+){0,}\d{0,}(\]){0,})(\+-(\d{0,1}t))/gm,
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
      /(\|)((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d{0,})((\+|-)((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d{0,}))){0,})(\|)/gm,
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
  debugger;
  resultString = fixBScode(resultString);

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
