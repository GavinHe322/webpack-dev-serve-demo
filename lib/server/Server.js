const path = require('path')
const http = require('http')
const express = require('express')
const mime = require('mime')
const socket = require('socket.io')
const MemoryFileSystem = require('memory-fs')
const updateCompiler = require('./updateCompiler')

class Server {
  constructor(compiler) {
    this.compiler = compiler
    this.currentHash = 0
    this.clientSocketList = []
    this.fs = null
    this.server = null
    this.app = null
    this.middleware = null

    updateCompiler(compiler)

    this.setupHooks()

    this.setupApp()

    this.setupDevMiddleware()

    this.routes()

    this.createServer()

    this.createSocketServer()
    
  }

  /**
   * 添加webpack的done事件回调
   */
  setupHooks() {
    let { compiler } = this
    compiler.hooks.done.tap('webpack-dev-server', (stats) => {
      // 每次编译都会产生一个唯一的hash值
      this.currentHash = stats.hash
      this.clientSocketList.forEach((socket) => {
        socket.emit('hash', this.currentHash)
        socket.emit('ok')
      })
    })
  }

  /**
   * 创建express实例app
   */
  setupApp() {
    this.app = new express()
  }
  
  /**
   * 添加webpack-dev-middleware中间件
   */
  setupDevMiddleware() {
    let { compiler } = this
    // 回监控文件的变化，当有文件改变(ctrl+s)的时候都会重新编译打包
    compiler.watch({}, () => {
      console.log('Compiled successfully!')
    })

    // 设置文件系统为内存文件系统，同时挂载到this上，以方便webserver中使用
    let fs = new MemoryFileSystem()
    this.fs = compiler.outputFileSystem = fs

    // express中间件，将编译的文件返回(这里不直接使用express的static中间件，因为我们要读取的文件在内存中，所以自己实现一款简易版的static中间件)
    const staticMiddleWare = (fileDir) => {
      return (req, res, next) => {
        let { url } = req
        if (url === '/favicon.ico') {
          return res.sendStatus(404)
        }
        url === '/' ? url = '/index.html' : null
        let filePath = path.join(fileDir, url)
        console.log(filePath, 'filePath')
        try {
          let statObj = this.fs.statSync(filePath)
          if (statObj.isFile()) {
            // 路径何原来写到磁盘的一样，只是这里是写到内存中了
            let content = this.fs.readFileSync(filePath)
            res.setHeader('Content-Type', mime.getType(filePath))
            res.send(content)
          }
        } catch (error) {
          res.sendStatus(404)
        }
      }
    }
    this.middleware = staticMiddleWare // 将中间件挂载在this实例上，以便app使用
  }

  /**
   * app中使用webpack-dev-middleware返回的中间件
   */
  routes() {
    let { compiler } = this
    // 经过webpack(config),将会 webpack.config.js 导出的对象 挂在compiler.options上
    let config = compiler.options
    // 使用webpack-dev-middleware导出的中间件
    this.app.use(this.middleware(config.output.path))
  }
  
  /**
   * 创建webserver服务器
   */
  createServer() {
    this.server = http.createServer(this.app)
  }

  /**
   * 创建websocket服务器
   */
  createSocketServer() {
    // socket.io + http服务 实现一个websocket
    const io = socket(this.server)
    io.on('connection', (socket) => {
      console.log('A new client connect server')
      // 把所有的websocket客户端存起来，以便编译完成后向这个websocket客户端发送信息（实现双向通信的关键）
      this.clientSocketList.push(socket)
      socket.on('disconnect', () => {
        this.clientSocketList = this.clientSocketList.splice(this.clientSocketList.indexOf(socket))
      })
      // 向客户端发送最新的一个编译hash
      socket.emit('hash', this.currentHash)
      socket.emit('ok')
    })
  }
  /**
   * 启动webserver服务，开始监听
   */
  listen(port, host = 'localhost', cb = new Function()) {
    this.server.listen(port, host, cb)
  }
}

module.exports = Server
