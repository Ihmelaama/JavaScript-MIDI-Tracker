// button ------------

    export function Button(title, content, event, callback) {

        let b;
        b=document.createElement("span");
        b.innerHTML="<font class='title'>"+title+"</font><font class='content'>"+content+"</font>";

        b.addEventListener(event, (e) => { 
        window.setActiveInput(b);
        callback(e);
        });

    return b;
    }

//--------------------------
// text input --------------

    export function TextInput(title, content, callback) {

        let b;
        b=document.createElement("span");
        b.innerHTML="<font class='title'>"+title+"</font><font class='content'>"+content+"</font>";

        let input=document.createElement("input");
        input.setAttribute("type", "text");
        input.style.display="none";
        b.appendChild(input);

        b.addEventListener("click", (e) => {

            window.setActiveInput(input);

            input.style.display="block";
            input.style.top="-15px";
            input.style.left="-5px";
            input.value="";
            input.focus();

            input.addEventListener("enterKeyEvent", function enterKeyListener() {
            
                confirmTextInput(input, callback);
                input.removeEventListener("blur", enterKeyListener);

            });

            input.addEventListener("escapeKeyEvent", function escKeyListener() {
            
                hideTextInput(input);
                input.removeEventListener("escapeKeyEvent", escKeyListener);

            });

            input.addEventListener("activeInputEvent", function activeInputListener() { 
            
                if(window.activeInputElem!==input) {
                hideTextInput(input);
                input.removeEventListener("activeInputEvent", activeInputListener); 
                }

            });            

        });

    return b;
    }

//------------

    function confirmTextInput(elem, callback) {

        callback(elem.value);
        hideTextInput(elem);

    }

//------------

    function hideTextInput(elem, listener) {

        elem.style.display="none";

    }

//--------------------------
// toggle ------------------

    export function Toggle(title, selectCallback, isOn) {

        let elem;
        elem=document.createElement("span");
        elem.className="toggle "+(isOn ? "on" : "off" );
        elem.innerHTML="<font class='title'>"+title+"</font>";

        let content=document.createElement("font");
        content.className="content";
        content.innerHTML= isOn ? "ON" : "OFF" ;
        elem.appendChild(content);

        elem.addEventListener("click", (e) => { 

            let c=elem.className;
            let b= c==="toggle on" ? true : false;
            b=!b;

            elem.className= b ? "toggle on" : "toggle off";
            content.innerHTML= b ? "ON" : "OFF" ;

            if(selectCallback!==null) selectCallback(b);
 
        });

    return elem;
    }

//--------------------------
// dropdown ----------------

    export function Dropdown(title, options, values, selectCallback, defaultValue) {

        let elem;
        elem=document.createElement("span");
        elem.className="dropdown";
        elem.innerHTML="<font class='title'>"+title+"</font>";

        let dropdown=document.createElement("font");
        dropdown.className="content";

        let sel=document.createElement("font");
        sel.innerHTML=defaultValue;
        dropdown.appendChild(sel);

        let opts=[];
        let o;
        for(let i=0; i<options.length; i++) {

            o=document.createElement("font");
            o.className="option";
            o.innerHTML=options[i];
            o.style.top=(28+i*16)+"px";
            o.style.display="none";

            o.addEventListener("click", (e) => { 

                sel.innerHTML=options[i]; 
                toggleDropdown(e, elem, opts, false); 
                if(selectCallback!==null) selectCallback(options[i], values[i]); 

            });

            opts.push(o);
            dropdown.appendChild(o);            
            
        }

        elem.appendChild(dropdown);

        elem.addEventListener("click", (e) => { 

            if(window.activeInputElem===elem) {
            toggleDropdown(e, elem, opts, false);
            window.setActiveInput(null);
            return;
            }
        
            toggleDropdown(e, elem, opts, true);
            window.setActiveInput(elem);

            elem.addEventListener("activeInputEvent", function activeInputListener() {
                
                if(window.activeInputElem!==elem) {
                toggleDropdown(e, elem, opts, false);
                elem.removeEventListener("activeInputEvent", activeInputListener); 
                }

            });

            elem.addEventListener("escapeKeyEvent", function escapeKeyListener() {
                
                toggleDropdown(e, elem, opts, false);
                window.setActiveInput(null);
                elem.removeEventListener("escapeKeyEvent", escapeKeyListener); 

            });

        });

    return elem;
    }

//------------

    function toggleDropdown(event, elem, opts, b) {

        event.stopPropagation();

        for(let i=0; i<opts.length; i++) {
        opts[i].style.display= b ? "block" : "none" ;
        }

    }