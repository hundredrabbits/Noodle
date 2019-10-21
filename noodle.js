'use strict'

/* global cursor MouseEvent Image */

function Noodle () {
  this.el = document.createElement('canvas')
  this.context = this.el.getContext('2d')
  this.ratio = window.devicePixelRatio
  this.offset = { x: 0, y: 0 }
  this.tainted = false

  this.install = function (host) {
    host.appendChild(this.el)
    window.addEventListener('mousedown', this.onMouseDown, false)
    window.addEventListener('mousemove', this.onMouseMove, false)
    window.addEventListener('mouseup', this.onMouseUp, false)
    window.addEventListener('touchstart', this.onMouseDown, { capture: false, passive: false })
    window.addEventListener('touchmove', this.onMouseMove, { capture: false, passive: false })
    window.addEventListener('touchend', this.onMouseUp, { capture: false, passive: false })
    window.addEventListener('keydown', this.onKeyDown, false)
    window.addEventListener('keyup', this.onKeyUp, false)
    window.addEventListener('contextmenu', this.onContext, false)
    window.addEventListener('dragover', this.onDrag, false)
    window.addEventListener('drop', this.onDrop, false)
    window.addEventListener('paste', this.onPaste, false)
    window.addEventListener('beforeunload', this.onUnload, false)
  }

  this.start = function (w = window.innerWidth - 15, h = window.innerHeight - 15) {
    this.resize(w, h)
    this.fill()
    this.set('trace')
  }

  this.fill = (color = 'white') => {
    this.context.save()
    this.context.fillStyle = color
    this.context.fillRect(0, 0, this.el.width, this.el.height)
    this.context.restore()
  }

  this.resize = (w, h) => {
    document.location.hash = `#${w}x${h}`
    this.el.width = w
    this.el.height = h
    this.el.style.width = w + 'px'
    this.el.style.height = h + 'px'
    this.center()
    this.fill()
    this.update()
  }

  this.invert = () => {
    this.context.save()
    this.context.drawImage(this.el, 0, 0)
    this.context.globalCompositeOperation = 'difference'
    this.context.fillStyle = 'white'
    this.context.fillRect(0, 0, this.el.width, this.el.height)
    this.context.restore()
  }

  this.flip = () => {
    this.context.save()
    this.context.translate(this.el.width, 0)
    this.context.scale(-1, 1)
    this.context.drawImage(this.el, 0, 0)
    this.context.restore()
  }

  this.draw = (file) => {
    if (!file) { console.warn('No file to draw'); return }
    if (file.type !== 'image/png' && file.type !== 'image/jpeg') { console.warn('File is not jpg/png'); return }
    const img = new Image()
    img.onload = () => {
      this.context.drawImage(img, 0, 0)
      this.cache = img
      this.filter(_correct)
    }
    img.src = URL.createObjectURL(file)
  }

  this.update = () => {
    const px = cursor.mode !== 'trace' ? ' ' + cursor.size + 'px' : ''
    const rs = ` ${this.el.width}x${this.el.height}`
    document.title = `${cursor.mode} ${cursor.color}${px}${rs}`
  }

  this.filter = (_fn, w = this.el.width, h = this.el.height) => {
    const data = this.context.getImageData(0, 0, w, h).data
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        this.context.fillStyle = _fn(x, y, w, h, read(x, y, w, h, data), data)
        this.pixel(x, y)
      }
    }
    this.context.fillStyle = 'black'
  }

  this.set = (mode = 'trace') => {
    if (!this[mode]) { console.warn('Unknown mode: ', mode); return }
    cursor.mode = mode
    this.update()
  }

  this.color = (color) => {
    cursor.color = color
    this.update()
  }

  this.size = (mod) => {
    if (cursor.size + mod > 0 && cursor.size + mod < 100) {
      cursor.size += mod
    }
    this.update()
  }

  // Modes

  this.trace = (a, b) => {
    const dx = Math.abs(b.x - a.x)
    const dy = -Math.abs(b.y - a.y)
    let err = dx + dy; let e2
    for (;;) {
      this.pixel(a.x, a.y)
      if (a.x === b.x && a.y === b.y) { break }
      e2 = 2 * err
      if (e2 >= dy) { err += dy; a.x += (a.x < b.x ? 1 : -1) }
      if (e2 <= dx) { err += dx; a.y += (a.y < b.y ? 1 : -1) }
    }
  }

  this.pattern = (a, b, pat) => {
    for (let x = 0; x < cursor.size; x++) {
      for (let y = 0; y < cursor.size; y++) {
        const pos = { x: Math.floor(b.x + x - (cursor.size / 2)), y: Math.floor(b.y + y - (cursor.size / 2)) }
        if (pat(pos.x, pos.y) === true) {
          this.pixel(pos.x, pos.y)
        }
      }
    }
  }

  this.circle = (a, b) => {
    let r = Math.floor(cursor.size / 2)
    let x = -r
    let y = 0
    let err = 2 - 2 * r
    do {
      this.pixel(b.x - x, b.y + y)
      this.pixel(b.x - y, b.y - x)
      this.pixel(b.x + x, b.y - y)
      this.pixel(b.x + y, b.y + x)
      r = err
      if (r <= y) err += ++y * 2 + 1
      if (r > x || err > y) err += ++x * 2 + 1
    } while (x < 0)
  }

  this.pixel = (x, y) => {
    this.context.fillRect(Math.floor(x), Math.floor(y), 1, 1)
  }

  this.tone = (a, b) => {
    this.pattern(a, b, _halftone)
  }

  this.block = (a, b) => {
    this.pattern(a, b, _block)
  }

  this.hor = (a, b) => {
    this.pattern(a, b, _hor)
  }

  this.ver = (a, b) => {
    this.pattern(a, b, _ver)
  }

  this.dot = (a, b) => {
    this.pattern(snap(a), snap(b), _dot)
  }

  this.deco = (a, b) => {
    cursor.deco++
    this.pattern(snap(a), snap(b), _deco)
  }

  this.line = (a, b, e) => {
    if (cursor.z !== 0) { return }
    if (e.metaKey || e.ctrlKey) {
      const offset = { x: Math.abs(a.x - b.x), y: Math.abs(a.y - b.y) }
      this.trace(a, offset.x > offset.y ? { x: b.x, y: a.y } : { x: a.x, y: b.y })
    } else {
      this.trace(a, b)
    }
  }

  this.drag = (a, b) => {
    const data = this.context.getImageData(0, 0, this.context.canvas.width, this.context.canvas.height)
    this.context.putImageData(data, step((b.x - a.x) * 2, 6), step((b.y - a.y) * 2, 6))
    cursor.a.x = b.x
    cursor.a.y = b.y
  }

  this.move = (x, y, leap = false) => {
    this.offset.x -= x * (leap ? 100 : 50)
    this.offset.y -= y * (leap ? 100 : 50)
    this.el.setAttribute('style', `left:${this.offset.x}px;top:${-this.offset.y}px`)
  }

  this.center = () => {
    this.offset.x = (window.innerWidth - this.el.width) / 2
    this.offset.y = -(window.innerHeight - this.el.height) / 2
    this.el.setAttribute('style', `left:${parseInt(this.offset.x)}px;top:${-parseInt(this.offset.y)}px`)
  }

  this.open = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.onchange = e => {
      this.draw(e.target.files[0])
    }
    input.click()
  }

  // Events

  this.onMouseDown = (e) => {
    cursor.z = 1
    cursor.a.x = (e.clientX || e.touches[0].clientX) - this.offset.x
    cursor.a.y = (e.clientY || e.touches[0].clientY) + this.offset.y
    if (e.button > 1) {
      this.set('line')
    }
    this[cursor.mode](cursor.a, cursor.a, e)
    e.preventDefault()
  }

  this.onMouseMove = (e) => {
    if (cursor.z === 1) {
      cursor.b.x = (e.clientX || e.touches[0].clientX) - this.offset.x
      cursor.b.y = (e.clientY || e.touches[0].clientY) + this.offset.y
      this[cursor.mode](cursor.a, cursor.b, e)
    }
    e.preventDefault()
  }

  this.onMouseUp = (e) => {
    this.tainted = true
    cursor.z = 0
    cursor.b.x = (e.clientX || e.changedTouches[0].clientX) - this.offset.x
    cursor.b.y = (e.clientY || e.changedTouches[0].clientY) + this.offset.y
    this[cursor.mode](cursor.a, cursor.b, e)
    if (e.button > 1) {
      this.set('trace')
    }
    e.preventDefault()
  }

  this.onKeyDown = (e) => {
    if (e.key === 'Shift') {
      this.color('white')
    } else if (e.key === 'Alt') {
      this.set('drag')
    } else if (e.key === '1') {
      this.set('trace')
    } else if (e.key === '2') {
      this.set('tone')
    } else if (e.key === '3') {
      this.set('block')
    } else if (e.key === '4') {
      this.set('circle')
    } else if (e.key === '5') {
      this.set('hor')
    } else if (e.key === '6') {
      this.set('ver')
    } else if (e.key === '7') {
      this.set('dot')
    } else if (e.key === '8') {
      this.set('deco')
    } else if (e.key === '0') {
      this.set('drag')
    } else if (e.key === 'i') {
      this.invert()
    } else if (e.key === 'f') {
      this.flip()
    } else if (e.key === 'q') {
      this.center()
    } else if (e.key === 'o') {
      this.open()
    } else if (e.key === '[' || e.key === 'z') {
      this.size(-1)
    } else if (e.key === ']' || e.key === 'x') {
      this.size(1)
    } else if (e.key === 'ArrowDown' || e.key === 's') {
      this.move(0, -1, e.shiftKey)
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
      this.move(0, 1, e.shiftKey)
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
      this.move(1, 0, e.shiftKey)
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
      this.move(-1, 0, e.shiftKey)
    } else if (e.key === 'Escape') {
      this.center()
      this.filter(_correct)
    } else if (e.key === 'Tab') {
      this.filter(_jagged)
      e.preventDefault()
    }
    this.context.fillStyle = cursor.color
  }

  this.onKeyUp = (e) => {
    if (e.key === 'Shift') {
      this.color('black')
    } else if (e.key === 'Backspace' && e.shiftKey === true) {
      this.fill()
    } else if (e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta' || e.key === 'Escape') {
      this.set('trace')
    } else if (e.key === 'e') {
      grab(this.el.toDataURL('image/png'))
    }
    this.context.fillStyle = cursor.color
  }

  this.onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    this.draw(file)
  }

  this.onDrag = (e) => {
    e.stopPropagation()
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  this.onPaste = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    for (const item of e.clipboardData.items) {
      if (item.type.indexOf('image') < 0) { continue }
      this.draw(item.getAsFile())
    }
  }

  this.onUnload = (e) => {
    if (this.tainted !== true) { return }
    const confirmationMessage = '\o/';
    (e || window.event).returnValue = confirmationMessage
    return confirmationMessage
  }

  this.onContext = (e) => {
    e.stopPropagation()
    e.preventDefault()
    return false
  }

  function grab (base64, name = 'export.png') {
    const link = document.createElement('a')
    link.setAttribute('href', base64)
    link.setAttribute('download', name)
    link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }))
  }

  function step (val, len) {
    return parseInt(val / len) * len
  }

  function snap (pos) {
    return { x: step(pos.x + (cursor.size / 2), cursor.size), y: step(pos.y + (cursor.size / 2), cursor.size) }
  }

  // Textures

  function _halftone (x, y) {
    return (x % 3 === 0 && y % 6 === 0) || (x % 3 === 2 && y % 6 === 3)
  }

  function _block (x, y) {
    return true
  }

  function _hor (x, y) {
    return y % (cursor.size / 2) === 0
  }

  function _ver (x, y) {
    return x % (cursor.size / 2) === 0
  }

  function _dot (x, y) {
    return x % cursor.size === 0 && y % cursor.size === 0
  }

  function _deco (x, y) {
    const sp = { x: (x + (cursor.size / 2)) % cursor.size, y: (y + (cursor.size / 2)) % cursor.size }
    return cursor.deco % 4 === 0 ? sp.x <= sp.y : cursor.deco % 4 === 1 ? sp.x >= sp.y : cursor.deco % 4 === 2 ? cursor.size - sp.x <= sp.y : cursor.size - sp.x >= sp.y
  }

  // Filters

  function _correct (x, y, w, h, pixel, data) {
    const l = lum(pixel)
    if (pixel[0] === 255 && pixel[1] === 0 && pixel[2] === 0) { return 'black' }
    return l > 175 ? 'white' : l < 100 ? 'black' : _halftone(x, y) === true ? 'black' : 'white'
  }

  function _jagged (x, y, w, h, pixel, data) {
    const neighs = neighbors(x, y, w, h, data)
    if (abs(pixel) && abs(neighs.n) && abs(neighs.e) && !abs(neighs.ne) && (!abs(neighs.s) || !abs(neighs.w))) { return 'red' }
    if (abs(pixel) && abs(neighs.n) && abs(neighs.w) && !abs(neighs.nw) && (!abs(neighs.s) || !abs(neighs.e))) { return 'red' }
    if (abs(pixel) && abs(neighs.s) && abs(neighs.e) && !abs(neighs.se) && (!abs(neighs.n) || !abs(neighs.w))) { return 'red' }
    if (abs(pixel) && abs(neighs.s) && abs(neighs.w) && !abs(neighs.sw) && (!abs(neighs.n) || !abs(neighs.e))) { return 'red' }
    return abs(pixel) ? 'black' : 'white'
  }

  function neighbors (x, y, w, h, data) {
    return { n: read(x, y + 1, w, h, data), ne: read(x + 1, y + 1, w, h, data), e: read(x + 1, y, w, h, data), se: read(x + 1, y - 1, w, h, data), s: read(x, y - 1, w, h, data), sw: read(x - 1, y - 1, w, h, data), w: read(x - 1, y, w, h, data), nw: read(x - 1, y + 1, w, h, data) }
  }

  // Each

  function lum (pixel) { // Returns the luminance of a color.
    return Math.floor(0.2126 * pixel[0] + 0.7152 * pixel[1] + 0.0722 * pixel[2])
  }

  function abs (pixel) { // Returns true/false for a pixel.
    return lum(pixel) === 0
  }

  function read (x, y, w, h, data) { // Returns the rgb of a pixel.
    if (x < 0 || x > w || y < 0 || y > h) { return false }
    const id = ((y * w) + (x % w)) * 4
    return [data[id], data[id + 1], data[id + 2]]
  }
}
