function Noodle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio

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
    window.addEventListener('keypress', this.onKeyPress, false)
    window.addEventListener('contextmenu', this.onMouseUp, false)

    this.fit()
  }

  this.start = function () {
    this.fit()
  }

  this.fit = function (size = { w: window.innerWidth, h: window.innerHeight }) {
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = size.w + 'px'
    this.el.style.height = size.h + 'px'
  }

  //

  this.trace = function (a, b) {
    const dx = Math.abs(b.x - a.x)
    const sx = a.x < b.x ? 1 : -1
    const dy = -Math.abs(b.y - a.y)
    const sy = a.y < b.y ? 1 : -1
    let err = dx + dy; let e2 /* error value e_xy */
    for (;;) { /* loop */
      this.context.fillRect(a.x, a.y, 1, 1)
      if (a.x === b.x && a.y === b.y) break
      e2 = 2 * err
      if (e2 >= dy) { err += dy; a.x += sx } /* x step */
      if (e2 <= dx) { err += dx; a.y += sy } /* y step */
    }
  }
  // Cursor

  const cursor = { z: 0, a: { x: 0, y: 0 }, b: { x: 0, y: 0 } }

  // Events

  this.onMouseDown = (e) => {
    cursor.z = 1
    cursor.a.x = e.clientX
    cursor.a.y = e.clientY
    this.trace(cursor.a, cursor.a)
    e.preventDefault()
  }

  this.onMouseMove = (e) => {
    if (cursor.z !== 1) { return }
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY

    this.trace(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onMouseUp = (e) => {
    cursor.z = 0
    cursor.b.x = e.clientX
    cursor.b.y = e.clientY

    this.trace(cursor.a, cursor.b)
    e.preventDefault()
  }

  this.onMouseOver = (e) => {

  }

  this.onMouseOut = (e) => {

  }

  this.onKeyDown = (e) => {
    if (e.key === 'Shift') {
      this.context.fillStyle = 'white'
    }
  }

  this.onKeyUp = (e) => {
    if (e.key === 'Shift') {
      this.context.fillStyle = 'black'
    }
    if (e.key === 'Escape') {
      this.context.clearRect(0, 0, window.innerWidth, window.innerHeight)
    }
    console.log(e)
  }

  this.onKeyPress = (e) => {

  }

  this.onResize = (e) => {
    // this.fit()
  }
}
