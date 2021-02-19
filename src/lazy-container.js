import {
  find,
  remove,
  assign,
  ArrayFrom
} from './util'
import Lazy from './lazy'

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
      this.lazy.add(el, assign({}, this.binding, {
        value: {
          src: 'dataset' in el ? el.dataset.src : el.getAttribute('data-src'),
          error: ('dataset' in el ? el.dataset.error : el.getAttribute('data-error')) || this.options.error,
          loading: ('dataset' in el ? el.dataset.loading : el.getAttribute('data-loading')) || this.options.loading
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

LazyContainer.install = (Vue, options = {}) => {
  const LazyClass = Lazy(Vue)
  const lazy = new LazyClass(options)
  const lazyContainer = new LazyContainer({ lazy })

  const isVue2 = Vue.version.split('.')[0] === '2'
  if (isVue2) {
    Vue.directive('lazy-container', {
      bind: lazyContainer.bind.bind(lazyContainer),
      componentUpdated: lazyContainer.update.bind(lazyContainer),
      unbind: lazyContainer.unbind.bind(lazyContainer)
    })
  } else {
    Vue.directive('lazy-container', {
      update (newValue, oldValue) {
        lazyContainer.update(this.el, {
          modifiers: this.modifiers || {},
          arg: this.arg,
          value: newValue,
          oldValue: oldValue
        }, {
          context: this.vm
        })
      },
      unbind () {
        lazyContainer.unbind(this.el)
      }
    })
  }
}
