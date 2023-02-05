import { stripHtml } from "../modules/helpers";

const getPages = (result) => {
  let cells = [];
  let objects = [];

  result.mxfile.diagram.map((d) => {
    cells = d.mxGraphModel[0].root[0].mxCell.map((el) => {
      return {
        id: el.$.id,
        value: stripHtml(el.$.value),
        parent: el.$.parent
      };
    });

    d.mxGraphModel[0].root[0].object.forEach(
      (el) => (el.$.label = stripHtml(el.$.label))
    );

    objects = d.mxGraphModel[0].root[0].object.map((el) => {
      return {
        ...el.$,
        parent: el.mxCell[0].$.parent,
        from: el.mxCell[0].$.soure,
        to: el.mxCell[0].$.target
      };
    });
    let schemes = getSchemes(objects, cells);
    debugger;

    return {
      name: d.$.name,
      cells: cells,
      objects: objects
    };
  });
};

const getSchemes = (objects, cells) => {
  const schemes = {};
  objects.forEach((el) => {
    const parentId = el.parent;
    if (!schemes.hasOwnProperty(parentId)) {
      schemes[parentId] = {
        elements: [],
        name: cells.find((el) => el.id === parentId).value
      };
    }

    schemes[el.parent].elements.push(el);
  });

  return schemes;
};

export { getPages };
