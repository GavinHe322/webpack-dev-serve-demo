// websocket 客户端
const io = require('socket.io-client/dist/socket.io')
// 和 hot/dev-server.js 公用一个 EventEmitter 实例，这里用于广播事件
const hotEmitter = require('./emitter')

// 最新编译的hash
let currentHash = 0
// 上一次编译生成的 hash，如果本地编译和上次hash一致，则不更新
let preveHash = 0

// 链接 websocket 服务器
const URL = '/'
const socket = io(URL)

// websocket 客户端监听事件
// 注册 hash 事件回调，这个回调主要干了一件事，获取最新的编译hash值
socket.on('hash', (hash) => {
  console.log('hash', hash)
  preveHash = currentHash
  currentHash = hash
})

// 注册ok事件回调
socket.on('ok', () => {
  if (currentHash !== preveHash) {
    reloadApp()
  }
})

// 客户端链接成功
socket.on('connect', () => {
  console.log('Client connect successfully')
})

// reloadApp 中广播 webpackHotUpdate 事件
const reloadApp = () => {
  hotEmitter.emit('webpackHotUpdate', currentHash)
}
