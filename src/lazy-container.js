import {
  assign,
  find,
  remove,
  ArrayFrom
} from './util'

export default class LazyContainerMananger {
  constructor ({ lazy }) {
    this.lazy = lazy
    lazy.lazyContainerMananger = this
    this._queue = []
  }

  bind (el, binding, vnode) {
    const container = new LazyContainer({ el, binding, vnode, lazy: this.lazy })
    this._queue.push(container)
  }

  update (el, binding, vnode) {
    const container = find(this._queue, item => item.el === el)
    if (!container) return
    container.update({ el, binding, vnode })
  }

  unbind (el, binding, vnode) {
    const container = find(this._queue, item => item.el === el)
    if (!container) return
    container.clear()
    remove(this._queue, container)
  }
}

const defaultOptions = {
  selector: 'img'
}

class LazyContainer {
  constructor ({ el, binding, vnode, lazy }) {
    this.el = null
    this.vnode = vnode
    this.binding = binding
    this.options = {}
    this.lazy = lazy

    this._queue = []
    this.update({ el, binding })
  }

  update ({ el, binding }) {
    this.el = el
    this.options = assign({}, defaultOptions, binding.value)
    const imgs = this.getImgs()
    imgs.forEach(el => {
      this.lazy.add(el, Object.assign({}, this.binding, {
        value: {
          src: el.getAttribute('data-src')
        }
      }), this.vnode)
    })
  }

  getImgs () {
    return ArrayFrom(this.el.querySelectorAll(this.options.selector))
  }

  clear () {
    const imgs = this.getImgs()
    imgs.forEach(el => this.lazy.remove(el))

    this.vnode = null
    this.binding = null
    this.lazy = null
  }
}
