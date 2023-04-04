
// 调包
const express = require('express');
const expressWs = require('express-ws')
const os = require("os");
const pty = require("node-pty");
const TERMINAL_PORT=9002
const app = express()
const terminals = {}, logs = {}

// 当为win32时，返回false，表示不使用二进制模式
// const USE_BINARY = os.platform() !== "win32";
const USE_BINARY = os.platform() !== "linux";
console.log(os.platform())
const URL = "122.9.163.105";
// const URL = "127.0.0.1";

// express升级为websocket-express
expressWs(app);

// 端口监听和信息返回
app.listen(TERMINAL_PORT);
console.log('App listening to http://' + URL + ":" + TERMINAL_PORT);
console.log("wss linsting on " + TERMINAL_PORT)


//设置允许跨域访问该服务.
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Methods', '*')
  res.header('Content-Type', 'application/json;charset=utf-8')
  next()
})

app.post('/terminals', (req, res) => {

    // 把进程变量复制过来
    const env = Object.assign({}, process.env)
    // 解析传入参数的长、宽高
    // 通过pty初始化terminal
    let term = pty.spawn(process.platform === 'win32' ? 'cmd.exe' : 'bash', [], {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: env.PWD,
            env: env,
            encoding: 'utf8'
        })
    // 输出创建的终端id
    console.log('Created terminal with PID: ' + term.pid)
    // 将终端加入终端池
    terminals[term.pid] = term
    // 创建记录交互信息的存储值
    logs[term.pid] = ''
    term.write("su visitor \r")
    term.write("clear\r")

    setTimeout(() => {
        term.write("figlet Code Here\r");
    }, 200);
    // 将终端返回的数据记录到存储内容内
    term.onData(function (data) {
        logs[term.pid] += data
    })
    // 向前端发送终端的id
    res.send(term.pid.toString())
    res.end()
})

// Express的websocket接口
app.ws('/terminals/:pid', function (ws, req) {
    // 根据pid获取之前创建好的terminal
    const term = terminals[parseInt(req.params.pid)]
    // console.log('Connected to terminal ' + term.pid)
    // 根据pid返回控制台返回的信息
    ws.send(logs[term.pid])

    // 创建返回函数
    // 当为win32时，USE_BINARY返回false，表示不使用二进制模式，执行buffer()函数
    const send = USE_BINARY ? bufferUtf8(ws, 5) : buffer(ws, 5);

    let exit = ""
    let flag = 1;

    // xterm封装的terminal的监听函数
    term.on('data', function (data) {
        try{
            send(data);
            // if(flag){
            //     send(data);
            // }
            // else{
            //     send("\t!!don't exit or logout!!")
            //     term.kill();
            //     delete terminals[term.pid];
            //     delete logs[term.pid];
            // }
        }catch(ex){
            console.log(ex);
        }
    })


    // websocket的监听函数，terminal内输入的数据显示在terminal内
    ws.on('message', function (msg) {
        // exit += msg;
        // console.log(exit)
        // if(exit.indexOf("exit")!=-1){
        //     flag = 0;
        //     console.log("the visitor is exiting");
        // }
        // else if(exit.indexOf("logout")!=-1){
        //     flag = 0;
        //     console.log("the visitor is loging out");
        // }
        term.write(msg);
    })

    // websocket关闭函数，结束使用websocket
    ws.on('close', function(){
        // 杀死终端
        term.kill();
        console.log('Closed terminal ' + term.pid);
        // 删除数组内容
        delete terminals[term.pid];
        delete logs[term.pid];
    })

})



// string message buffering
function buffer(socket, timeout) {
  let str = '';
  let sender = null;
  return(data)=>{
      str += data;
      if(!sender){// 若sender为空，则继续执行
        sender = setTimeout(() => {
            socket.send(str);
            str = '';
            sender = null;
        }, timeout);
      }
  }
}

// binary message buffering
function bufferUtf8(socket, timeout) {
    let buffer = [];
    let sender = null;
    let length = 0;
    return(data)=>{
        buffer.push(data);
        length += data.length;
        if(!sender){
            sender = setTimeout(() => {
                socket.send(Buffer.concat(buffer, length));
                buffer = [];
                sender = null;
                length = 0;
            }, timeout);
        }
    }
}

// 监听端口

