import { Button, TextInput, Dropdown, Toggle } from "./UI.js";

class MIDITrack {

    constructor(type, id, parent) {

//----------------------------------------------------
// VARIABLES

    // settings ---

        this.type=type;    
        this.id=id;
        this.pingPong=false;

    // holders ---

        this.beats=[];

        this.parent=parent;
        this.holder;
        this.controller;
        this.editor;
        this.track;        

        this.updateInterval;

    // state ---

        this.speedMultiplier=1;
        this.beatDuration=function() { return 60/window.BPM*1000/this.speedMultiplier; };

        this.outputNum=0;
        this.outputChannel=1;
        this.CCNum=0;

        this.isMuted=false;
        this.playDirection=1;
        this.nextBeatTime=-1;    
        this.beatNum=0;

        this.selectedBeats=[];

        this.pendingOctave=-1;    
        this.pendingNote=-1;    
        this.pendingNoteDuration=0;        
        this.pendingCCValue=-1;  
        this.pendingCCGlide=1;

        this.currentMIDINote=-1;
        this.currentCCValue=-1;
        this.targetCCValue=-1;
        this.currentCCGlide=1;

        this.lastTime=-1;
        this.deltaTime=-1;

        this.CCUpdateTimeout=null;
        this.scrollSelectedBeatsInterval=null;
        this.scrollNotesAndOctavesInterval=null;

//----------------------------------------------------
// INIT

    // get saved vars ---

        let s=window.localStorage.getItem(id+"speedMultiplier");
        if(s!==null) this.speedMultiplier=parseInt(s);

        let o=window.localStorage.getItem(id+"outputNum");
        if(o!==null) this.outputNum=parseInt(o);

        let oc=window.localStorage.getItem(id+"outputChannel");
        if(oc!==null) this.outputChannel=parseInt(oc);

        let cc=window.localStorage.getItem(id+"CCNum");
        if(cc!==null) this.CCNum=parseInt(cc);

        let b=window.localStorage.getItem(id+"beats");
        if(b!==null) this.beats=JSON.parse(b);

        let pp=window.localStorage.getItem(id+"pingPong");
        if(pp!==null) this.pingPong= pp==="true" ? true : false ;

    // create UI ---

        this.holder=document.createElement("div");
        this.holder.className="track";
        parent.appendChild(this.holder);

        this.createController();
        this.createEditor();
        this.createTrack();

        let del=document.createElement("button");
        del.className="deleteTrackButton";
        del.addEventListener("click", (e) => { this.delete() });
        this.holder.appendChild(del);

    // add some beats if beats array is empty ---

        /*
        if(this.beats.length===0) {

            this.addBeat();
            this.addBeat();
            this.addBeat();
            this.addBeat();

        }

        this.editBeat(null, 0);        
        */

    // start updating ---

        this.updateInterval=setInterval( () => { this.update() }, 1);
       
    // subscribe to events ---

        document.addEventListener("rewindEvent", (e) => { this.rewind(); });
        document.addEventListener("pauseEvent", (e) => { this.stopNote(); });

    }

//----------------------------------------------------
// EVENTS

    update() {

        let time=window.performance.now();
        if(this.lastTime>-1) {
        this.deltaTime=(time-this.lastTime)/1000;

        } else {
        this.deltaTime=1;
        }

        this.lastTime=time;

    // scroll selected beats ---

        if(this.selectedBeats.length>0 && window.arrowLeft!=window.arrowRight) {
        this.scrollSelectedBeats();
        }

    // scroll notes and octaves ---

        if(this.selectedBeats.length>0 && window.arrowUp!=window.arrowDown) {
        this.scrollNotesAndOctaves();
        }

    // update track when playing ---

        if(window.isPlaying) {

            if(this.beats.length===0) return;

            let beatWasPlayed=false;

            if(this.type==="note") {
            beatWasPlayed=this.updateNote();
            } else {
            beatWasPlayed=this.updateCC();
            }

            if(beatWasPlayed) {

                let n=this.beatNum-this.playDirection;
                if(n<0) n=this.beats.length-1;
                if(n>this.beats.length) n=0;
                for(let i=0; i<this.beats.length; i++) this.beats[i].elem.className=this.beats[i].elem.className.replace(" active", "");
                this.beats[n].elem.className+=" active";          
    
                this.beatNum+=this.playDirection;

                if(!this.pingPong) {

                    if(this.beatNum>=this.beats.length) this.beatNum=0;                    

                } else {

                    if(this.playDirection>0 && this.beatNum>=this.beats.length) {
                    this.beatNum=this.beats.length-2;
                    this.playDirection=-1;
                    
                    } else if(this.playDirection<0 && this.beatNum<0) {
                    this.beatNum=1;
                    this.playDirection=1;
                    }

                }
    
            }

        } else {
        this.nextBeatTime=-1;            
        }        

    }

//------------

    updateNote() {

        let time=window.performance.now();
        let beat=this.beats[this.beatNum];
        let MIDINote= beat.hasOwnProperty("MIDINote") ? parseInt(beat.MIDINote) : -1 ;
        let noteDuration= beat.hasOwnProperty("duration") ? parseInt(beat.duration) : 0 ;
        let beatWasPlayed=false;

        if(this.nextBeatTime===-1) {

            this.nextBeatTime=time+this.beatDuration();
            this.playNote(MIDINote, this.nextBeatTime, noteDuration);
            beatWasPlayed=true;
            
        } else {

            let dif=this.nextBeatTime-time;
            if(dif<=0) {

                this.nextBeatTime=time+this.beatDuration()+dif;
                this.playNote(MIDINote, this.nextBeatTime, noteDuration);
                beatWasPlayed=true;

            }

        }

    return beatWasPlayed;
    }

//------------

    updateCC() {

        let time=window.performance.now();
        let beat=this.beats[this.beatNum];
        let CCValue=-1;
        let beatWasPlayed=false;

        let glide=this.currentCCGlide*this.deltaTime;
        if(glide<0) glide=0;
        if(glide>1) glide=1;

        if(this.currentCCValue!=this.targetCCValue) {
        
            let CCValue=this.glide(this.currentCCValue, this.targetCCValue, glide);
            this.setCC(CCValue);
            this.currentCCValue=CCValue;
         
        }

        if(this.nextBeatTime===-1) {

            this.nextBeatTime=time+this.beatDuration();
            beatWasPlayed=true;

        } else {

            let dif=this.nextBeatTime-time;
            if(dif<=0) {

                this.nextBeatTime=time+this.beatDuration()+dif;
                beatWasPlayed=true;

            }

        }

        if(beatWasPlayed) {

            let self=this;
            clearTimeout(this.CCUpdateTimeout);
            this.CCUpdateTimeout=setTimeout(function() {

                if(beat===undefined) return;

                let v=beat.hasOwnProperty("CCValue") ? parseInt(beat.CCValue) : -1 ;

                if(v>-1) {
                self.targetCCValue=v;
                self.currentCCGlide= beat.hasOwnProperty("CCGlide") ? parseFloat(beat.CCGlide) : 1 ;
                }

            }, this.nextBeatTime-time);

        }

    return beatWasPlayed;
    }

//----------------------------------------------------
// FUNCTIONS

// UI ------------

    createController() {

        let self=this;

        this.controller=this.createElem(this.controller);

        let but;
        let div=this.controller;

        but=Button("", "&nbsp;", "click", (e) => { this.toggleMuted(e) });
        but.className="muteButton";
        div.appendChild(but);

        but=Button("", "<<", "click", (e) => { this.rewind(e) });
        div.appendChild(but);

        but=TextInput("SPEED", this.speedMultiplier, (value) => { this.setSpeedMultiplier(value) });
        div.appendChild(but);

        but=TextInput("OUT", this.outputNum, (value) => { this.setOutputNum(value) });
        div.appendChild(but);

        but=TextInput("CHAN", this.outputChannel, (value) => { this.setOutputChannel(value) });
        div.appendChild(but);

        if(this.type==="cc") {
        but=TextInput("CC NUM", this.CCNum, (value) => { this.setCCNumber(value) });
        div.appendChild(but);
        }

        but=Toggle("PINGP.", (value) => { this.setPingPong(value); }, this.pingPong);
        div.appendChild(but);

    }

//------------

    createEditor() {

        this.editor=this.createElem(this.editor);

        let octave=this.pendingOctave;
        let note=this.pendingNote;
        let duration=this.pendingNoteDuration;

        let beatNum= this.selectedBeats.length===1 ? this.selectedBeats[0] : -1 ;
        let beat= beatNum>-1 ? this.beats[beatNum] : null ;
        if(beat!==null) {

            if(beat.hasOwnProperty("octave")) octave=beat.octave;
            if(beat.hasOwnProperty("note")) note=beat.note;
            if(beat.hasOwnProperty("duration")) duration=beat.duration;

        }
        
        if(duration<window.minNoteDuration) duration=window.minNoteDuration;

        let but;
        let div=this.editor;

        if(this.type==="note") {

        // octave ---

            but=Dropdown(
            "OCT", 
            ["-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
            [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            (option, value) => { this.setOctave(value); },
            octave>-1 ? octave : "-"
            );

            div.appendChild(but);

        // note ---

            let noteNames= beat===null || beat.octave<9 ? ["-", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] : ["-", "C", "C#", "D", "D#", "E", "F", "F#", "G"] ;
            let noteValues= beat===null || beat.octave<9 ? [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [-1, 0, 1, 2, 3, 4, 5, 6, 7];

            but=Dropdown(
            "NOTE", 
            noteNames,
            noteValues,
            (option, value) => { this.setNote(value); },
            note>-1 ? this.getNoteName(note) : "-"
            );

            div.appendChild(but);            

        // duration ---

            but=TextInput("DUR", duration, (value) => { this.setNoteDuration(value); });
            div.appendChild(but)   

        } else {

        // cc value ---
        
            but=TextInput("CC VAL", beat!==null && beat.hasOwnProperty("CCValue") && beat.CCValue>-1 ? beat.CCValue : "-", (value) => { this.setCCValue(value); });
            div.appendChild(but);

            but=TextInput("GLIDE", beat!=null && beat.hasOwnProperty("CCGlide") ? beat.CCGlide : "100", (value) => { this.setCCGlide(value); });
            div.appendChild(but);

        }

        but=Button("", "CLR", "click", (e) => { this.clearBeat(e) });
        div.appendChild(but);

        but=Button("", "ADD", "click", (e) => { this.addBeat(e) });
        div.appendChild(but);

        but=Button("", "DEL", "click", (e) => { this.removeBeat(e) });
        div.appendChild(but);

    }

//------------

    createTrack() {

        this.track=this.createElem(this.track)
        let div=this.track;

        let elem;
        for(let i=0; i<this.beats.length; i++) {

            elem=document.createElement("span");

            let c="";
            let className="beat";
            className+= this.selectedBeats.indexOf(i)>-1 ? " selected" : "" ;
            className+= i===this.beatNum-2 ? " active" : "" ;

            if(this.type==="note") {
            
                let oct= this.beats[i].octave>-1 ? this.beats[i].octave : "" ;
                let noteNum=this.beats[i].note;
                let noteName=this.getNoteName(noteNum);
                c=oct+"-"+noteName;

                if(oct>8 && noteNum>7) {
                className+=" error";
                }

            } else {

                c= this.beats[i].CCValue>-1 ? this.beats[i].CCValue : "-" ;
            
            }

            elem=Button("", c, "click", (e) => { this.selectBeat(e, i)});
            elem.className=className;
            div.appendChild(elem);

            this.beats[i].elem=elem;

        }        

    }

// controller ------------

    rewind() {

        this.beatNum=0;

    }

//------------

    toggleMuted() {

        this.isMuted=!this.isMuted;
        
        let c=this.holder.className;
        if(!this.isMuted) c=c.replace(" muted", "");
        if(this.isMuted) c+=" muted";
        this.holder.className=c;

        this.createController();

    }

//------------

    setSpeedMultiplier(value) {

        let v=parseFloat(value);
        if(isNaN(v)) return false;

        if(v<0) v=0;
        this.speedMultiplier=v;

        this.createController();   
        window.localStorage.setItem(this.id+"speedMultiplier", this.speedMultiplier);

    return true;
    }

//------------

    setOutputNum(value) {

        let v=parseInt(value);
        if(isNaN(v)) return false;

        if(v<0) v=0;
        if(v>window.outputs.length-1) v=window.outputs.length-1;
        this.outputNum=v;

        this.createController();        
        window.localStorage.setItem(this.id+"outputNum", this.outputNum);

    return true;
    }

//------------

    setOutputChannel(value) {

        let v=parseInt(value);
        if(isNaN(v)) return false;

        if(v<1) v=1;
        if(v>16) v=16;
        this.outputChannel=v;

        this.createController();   
        window.localStorage.setItem(this.id+"outputChannel", this.outputChannel);

    return true;
    }

//------------

    setCCNumber(value) {

        let v=parseInt(value);
        if(isNaN(v)) return false;

        if(v<0) v=0;
        this.CCNum=v;

        this.createController();   
        window.localStorage.setItem(this.id+"CCNum", this.CCNum);

    return true;
    }

//------------

    setPingPong(value) {

        this.pingPong=value;
        window.localStorage.setItem(this.id+"pingPong", this.pingPong);

        if(!this.pingPong) this.playDirection=1;
        
    }

// editor ------------

    setOctave(oct) {

        this.pendingOctave=oct;
        if(this.pendingOctave<0) this.pendingOctave+=10;
        if(this.pendingOctave>9) this.pendingOctave-=10;

        for(let i=0; i<this.selectedBeats.length; i++) {
        
            let beatNum=this.selectedBeats[i];
            let beat=this.beats[beatNum];

            beat.octave=this.pendingOctave;
            beat.MIDINote=this.getMIDINote(beat.octave, beat.note);

        }

        this.createTrack();
        this.createEditor();

        window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));

    }

//------------

    setNote(note) {

        this.pendingNote=note;
        if(this.pendingNote<0) this.pendingNote+=12;
        if(this.pendingNote>11) this.pendingNote-=12;
        if(this.pendingOctave>9 && this.pendingNote>7) this.pendingNote-=8;

        for(let i=0; i<this.selectedBeats.length; i++) {
        
            let beatNum=this.selectedBeats[i];
            let beat=this.beats[beatNum];

            beat.note=this.pendingNote;
            beat.MIDINote=this.getMIDINote(beat.octave, beat.note);

        }

        this.createTrack();
        this.createEditor();

        window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));

    }

//------------

    setCCValue(value) {

        this.pendingCCValue=value;

        if(this.editBeatNum>-1) {
        
            this.beats[this.editBeatNum].CCValue=this.pendingCCValue;
            window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));
            this.createTrack();            

        }

        this.createEditor();

    }

//-----------

    setCCGlide(value) {

        this.pendingCCGlide=value;

        if(this.editBeatNum>-1) {
        
            this.beats[this.editBeatNum].CCGlide=this.pendingCCGlide;
            window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));
            this.createTrack();

        }

        this.createEditor();

    }

//------------

    setNoteDuration(value) {

        this.pendingNoteDuration=value;
        if(value<0 && this.pendingNoteDuration<window.minNoteDuration) this.pendingNoteDuration=window.minNoteDuration;
        if(this.pendingNoteDuration<window.minNoteDuration) this.pendingNoteDuration=window.minNoteDuration;

        if(this.editBeatNum>-1) {
        
            this.beats[this.editBeatNum].duration=this.pendingNoteDuration;
            window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));
            this.createTrack();

        }

        this.createEditor();

    }

//------------

    clearBeat(event) {

        let num=this.editBeatNum;
        
        this.pendingOctave=-1;
        this.pendingNote=-1;
        this.pendingCCValue=-1;

        if(num>-1) {
        
            this.beats[num].octave=-1;
            this.beats[num].note=-1;
            this.beats[num].MIDINote=-1;
            this.beats[num].duration=0;
            this.beats[num].CCValue=-1;

        }

        window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));

        this.createEditor();
        if(num>-1) this.createTrack();

    }

//------------

    addBeat(event) {

        let obj={};
        obj.octave=this.pendingOctave;
        obj.note=this.pendingNote;
        obj.duration=this.pendingNoteDuration;
        obj.MIDINote=this.getMIDINote(this.pendingOctave, this.pendingNote);
        obj.CCValue=this.pendingCCValue;
        this.beats.push(obj);

        this.editBeatNum=this.beats.length-1;

        window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));
        this.createTrack();        

    }

//------------

    removeBeat() {

        let beatNum= this.editBeatNum>-1 ? this.editBeatNum : this.beats.length-1 ;
        this.beats.splice(this.editBeatNum, 1);
        window.localStorage.setItem(this.id+"beats", JSON.stringify(this.beats));
        this.createTrack();

    }

//------------

    selectBeat(event, num) {
        
        if(num<0) return;

        let beat=null;
        let i=this.selectedBeats.indexOf(num);
        let alreadySelected= i===-1 ? false : true ;

        if(!alreadySelected) {

            // clear other selected beats unless selected with ctrl pressed
            if(!window.controlDown) {
            this.selectedBeats=[];
            }

            beat=this.beats[num];
            this.selectedBeats.push(num);

        } else {

            if(window.controlDown) {

                this.selectedBeats.splice(i, 1);

            } else {

                if(this.selectedBeats.length>1) {

                    this.selectedBeats=[];
                    this.selectedBeats.push(num);

                } else {
                
                    this.selectedBeats.splice(i, 1);

                }

            }

        }

        this.pendingOctave= beat!==null && beat.hasOwnProperty("octave") ? beat.octave : -1 ;
        this.pendingNote= beat!==null && beat.hasOwnProperty("note") ? beat.note : -1 ;
        this.pendingNoteDuration= beat!==null && beat.hasOwnProperty("duration") ? beat.duration : 0 ;
        this.pendingCCValue= beat!==null && beat.hasOwnProperty("CCValue") ? beat.CCValue : -1 ;

        this.createEditor();
        this.createTrack();

    }

//------------

    scrollSelectedBeats() {

        let self=this;        

        let scroll=function() {

            if(window.arrowLeft===window.arrowRight) {
            
                clearInterval(self.scrollSelectedBeatsInterval);
                self.scrollSelectedBeatsInterval=null;

            } else {

                let direction= window.arrowLeft ? -1 : 1 ;
        
                for(let i=0; i<self.selectedBeats.length; i++) {
                    
                    let beatNum=self.selectedBeats[i]+direction;
                    if(beatNum<0) beatNum=self.beats.length-1;
                    if(beatNum>=self.beats.length) beatNum=0;
                    self.selectedBeats[i]=beatNum;
        
                }

                self.createEditor();        
                self.createTrack();

            }

        }

        if(!self.scrollSelectedBeatsInterval) {
        
            scroll();
            self.scrollSelectedBeatsInterval=setInterval(scroll, 200);

        }

    }

//------------

    scrollNotesAndOctaves() {

        let self=this;        

        let scroll=function() {

            if(window.arrowUp===window.arrowDown) {
            
                clearInterval(self.scrollNotesAndOctavesInterval);
                self.scrollNotesAndOctavesInterval=null;

            } else {

                let direction= window.arrowUp ? 1 : -1 ;

                for(let i=0; i<self.selectedBeats.length; i++) {
                    
                    let beatNum=self.selectedBeats[i]+direction;

                    if(window.shiftDown) {
                    
                        console.log("scroll octaves");

                    } else {

                        console.log("scroll notes");

                    }

                }

                self.createEditor();        
                self.createTrack();

            }

        }

        if(!self.scrollNotesAndOctavesInterval) {
        
            scroll();
            self.scrollNotesAndOctavesInterval=setInterval(scroll, 200);

        }

    }

//------------

    delete(event) {
    
        window.deleteTrack(this.id);
        this.parent.removeChild(this.holder);

        clearInterval(this.updateInterval); 
        document.removeEventListener("rewindEvent", this.rewind);        

    }

// MIDI ------------

    playNote(MIDINote, time=0, duration=0) {

        if(this.isMuted) return;
        if(MIDINote<0 || MIDINote>127) return;
        if(window.outputs.length<=0) return;

        if(time===Infinity) time=0;
        if(time==0) time=window.performance.now();
        time=Math.floor(time);

        let output=window.outputs[this.outputNum];
        let msg=[144+this.outputChannel-1, MIDINote, 127];
        output.send(msg, time);

        if(duration===0) duration=window.minNoteDuration;

        let maxDuration=this.beats.length*this.beatDuration();
        if(duration>maxDuration) duration=maxDuration;

        time+=duration;
        this.stopNote(MIDINote, time);

        this.currentMIDINote=MIDINote;

    }

//------------

    stopNote(MIDINote=-1, time=0) {

        if(MIDINote===-1) MIDINote=this.currentMIDINote;
        if(MIDINote<0 || MIDINote>127) return;
        if(window.outputs.length<=0) return;

        let output=window.outputs[this.outputNum];
        let msg=[128, MIDINote, 0];
        output.send(msg, time);

        this.currentMIDINote=-1;

    }

//------------

    setCC(CCValue, time=0) {

        if(this.isMuted) return;
        if(window.outputs.length<=0) return;

        //let msg=[0xB0, CCNum, CCValue];
        let msg=[176+this.outputChannel-1, this.CCNum, CCValue];
        window.outputs[this.outputNum].send(msg, time);

    }

//----------------------------------------------------
// HELPFUL

    createElem(elem) {

        if(elem!=null) {
        
            elem.innerHTML="";
            return elem;

        } else {

            let div=document.createElement("div");
            this.holder.appendChild(div);
            return div;

        }

    }

//------------

    getNoteName(num) {

        switch(num) {

            case 0: return "C"; break;
            case 1: return "C#"; break;
            case 2: return "D"; break;
            case 3: return "D#"; break;
            case 4: return "E"; break;
            case 5: return "F"; break;
            case 6: return "F#"; break;
            case 7: return "G"; break;
            case 8: return "G#"; break;
            case 9: return "A"; break;
            case 10: return "A#"; break;
            case 11: return "B"; break;
            default: return ""; break;

        }

    }

//------------

    getMIDINote(octave, note) {
    return octave*12+note;
    }    

//------------

    glide(start, end, amt){
    return (1-amt)*start+amt*end
    }

}

export { MIDITrack };