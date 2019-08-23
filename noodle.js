function Noodle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio

  const cursor = { z: 0, a: { x: 0, y: 0 }, b: { x: 0, y: 0 }, mode: null, color: 'black' }

  this.install = function (host) {
    host.appendChild(this.el)

    window.addEventListener('resize', this.onResize, false)
    window.addEventListener('mousedown', this.onMouseDown, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('mouseup', this.onMouseUp, false)
    window.addEventListener('mouseover', this.onMouseOver, false)
    window.addEventListener('mouseout', this.onMouseOut, false)
    window.addEventListener('keydown', this.onKeyDown, false)
    window.addEventListener('keyup', this.onKeyUp, false)
    window.addEventListener('contextmenu', this.onMouseUp, false)

    this.fit()
  }

  this.start = function () {
    this.fit()
    cursor.mode = this.trace
  }

  this.fit = function (size = { w: window.innerWidth, h: window.innerHeight }) {
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = size.w + 'px'
    this.el.style.height = size.h + 'px'
  }

  // Modes

  this.trace = (a, b) => {
    const dx = Math.abs(b.x - a.x)
    const dy = -Math.abs(b.y - a.y)
    let err = dx + dy; let e2
    for (;;) {
      this.context.fillRect(a.x, a.y, 1, 1)
      if (a.x === b.x && a.y === b.y) { break }
      e2 = 2 * err
      if (e2 >= dy) { err += dy; a.x += (a.x < b.x ? 1 : -1) }
      if (e2 <= dx) { err += dx; a.y += (a.y < b.y ? 1 : -1) }
    }
  }

  this.drag = (a, b) => {
    const imageData = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height)
    this.context.putImageData(imageData, Math.floor((b.x - a.x) / 3) * 3, Math.floor((b.y - a.y) / 3) * 3)
    cursor.a.x = b.x
    cursor.a.y = b.y
  }

  this.tone = (a, b) => {
    for (let x = 0; x <= b.x - a.x; x++) {
      for (let y = 0; y <= b.y - a.y; y++) {
        const pos = { x: a.x + x, y: a.y + y }
        if (pos.x % 3 === 0 && pos.y % 3 === 0) {
          this.context.fillRect(pos.x, pos.y, 1, 1)
        }
      }
    }
  }

  // Events

  this.onMouseDown = (e) => {
    cursor.z = 1
    cursor.a.x = e.clientX
    cursor.a.y = e.clientY
    cursor.mode(cursor.a, cursor.a)
    e.preventDefault()
  }

  this.onMouseMove = (e) => {
    if (cursor.z !== 1) { return }
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    cursor.mode(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onMouseUp = (e) => {
    cursor.z = 0
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY
    cursor.mode(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onMouseOver = (e) => {

  }

  this.onMouseOut = (e) => {

  }

  this.onKeyDown = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'white'
    }
    if (e.key === 'Alt') {
      cursor.mode = this.drag
    }
    if (e.key === 'Control') {
      cursor.mode = this.tone
    }
    this.context.fillStyle = cursor.color
  }

  this.onKeyUp = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'black'
    }
    if (e.key === 'Alt') {
      cursor.mode = this.trace
    }
    if (e.key === 'Control') {
      cursor.mode = this.trace
    }
    if (e.key === 'Escape') {
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    this.context.fillStyle = cursor.color
  }

  this.onKeyPress = (e) => {

  }

  this.onResize = (e) => {
    // this.fit()
  }
}
