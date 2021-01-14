//----------------------------------------------------
// VARIABLES

let holder = document.getElementById("MIDIConsole");

let inputs;
let outputs;
let inputConsole;

let inputConsoleActive = true;

//----------------------------------------------------
// INIT

document.addEventListener("mainReadyEvent", init, false);

function init() {
  createDeviceList("OUTPUTS", "output", window.outputs);
  createDeviceList("INPUTS", "input", window.inputs);
  createInputConsole();
}

document.addEventListener("MIDIMessageEvent", (e) => {
  createInputConsole();
});

//----------------------------------------------------
// FUNCTIONS

function createDeviceList(title, type, devices) {
  let div;

  if (type === "input") {
    if (inputs != null) {
      div = inputs;
    } else {
      div = document.createElement("div");
      inputs = div;
      holder.appendChild(div);
    }
  } else {
    if (outputs != null) {
      div = outputs;
    } else {
      div = document.createElement("div");
      outputs = div;
      holder.appendChild(div);
    }
  }

  let str = "<h2>" + title + "</h2>";
  for (let i = 0; i < devices.length; i++) {
    str += "<p>" + i + ": " + devices[i].name + "</p>";
  }

  div.innerHTML = str;
}

//------------

function createInputConsole() {
  if (!inputConsoleActive) return;

  //let maxItemsPerColumn=window.inputs.length;
  let maxItemsPerColumn = 4;
  let maxColumns = 4;
  let maxItems = maxColumns * maxItemsPerColumn + 1;

  let div;

  if (inputConsole != null) {
    div = inputConsole;
  } else {
    div = document.createElement("div");

    let h = document.createElement("h2");
    h.innerHTML = "INPUT MESSAGES ";

    let but = document.createElement("input");
    but.type = "button";
    but.className = "consolePauseButton";
    but.addEventListener("click", (e) => {
      toggleInputConsoleActive();
    });
    h.appendChild(but);

    div.appendChild(h);

    inputConsole = div;
    holder.appendChild(div);
  }

  div.className = "messageList";
  div.style.maxHeight = maxItemsPerColumn * 15 + "px";

  let messages = window.MIDIMessagesIn;
  if (messages.length === 0) return;

  let msg = messages[messages.length - 1];
  let time = (msg.timeStamp / 1000).toFixed(2);
  let name = msg.target.name;
  let span = document.createElement("span");

  span.innerHTML =
    "" +
    //"<font>"+time+"</font>"+
    "<font>[" +
    msg.data[0] +
    ", " +
    msg.data[1] +
    ", " +
    msg.data[2] +
    "]</font>" +
    "<font>&nbsp;" +
    name +
    "</font>";

  if (div.childNodes.length > 1) {
    div.insertBefore(span, div.childNodes[1]);
  } else {
    div.appendChild(span);
  }

  if (div.childNodes.length > maxItems)
    div.removeChild(div.childNodes[div.childNodes.length - 1]);

  for (let i = 1; i < div.childNodes.length; i++) {
    let o = 1 - Math.ceil(i / maxItemsPerColumn) / (maxColumns + 1);
    div.childNodes[i].style.opacity = o;
  }
}

//------------

function toggleInputConsoleActive(b) {
  if (b === undefined) b = !inputConsoleActive;
  inputConsoleActive = b;

  let c = holder.className;

  if (b) {
    c = c.replace(" paused", "");
  } else {
    c += " paused";
  }

  holder.className = c;
}
