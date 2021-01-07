//----------------------------------------------------
// VARIABLES

    let holder=document.getElementById("settings");
    let settings;

    window.minNoteDuration=10;
    window.MIDIMessageHistorySize=100;

//----------------------------------------------------
// INIT

    document.addEventListener("mainReadyEvent", init, false);

    function init() {

        createSettings();

    }

//----------------------------------------------------
// FUNCTIONS

    function createSettings() {

        let div;

        if(settings!=null) {

            settings.innerHTML="";
            div=settings;

        } else {

            div=document.createElement("div");
            holder.appendChild(div);
            settings=div;

        }

        div.innerHTML="<h2>SETTINGS</h2>";

    }