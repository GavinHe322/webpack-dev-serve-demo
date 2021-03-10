const target = document.getElementById('content')

let content = '测试热更新...'

let style = {
  color: 'red',
  fontSize: '100px'
}

console.log('welcome webpack-dev-server')

const render = () => {
  target.innerText = content + (Math.random() * 1000)
  target.style.color = style.color
  target.fontSize = style.fontSize
}

render()
