//----------------------------------------------------
// IMPORTS

    import { MIDITrack } from "./MIDITrack.js";

//----------------------------------------------------
// VARIABLES

    let noteTrackHolder;
    let CCTrackHolder;
    let trackIds=[];

    window.shiftDown=false;
    window.controlDown=false;
    window.arrowDown=false;
    window.arrowUp=false;
    window.arrowLeft=false;
    window.arrowRight=false;

    window.activeInputElem=null;
    window.inputCallback=null;

    window.MIDIMessagesIn=[];

    const mainReadyEvent=new Event("mainReadyEvent");
    const enterKeyEvent=new Event("enterKeyEvent");
    const escapeKeyEvent=new Event("escapeKeyEvent");
    const activeInputEvent=new Event("activeInputEvent");
    const MIDIMessageEvent=new Event("MIDIMessageEvent");

//----------------------------------------------------
// INIT

    document.addEventListener("DOMContentLoaded", init, false);

    function init() {

    // get and set stuff ---

        noteTrackHolder=document.getElementById("noteTracks");
        CCTrackHolder=document.getElementById("CCTracks");

        window.addTrack=addTrack;
        window.deleteTrack=deleteTrack;
        window.setActiveInput=setActiveInput;

    // create tracks ---

        let t=window.localStorage.getItem("trackIds");
        if(t!==null) trackIds=JSON.parse(t);

        //let hasNoteTrack=false;
        //let hasCCTrack=false;

        for(let i=0; i<trackIds.length; i++) {
        
            addTrack(trackIds[i].type, trackIds[i].id);
            //if(trackIds[i].type==="note") hasNoteTrack=true;
            //if(trackIds[i].type==="cc") hasCCTrack=true;

        }

        //if(!hasNoteTrack) addTrack("note");
        //if(!hasCCTrack) addTrack("cc");
        
    // get midi ---

        window.outputs=[];
        window.inputs=[];

        if(navigator.requestMIDIAccess) {

            navigator.requestMIDIAccess().then(

                // success
                function(m) {

                    //m.onstatechange=function(e) { console.log("state changed"); console.log(e); }
                    //m.addEventListener("onstatechange", function(e) { console.log(e); });

                // get midi inputs ---

                    m.inputs.forEach(function(input) {
                    
                        window.inputs.push(input);
                        input.onmidimessage=handleMIDIMessage;

                    });

                // get midi outputs ---

                    m.outputs.forEach(function(output) { 
                    window.outputs.push(output);
                    });

                // done ---

                    dispatchEvent(mainReadyEvent);

                }, 
                
                // fail
                function(midi) {
                
                    console.log("something went wrong with requestion midi access");
                    dispatchEvent(mainReadyEvent);

                }
                
            );
        

        } else {
        
            console.log("no midi");
            dispatchEvent(mainReadyEvent);

        }

    }

// set other listeners ---

    document.addEventListener("keydown", function onPress(event) {

        switch(event.key) {

            case "Shift": window.shiftDown=true; break;
            case "Control": window.controlDown=true; break;

            case "ArrowDown": window.arrowDown=true; break;
            case "ArrowUp": window.arrowUp=true; break;
            case "ArrowLeft": window.arrowLeft=true; break;
            case "ArrowRight": window.arrowRight=true; break;

        }

    });    

    document.addEventListener("keyup", function onPress(event) {

        switch(event.key) {

            case "Shift": window.shiftDown=false; break;
            case "Control": window.controlDown=false; break;

            case "ArrowDown": window.arrowDown=false; break;
            case "ArrowUp": window.arrowUp=false; break;
            case "ArrowLeft": window.arrowLeft=false; break;
            case "ArrowRight": window.arrowRight=false; break;

            case "Enter": dispatchEvent(enterKeyEvent); break;
            case "Escape": dispatchEvent(escapeKeyEvent); break;

        }

    });

//------------

    function dispatchEvent(event) {

        document.dispatchEvent(event);

        let elems=document.body.getElementsByTagName("*");        
        for(let i=0; i<elems.length; i++) {
        elems[i].dispatchEvent(event);
        }

    }

//----------------------------------------------------
// FUNCTIONS

    function addTrack(type, id, holder) {

        if(!id) id=type+""+Date.now().toString();
        if(!holder) holder= type==="note" ? noteTrackHolder : CCTrackHolder ;

        if(type!==null && id!==null && holder!==null) {
        let mt=new MIDITrack(type, id, holder);
        }

        let alreadyExists=false;
        for(let i=0; i<trackIds.length; i++) {
        if(id===trackIds[i].id) alreadyExists=true;
        }

        if(!alreadyExists) {
        trackIds.push({id:id, type:type});
        localStorage.setItem("trackIds", JSON.stringify(trackIds));
        }

    }

//------------

    function deleteTrack(id) {

        for(let i=0; i<trackIds.length; i++) {

            if(trackIds[i].id===id) {

                trackIds.splice(i, 1);
                localStorage.setItem("trackIds", JSON.stringify(trackIds));

            break;
            }

        }

    }

//------------

    function setActiveInput(elem) {

        if(elem!==window.activeInputElem) {
        
            window.activeInputElem=elem;
            if(elem!==null) dispatchEvent(activeInputEvent);

        }

    }

//------------

    function handleMIDIMessage(msg) {

        if(msg.data[0]===undefined || msg.data[1]===undefined || msg.data[2]===undefined) return;

        if(window.MIDIMessagesIn.length>window.MIDIMessageHistorySize) {
        window.MIDIMessagesIn.shift();
        }

        window.MIDIMessagesIn.push(msg);
        dispatchEvent(MIDIMessageEvent);

    }