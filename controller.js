//----------------------------------------------------
// IMPORTS

    import { Button, TextInput } from "./UI.js";

//----------------------------------------------------
// VARIABLES

    let holder=document.getElementById("controller");

    window.BPM=90;

    const rewindEvent=new Event("rewindEvent");
    const pauseEvent=new Event("pauseEvent");

//----------------------------------------------------
// INIT

    document.addEventListener("mainReadyEvent", init, false);

    function init() {
        
        let BPM=window.localStorage.getItem("BPM");
        if(BPM!=null) window.BPM=parseInt(BPM);

        createController();

    }

//----------------------------------------------------
// EVENTS

//----------------------------------------------------
// FUNCTIONS

    function createController() {

        let but;
        let div=controller;

        controller.innerHTML="";

        but=Button("", "<<", "click", rewind);
        div.appendChild(but);

        but=Button("", window.isPlaying ? "l  l" : ">", "click", togglePlaying);
        div.appendChild(but);

        but=Button("", "x", "click", stopAllNotes);
        div.appendChild(but);

        but=TextInput("BPM", window.BPM ? window.BPM : 90, setBPM);
        div.appendChild(but);

    }

//------------

    function rewind(event) {

        document.dispatchEvent(rewindEvent);

    }

//------------

    function togglePlaying(event) {
     
        window.isPlaying=!window.isPlaying;
        createController();        

        if(!window.isPlaying) document.dispatchEvent(pauseEvent);

    }

//------------

    function stopAllNotes(event) {

        for(let i=0; i<=127; i++) {

            let msg=[128, i, 0];
            for(let j=0; j<window.outputs.length; j++) {
            
                window.outputs[j].send(msg, 0);

            }

        }

    }

//------------

    /*
    function scrollBPM(event) {

        let d=Math.sign(event.deltaY);
        window.BPM-=d;
        if(window.BPM<1) window.BPM=1;

        createController();   
        window.localStorage.setItem("BPM", BPM);

    }
    */

    function setBPM(value) {

        let v=parseInt(value);
        if(isNaN(v)) return false;

        window.BPM=v;
        createController();   
        window.localStorage.setItem("BPM", BPM);

    return true;
    }

//----------------------------------------------------
// HELPFUL