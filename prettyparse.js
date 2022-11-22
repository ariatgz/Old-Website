document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('textarea[name=source]');
    textarea.addEventListener('input', (e) => {

        refreshOutput(e.target.value);


    });

    refreshOutput(textarea.value);

});

function refreshOutput(html) {
    const output = document.querySelector('pp-output');


    output.innerText = '';
    output.appendChild(prettyPrint(parser(html)));

}
class Lexer{
    constructor(source) {
        this.source=source;
        this.file_pointer=0;
    }


    read(){
        if(this.file_pointer<0 || this.file_pointer>=this.source.length){
            return undefined;
        }
        return this.source[this.file_pointer++];
    }
    get eof(){
        return this.file_pointer>=this.source.length;
    }

    rewind(){
        this.file_pointer=0;
    }

    match(token){
        return this.remainder.search(token) === 0;
    }

    consumeMatch(token){
        let match=this.remainder.match(token);

        if(match && match.length && match.index === 0){
            this.file_pointer += match[0].length;

            return true;
        }

        return false;
    }

    readUntil(condition){
        let start_pointer=this.file_pointer;

        while (!this.eof && !condition(this)){
            this.file_pointer++;

        }

        return this.source.substring(start_pointer,this.file_pointer);
    }

    readIdentifier(){
        return this.readUntil((lexer)=> !lexer.match(/\w/));
    }

    skipWhiteSpace(){
        return this.readUntil((lexer)=> !lexer.match(/\s/));
    }

    get remainder(){
        return this.source.substring(this.file_pointer);
    }
}

function parser(html) {
    let lexer = new Lexer(html);


    function parseContent() {
        let text = '';
        let fragment=document.createDocumentFragment();

        while (!lexer.eof && !lexer.match('</')) {


            if(lexer.consumeMatch('<!--')){
                flushText();
                fragment.appendChild(parseComment());
            }else if(lexer.consumeMatch('<')){
                flushText();
                fragment.appendChild(parseElement());

            }

            else{

                text += lexer.read();


            }

        }

        function flushText() {
            if (text.length) {
                fragment.appendChild(document.createTextNode(text));
                text = "";
            }

        }

        flushText();

        return fragment;


    }
    
    function parseComment() {

        let commentText=lexer.readUntil(lex=>lex.match('-->'));
        lexer.consumeMatch('-->');

        return document.createComment(commentText);

        
    }

    function parseElement() {
        let tagName=lexer.readIdentifier();
        let element=document.createElement(tagName);
        let voidList=["area","base","br","col","embed","hr","img","input","link"
            ,"meta","param","source","track","wbr"];

        lexer.skipWhiteSpace();

        while (!lexer.eof && !lexer.match(/\/?>/)){
            element.setAttributeNode(parseAttribute());
            lexer.skipWhiteSpace();


        }





        if(voidList.includes(tagName)){
            lexer.consumeMatch(">");


        }
        else if(lexer.consumeMatch('>')){
            element.appendChild(parseContent());

            lexer.consumeMatch('</');
            lexer.readUntil(lexer=>lexer.consumeMatch('>'));

        }else {
            lexer.consumeMatch('/>');
        }
        return element;

    }

    function parseAttribute() {

        let attributeName=lexer.readIdentifier();
        let attribute=document.createAttribute(attributeName);


        if(lexer.consumeMatch(/\s*=\s*/)){
            let value;

            if (lexer.match(/['"]/)){
                let closingChar=lexer.read();

                value=lexer.readUntil(lexer=>lexer.match(closingChar));
                lexer.consumeMatch(closingChar);
            }else {

                value=lexer.readUntil(lexer=>lexer.match(/[\s\/>]/));

            }
            attribute.value=value;
        }

        return attribute;



    }

    return parseContent();


}


function prettyPrint(node){



    function printChildNodes(node) {

        let fragment=document.createDocumentFragment();

        node.childNodes.forEach((child)=>{
            fragment.appendChild(prettyPrint(child));

        });

        return fragment;

    }


    let voidList=["area","base","br","col","embed","hr","img","input","link"
        ,"meta","param","source","track","wbr"];

    switch (node.nodeType){
        case Node.DOCUMENT_FRAGMENT_NODE:{
            return printChildNodes(node);
        }
        case Node.COMMENT_NODE:{
            let comment=document.createElement('pp-comment');
            comment.innerText=node.nodeValue;

            return comment;
        }
        case Node.ELEMENT_NODE:{


            if(voidList.includes(node.nodeName.toLowerCase())){

                let element= document.createElement("pp-element");
                let opentag=document.createElement("pp-opentagvoid");
                let tagName= document.createElement("pp-tagnamevoid");

                tagName.innerText=node.nodeName.toLowerCase();
                opentag.appendChild(tagName);

                Array.from(node.attributes).forEach(attr=>{
                    opentag.appendChild(prettyPrint(attr));

                });

                element.appendChild(opentag);







                return element;



            }else {
                let element= document.createElement("pp-element");
                let opentag=document.createElement("pp-opentag");
                let tagName= document.createElement("pp-tagname");

                tagName.innerText=node.nodeName.toLowerCase();
                opentag.appendChild(tagName);

                Array.from(node.attributes).forEach(attr=>{
                    opentag.appendChild(prettyPrint(attr));

                });

                element.appendChild(opentag);

                if (node.hasChildNodes()){
                    element.appendChild(printChildNodes(node));
                }

                let closetag=document.createElement('pp-closetag');
                closetag.appendChild(tagName.cloneNode(true));
                element.appendChild(closetag)

                return element;

            }


        }
        case Node.ATTRIBUTE_NODE:{
            let attribute=document.createElement('pp-attribute');
            let attrName = document.createElement('pp-attrname');
            attrName.innerText=node.nodeName.toLowerCase();
            attribute.appendChild(attrName);

            if(node.nodeValue !== ""){
                let attrValue=document.createElement('pp-attrvalue');
                attrValue.innerText=node.nodeValue;
                attribute.appendChild(attrValue);
            }

            return attribute;
        }

        case Node.TEXT_NODE:{

            let text=document.createElement('pp-text');
            text.innerText=node.nodeValue;

            return text;


        }

    }


    return node.cloneNode(true);


}
