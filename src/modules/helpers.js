const getTabs = (n) => (n ? new Array(n).fill("\t").join("") : "");

const getAbs = (s) => `Math.Abs(${s.split("").splice(1, s.length - 2)})`;

const stripHtml = (html) => {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const fixActionBlocksCode = (code) =>
  code
    .replace(
      // все индексы типа l3 vh1 приведем к виду функций _l(3) и _vh(1)
      /(td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d|start|i|size123(\+\d){0,})/gm,
      "_$1$2($3)"
    )
    .replace(
      // оформим правильно суммы и вычитание тиков
      /=\s{0,1}(_{0,}(td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\(){0,}(n\+\d{1,}|\d|start|i|size123(\+\d){0,}){0,1}(\)){0,}\s{0,}(\+|-)(.)+)/gm,
      "= Instrument.MasterInstrument.RoundToTickSize($1)"
    )
    .replace(
      // заменим значение тиков в скобке (3t) на (3*TickSize)
      /(\d){1,}t/gm,
      "$1*TickSize"
    );

const fixBScode = (bscode) =>
  bscode
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
      /(\[)([n|i]\+\d{1,}|start(_r|_l|_m|_b|_x|_t){0,1}|stop(_r|_l|_m|_b|_x|_t){0,1}|i|start|size123(\+\d){0,})(\])/gm,
      "($2)"
    )
    .replace(
      // исправим неправильную корректировку описание объема вместо v_value на v
      /v_value/g,
      "v"
    )
    .replace(
      // обрамим лидирующую сумму или разницу в скобки, чтобы при дальше при при добавлении .ApproxCompare() корректно сравнивалось с выражением целым, а не с первой частью
      /(((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(_value){0,}(\d{1,}){0,})(\+|-)((\d{1,}\*TickSize|td_value|p_value|d_value|vh_value|vl_value|d_vh|d_vl|d_high|d_low|imb|hbody|lbody|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(_value){0,}(\d{0,}){0,}))(\.|<=|>=|!=|==|<|>){0,}/gm,
      "Instrument.MasterInstrument.RoundToTickSize($1)$13"
    )
    .replace(
      // все индексы типа l3 vh1 приведем к виду функций _l(3) и _vh(1)
      /(td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\d|start|i|size123(\+\d){0,})/gm,
      "_$1$2($3)"
    )
    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(n+1) c(n+1) переведем в _o(n+1) и _c(n+1)
      /((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}\((n|i)((\+|-)\d{1,}){0,}\))/gm,
      "_$1"
    )

    .replace(
      // все описания функций без подчеркивания и с n внутри скобок типа o(start_r) переведем в _o(istart_r)
      /((td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p){0,}\((start_r|start_l|start_m|start_b|start_x|stop_r|stop_l|stop_m|stop_b|stop_x)((\+|-)\d{1,}){0,}\))/gm,
      "_$2(getBar($4))"
    )
    .replace(
      // заменим все сравнения через корректное ApproxCompare
      /(.{1,})(>=|<=|==|!=|>|<)(.{1,})/gm,
      "$1.ApproxCompare($3)$20"
    )
    .replace(
      // заменим все разности на Instrument.MasterInstrument.RoundToTickSize
      /(ApproxCompare)(\()((_(td_value|p_value|d_value|vh_value|vh_r_value|vh_l_value|vh_t_value|vl_value|vl_r_value|vl_l_value|vl_t_value|d_vh|d_vl|d_high|d_low|imb|hbody_c|lbody_c|hbody|lbody|body_c|body|dp_value|dvh_value|dvl_value|dvh|dvl|vh|vl|dp|amx_value|bmx_value|amx|bmx|cd|h_c|l_c|o_c|c_c|d|v|o|c|h|l|p)(_r|_l|_m|_b|_x|_t){0,}(\())(n\+\d{1,}|\d|start|i|size123(\+\d){0,})(\))(\+|-)(.{0,}))(\))/gm,
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
      /(!){0,}(fin_d\(1\)23(Short|Long)\(((\n|\t|\s){1,})(i|n|size123|\d)((\n|\t|\s){1,})\))/gm,
      "$1find123$3($6)"
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

const getConditionCode = ({
  diagramType,
  type,
  id,
  conditions,
  actions = {}
}) => {
  const condition = conditions[id];

  if (type === "last")
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*last*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)}  
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\treturn ${condition["exit-true"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
      
\t\t\t\t\t\t\treturn ${condition["exit-false"].name};
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;

  if (type === "last-inverted")
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*last-inverted*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\treturn ${condition["exit-true"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
      
\t\t\t\t\t\t\treturn ${condition["exit-false"].name};
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;

  if (type === "exit-false")
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-false*/
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t!(
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)}
\t\t\t\t\t\t\t)   
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\treturn ${condition["exit-false"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;

  if (type === "exit-true")
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-true*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\treturn ${condition["exit-true"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;

  if (type === "both-to-next")
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*both-to-next*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t[PASTE_HERE_CODE_FOR_${condition["exit-true"].name}];
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\t[PASTE_HERE_CODE_FOR_${condition["exit-false"].name}];
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;

  if (type === "exit-false-and-action") {
    let action = actions[condition["exit-true"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-false-and-action*/
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t!(
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t\t)   
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\treturn ${condition["exit-false"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t#region ${action.name} ${diagramType}
${action.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${action.name} compleated > ";
\t\t\t\t\t\t\t#endregion

\t\t\t\t\t\t\t${
      actions[condition["exit-true"].id]["exit-none"].name === "true"
        ? `return true;`
        : actions[condition["exit-true"].id]["exit-none"].name === "false"
        ? `return false;`
        : ``
    }
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-true-and-action") {
    let conditionAction = actions[condition["exit-false"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-true-and-action*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)}    
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\treturn ${condition["exit-true"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\t#region ${conditionAction.name} ${diagramType}
${conditionAction.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${conditionAction.name} compleated > ";
\t\t\t\t\t\t\t#endregion
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-action") {
    let conditionAction = actions[condition["exit-true"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-to-action*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t#region ${conditionAction.name} ${diagramType}
${conditionAction.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${conditionAction.name} compleated > ";
\t\t\t\t\t\t\t#endregion
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-action-inverted") {
    let conditionAction = actions[condition["exit-true"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-to-action-inverted*/
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t!(
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t\t)
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\t#region ${conditionAction.name} ${diagramType}
${conditionAction.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${conditionAction.name} compleated > ";
\t\t\t\t\t\t\t#endregion
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-both-last-actions") {
    let action1 = actions[condition["exit-true"].id];
    let action2 = actions[condition["exit-false"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-to-both-last-actions*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t#region ${action1.name} ${diagramType}
${action1.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${action1.name} compleated > ";
\t\t\t\t\t\t\t#endregion

\t\t\t\t\t\t\treturn ${action1["exit-none"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\t#region ${action2.name} ${diagramType}
${action2.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${action2.name} compleated > ";
\t\t\t\t\t\t\t#endregion

\t\t\t\t\t\t\treturn ${action2["exit-none"].name};
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-last-action") {
    let action = actions[condition["exit-true"].id];
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-to-last-action*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t#region ${action.name} ${diagramType}
${action.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${action.name} compleated > ";
\t\t\t\t\t\t\t#endregion

\t\t\t\t\t\t\treturn ${action["exit-none"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-last-action-inverted") {
    let action = actions[condition["exit-false"].id];
    return `
\t\t\t\t\t#region ${
      condition.name
    } ${diagramType} /*exit-to-last-action-inverted*/
\t\t\t\t\t\tif (
\t\t\t\t\t\t\t!(
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t\t)
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";

\t\t\t\t\t\t\t#region ${action.name} ${diagramType}
${action.value
  .split(";")
  .map((line) =>
    line !== "" ? `\n\t\t\t\t\t\t\t\t${fixActionBlocksCode(line)};` : ""
  )
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${action.name} compleated > ";
\t\t\t\t\t\t\t#endregion

\t\t\t\t\t\t\treturn ${action["exit-none"].name};
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }

  if (type === "exit-to-last") {
    let conditionLast = conditions[condition["exit-true"].id];

    conditionLast.ready = true;
    return `
\t\t\t\t\t#region ${condition.name} ${diagramType} /*exit-to-last*/
\t\t\t\t\t\tif (
${condition.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)} 
\t\t\t\t\t\t) {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";

\t\t\t\t\t\t\t#region ${conditionLast.name} ${diagramType}
\t\t\t\t\t\t\t\tif (
${conditionLast.text
  .split("\n")
  .map((line) => `\n\t\t\t\t\t\t\t\t\t${line}`)
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\t) {
\t\t\t\t\t\t\t\t\tdebugPath += "${conditionLast.name} T > ";

\t\t\t\t\t\t\t\t\treturn ${conditionLast["exit-true"].name};
\t\t\t\t\t\t\t\t} else {
\t\t\t\t\t\t\t\t\tdebugPath += "${conditionLast.name} F > ";
      
\t\t\t\t\t\t\t\t\treturn ${conditionLast["exit-false"].name};
\t\t\t\t\t\t\t\t}
\t\t\t\t\t\t\t#endregion
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} F > ";
\t\t\t\t\t\t}
\t\t\t\t\t#endregion`;
  }
};

const getExits = (result, conditions, returns, actions) =>
  result.mxfile.diagram[0].mxGraphModel[0].root[0].object
    .map((el) => {
      let resObj = {};
      let native = el.$;
      let cell = el.mxCell[0].$;

      // парсим стрелки выхода по ДА (зеленые) или НЕТ (красные)
      if (native["b-exit"]) {
        resObj.id = native.id;
        resObj.type = "exit";
        resObj.value = native["b-exit"];
        resObj.from = cell.source;
        resObj.to = cell.target;

        // добавим найденную красную стрелку в нужный ромб условий
        if (resObj.value === "false") {
          if (conditions[resObj.to]) {
            conditions[resObj.from]["exit-false"].id = conditions[resObj.to].id;
            conditions[resObj.from]["exit-false"].name =
              conditions[resObj.to].name;
            conditions[resObj.from]["exit-false"].type =
              conditions[resObj.to].type;
          } else if (returns[resObj.to]) {
            conditions[resObj.from]["exit-false"].id = returns[resObj.to].id;
            conditions[resObj.from]["exit-false"].name =
              returns[resObj.to].name;
            conditions[resObj.from]["exit-false"].type =
              returns[resObj.to].type;
          } else if (actions[resObj.to]) {
            if (conditions[resObj.from]) {
              conditions[resObj.from]["exit-false"].id = actions[resObj.to].id;
              conditions[resObj.from]["exit-false"].name =
                actions[resObj.to].name;
              conditions[resObj.from]["exit-false"].type =
                actions[resObj.to].type;
            }
          }
        }

        // добавим найденную зеленую стрелку в нужный ромб условий
        if (resObj.value === "true") {
          if (conditions[resObj.to]) {
            conditions[resObj.from]["exit-true"].id = conditions[resObj.to].id;
            conditions[resObj.from]["exit-true"].name =
              conditions[resObj.to].name;
            conditions[resObj.from]["exit-true"].type =
              conditions[resObj.to].type;
          } else if (returns[resObj.to]) {
            conditions[resObj.from]["exit-true"].id = returns[resObj.to].id;
            conditions[resObj.from]["exit-true"].name = returns[resObj.to].name;
            conditions[resObj.from]["exit-true"].type = returns[resObj.to].type;
          } else if (actions[resObj.to]) {
            conditions[resObj.from]["exit-true"].id = actions[resObj.to].id;
            conditions[resObj.from]["exit-true"].name = actions[resObj.to].name;
            conditions[resObj.from]["exit-true"].type = actions[resObj.to].type;
          }
        }

        // добавим найденную черную стрелку в нужный блок-действие
        if (resObj.value === "none") {
          if (returns[resObj.to]) {
            actions[resObj.from]["exit-none"].id = returns[resObj.to].id;
            actions[resObj.from]["exit-none"].name = returns[resObj.to].name;
            actions[resObj.from]["exit-none"].type = returns[resObj.to].type;
          }
        }
      } else resObj.type = "";
      return resObj;
    })
    .filter((el) => el.type !== "");

export { getTabs, getAbs, stripHtml, getConditionCode, getExits, fixBScode };
