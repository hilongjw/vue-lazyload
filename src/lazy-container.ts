import {
  remove,
  assign
} from './util'
import { DirectiveBinding, VNode } from 'vue'
import Lazy from './lazy'

export default class LazyContainerMananger {
  lazy: Lazy;
  _queue: Array<LazyContainer>;
  constructor (lazy: Lazy) {
    this.lazy = lazy
    lazy.lazyContainerMananger = this
    this._queue = []
  }

  bind (el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const container = new LazyContainer(el, binding, vnode, this.lazy)
    this._queue.push(container)
  }

  update (el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const container = this._queue.find(item => item.el === el)
    if (!container) return
    container.update(el, binding)
  }

  unbind (el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    const container = this._queue.find(item => item.el === el)
    if (!container) return
    container.clear()
    remove(this._queue, container)
  }
}

const defaultOptions = {
  selector: 'img',
  error: '',
  loading: ''
}

type DefaultOptions = {
  selector: keyof HTMLElementTagNameMap,
  error: '',
  loading: ''
}

class LazyContainer {
  el: HTMLElement | null;
  _queue: Array<LazyContainer>;
  options: DefaultOptions;
  lazy: Lazy | null;
  binding: DirectiveBinding | null;
  vnode: VNode | null;
  constructor (el: HTMLElement, binding: DirectiveBinding, vnode: VNode, lazy: Lazy) {
    this.el = el
    this.vnode = vnode
    this.binding = binding
    this.options = {} as DefaultOptions
    this.lazy = lazy

    this._queue = []
    this.update(el, binding)
  }

  update (el: HTMLElement, binding: DirectiveBinding) {
    this.el = el
    this.options = assign({}, defaultOptions, binding.value)

    const imgs = this.getImgs()
    imgs.forEach((el: HTMLElement) => {
      this.lazy!.add(el, assign({}, this.binding, {
        value: {
          src: el.getAttribute('data-src') || el.dataset.src,
          error: el.getAttribute('data-error') || el.dataset.error || this.options.error,
          loading: el.getAttribute('data-loading') || el.dataset.loading || this.options.loading
        }
      }), this.vnode as VNode)
    })
  }

  getImgs (): Array<HTMLElement> {
    return Array.from(this.el!.querySelectorAll(this.options.selector))
  }

  clear () {
    const imgs = this.getImgs()
    imgs.forEach(el => this.lazy!.remove(el))

    this.vnode = null
    this.binding = null
    this.lazy = null
  }
}
