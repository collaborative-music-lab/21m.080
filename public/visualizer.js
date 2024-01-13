const LABEL_FONT = "bold 12pt sans-serif";
const CLASS_FONT = "10pt sans-serif";
const PORT_FONT = "10pt sans-serif";
const PORT_COLOR = "gray";
const LINK_COLOR = "black";
const LINK_WIDTH = 1;

const myDiagram = new go.Diagram(
  "myDiagramDiv", // create a Diagram for the HTML Div element
  {
    // initialContentAlignment: go.Spot.Left,
    initialAutoScale: go.Diagram.UniformToFill,
    layout: new go.LayeredDigraphLayout({
      direction: 0,
    }),
    "undoManager.isEnabled": true,
  }
);

const bodyTemp = new go.Panel("Auto", { name: "BODY" })
  .add(
    new go.Shape("RoundedRectangle", {
      fill: "white",
      stroke: "black",
      height: 100,
      // TODO: figure out how to make this rectangle stretch vertically
      // if the height of left/right ports exceed the text size
      // (test by duplicating ports)
    })
  )
  .add(
    new go.Panel("Vertical", { margin: 15 })
      .add(
        new go.TextBlock({
          text: "<NO NAME>",
          font: LABEL_FONT,
        }).bind("text", "key")
      )
      .add(
        new go.TextBlock({
          text: "<NO CLASS>",
          font: CLASS_FONT,
        }).bind("text", "class")
      )
  );

const hideInputOutput = (d) => {
  return d === 'input' ? 'in' : d === 'output' ? 'out' : d;
};

const leftPortTemp = new go.Panel("Horizontal", {
  alignment: go.Spot.Right,
})
  .add(
    new go.TextBlock({
      margin: 5,
      font: PORT_FONT,
      fromSpot: go.Spot.Left,
      toSpot: go.Spot.Left,
    }).bind("text", "", hideInputOutput).bind("portId", "")
  )
  .add(
    new go.Shape("Rectangle", {
      fill: PORT_COLOR,
      stroke: null,
      width: 8,
      height: 8,
      margin: -1,
    })
  );

const rightPortTemp = new go.Panel("Horizontal", {
  alignment: go.Spot.Left,
})
  .add(
    new go.Shape("Rectangle", {
      fill: PORT_COLOR,
      stroke: null,
      width: 8,
      height: 8,
      margin: -1,
    })
  )
  .add(
    new go.TextBlock({
      margin: 5,
      font: PORT_FONT,
      fromSpot: go.Spot.Right,
      toSpot: go.Spot.Right,
    }).bind("text", "", hideInputOutput).bind("portId", "")
  );

inputPortsTemp = new go.Panel("Vertical", {
  alignment: go.Spot.Left,
  alignmentFocus: go.Spot.Right,
  itemTemplate: leftPortTemp,
}).bind("itemArray", "inputs");

outputPortsTemp = new go.Panel("Vertical", {
  alignment: go.Spot.Right,
  alignmentFocus: go.Spot.Left,
  itemTemplate: rightPortTemp,
}).bind("itemArray", "outputs");

nodeTemp = new go.Node("Spot", {
  locationObjectName: "BODY",
  locationSpot: go.Spot.Center,
  selectionObjectName: "BODY",
})
  .add(bodyTemp)
  .add(inputPortsTemp)
  .add(outputPortsTemp);

myDiagram.nodeTemplate = nodeTemp;

myDiagram.linkTemplate = new go.Link({
  routing: go.Link.AvoidsNodes,
  corner: 5,
})
  .add(new go.Shape({ stroke: LINK_COLOR, strokeWidth: LINK_WIDTH }))
  .add(new go.Shape({ stroke: LINK_COLOR, toArrow: "Standard" }));


const modelDict = JSON.parse(localStorage.getItem('VisualizerState'));
myDiagram.model = new go.GraphLinksModel(modelDict);
