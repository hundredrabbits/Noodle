'us strict'

/* global cursor */

function Noodle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio

  this.install = function (host) {
    host.appendChild(this.el)
    window.addEventListener('mousedown', this.onMouseDown, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('mouseup', this.onMouseUp, false)
    window.addEventListener('keydown', this.onKeyDown, false)
    window.addEventListener('keyup', this.onKeyUp, false)
    window.addEventListener('contextmenu', this.onMouseUp, false)
    this.fit()
  }

  this.start = function () {
    this.fit()
    this.fill()
    this.set('trace')
  }

  this.fit = function (size = { w: window.innerWidth, h: window.innerHeight }) {
    this.el.width = size.w
    this.el.height = size.h
    this.el.style.width = size.w + 'px'
    this.el.style.height = size.h + 'px'
  }

  this.fill = (color = 'white') => {
    this.context.save()
    this.context.fillStyle = color
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.context.restore()
  }

  this.invert = () => {
    this.context.save()
    this.context.drawImage(this.el, 0, 0)
    this.context.globalCompositeOperation = 'difference'
    this.context.fillStyle = 'white'
    this.context.fillRect(0, 0, window.innerWidth, window.innerHeight)
    this.context.restore()
  }

  this.flip = () => {
    this.context.save()
    this.context.translate(window.innerWidth, 0)
    this.context.scale(-1, 1)
    this.context.drawImage(this.el, 0, 0)
    this.context.restore()
  }

  this.set = (mode = 'trace') => {
    if (!this[mode]) { return }
    document.title = `Noode — ${mode}[${window.innerWidth}x${window.innerHeight}]`
    cursor.mode = this[mode]
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
    const data = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height)
    this.context.putImageData(data, step((b.x - a.x) * 2, 6), step((b.y - a.y) * 2, 6))
    cursor.a.x = b.x
    cursor.a.y = b.y
  }

  this.tone = (a, b) => {
    for (let x = 0; x <= cursor.size; x++) {
      for (let y = 0; y <= cursor.size; y++) {
        const pos = { x: b.x + x - Math.floor(cursor.size / 2), y: b.y + y - Math.floor(cursor.size / 2) }
        if (pos.x % 3 === 0) {
          if (pos.y % 6 === 0) {
            this.context.fillRect(pos.x, pos.y, 1, 1)
          } else if (pos.y % 3 === 0) {
            this.context.fillRect(pos.x + 2, pos.y, 1, 1)
          }
        }
      }
    }
  }

  this.block = (a, b) => {
    for (let x = 0; x <= cursor.size; x++) {
      for (let y = 0; y <= cursor.size; y++) {
        const pos = { x: b.x + x - Math.floor(cursor.size / 2), y: b.y + y - Math.floor(cursor.size / 2) }
        this.context.fillRect(pos.x, pos.y, 1, 1)
      }
    }
  }

  this.line = (a, b) => {
    if (cursor.z !== 0) { return }
    this.trace(a, b)
  }

  this.noodle = (a, b, r = cursor.size) => {
    let x = -r
    let y = 0
    let err = 2 - 2 * r
    do {
      this.context.fillRect(b.x - x, b.y + y, 1, 1)
      this.context.fillRect(b.x - y, b.y - x, 1, 1)
      this.context.fillRect(b.x + x, b.y - y, 1, 1)
      this.context.fillRect(b.x + y, b.y + x, 1, 1)
      r = err
      if (r <= y) err += ++y * 2 + 1
      if (r > x || err > y) err += ++x * 2 + 1
    } while (x < 0)
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

  this.onKeyDown = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'white'
    } else if (e.key === 'Alt') {
      this.set('drag')
    } else if (e.key === 'Control' || e.key === 'Meta') {
      this.set('tone')
    } else if (e.key === '1') {
      this.set('trace')
    } else if (e.key === '2') {
      this.set('tone')
    } else if (e.key === '3') {
      this.set('block')
    } else if (e.key === '4') {
      this.set('line')
    } else if (e.key === '5') {
      this.set('drag')
    } else if (e.key === '9') {
      this.set('noodle')
    } else if (e.key === 'i') {
      this.invert()
    } else if (e.key === 'x') {
      this.flip()
    } else if (e.key === '[' && cursor.size > 0) {
      cursor.size -= 1
    } else if (e.key === ']' && cursor.size < 100) {
      cursor.size += 1
    }
    this.context.fillStyle = cursor.color
  }

  this.onKeyUp = (e) => {
    if (e.key === 'Shift') {
      cursor.color = 'black'
    } else if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
      this.set('trace')
    } else if (e.key === 'Escape' && e.shiftKey === true) {
      this.fill()
    } else if (e.key === 's') {
      grab(this.el.toDataURL('image/png'))
    }
    this.context.fillStyle = cursor.color
  }

  window.addEventListener('paste', async (e) => {
    e.preventDefault()
    e.stopPropagation()
    for (const item of e.clipboardData.items) {
      if (item.type.indexOf('image') < 0) { continue }
      const img = new Image()
      img.onload = () => {
        this.context.drawImage(img, 0, 0)
      }
      img.src = URL.createObjectURL(item.getAsFile())
    }
  })

  function grab (base64, name = 'export.png') {
    const link = document.createElement('a')
    link.setAttribute('href', base64)
    link.setAttribute('download', name)
    link.dispatchEvent(new MouseEvent(`click`, { bubbles: true, cancelable: true, view: window }))
  }

  function step (val, len) {
    return parseInt(val / len) * len
  }
}
