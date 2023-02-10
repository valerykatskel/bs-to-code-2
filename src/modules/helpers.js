const getTabs = (n) => (n ? new Array(n).fill("\t").join("") : "");

const getAbs = (s) => `Math.Abs(${s.split("").splice(1, s.length - 2)})`;

const stripHtml = (html) => {
  let tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
  .join("")
  .substr(1)}  
\t\t\t\t\t\t\t\tdebugPath += "${conditionAction.name} compleated > ";
\t\t\t\t\t\t\t#endregion
\t\t\t\t\t\t} else {
\t\t\t\t\t\t\tdebugPath += "${condition.name} T > ";
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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
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
  .map((line) => (line !== "" ? `\n\t\t\t\t\t\t\t\t${line};` : ""))
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

export { getTabs, getAbs, stripHtml, getConditionCode, getExits };
