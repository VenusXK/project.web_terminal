const fs = require('fs');

// 同步读取上级目录下的所有文件到dir中

const express = require('express');
const app = express()
const marked = require('marked');
const hljs = require('highlight.js');

marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function(code){
        return hljs.highlightAuto(code).value;
    },
    //langPrefix: 'hljs language-', // highlight.js css expects a top-level 'hljs' class.
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartypants: false,
    xhtml: false
});

app.all('/get_exps', (Request, Response)=>{
    Response.setHeader('Access-Control-Allow-Origin', '*');
    Response.setHeader('Access-Control-Allow-Headers', '*');
    Response.setHeader('Access-Control-Request-Headers',"");
    Response.setHeader('Access-Control-Request-Method','*');
    const dir = fs.readdirSync('./实验/');
    const data = {exps:dir};
    Response.send(JSON.stringify(data));
    // console.log(data)
})
app.all('/find_folder2', (Request, Response)=>{
    Response.setHeader('Access-Control-Allow-Origin', '*');
    Response.setHeader('Access-Control-Allow-Headers', '*');
    Response.setHeader('Access-Control-Request-Headers',"");
    Response.setHeader('Access-Control-Request-Method','*');
    let folder1 = Request.query.folder1;
    const dir = fs.readdirSync('./实验/'+folder1);
    const data = {folders:dir};
    Response.send(JSON.stringify(data));
    // console.log(data)
})
app.all('/get_content', (Request, Response)=>{
    Response.setHeader('Access-Control-Allow-Origin', '*');
    Response.setHeader('Access-Control-Allow-Headers', '*');
    Response.setHeader('Access-Control-Request-Headers',"");
    Response.setHeader('Access-Control-Request-Method','*');
    let dir
    console.log(Request.query)
        dir = './实验/' + Request.query.exp + '/'+Request.query.doc_name
        console.log(dir)
        let content = marked.parse(fs.readFileSync(dir, 'utf-8'))
        console.log(content)
        const data = {content:content};
        Response.send(JSON.stringify(data));    
})
app.listen(9001, ()=>{
    console.log('9001 running meproject express')
})