import {
  inBrowser,
  remove,
  _,
  throttle,
  supportWebp,
  getDPR,
  scrollParent,
  getBestSelectionFromSrcset,
  assign,
  isObject,
  hasIntersectionObserver,
  modeType,
  ImageCache
} from './util'
import LazyContainerMananger from './lazy-container'
import { VueReactiveListener, VueLazyloadOptions } from '../types/index'

import ReactiveListener from './listener'
import {
  nextTick,
  VNode,
  DirectiveBinding
} from 'vue'

const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
const DEFAULT_OBSERVER_OPTIONS = {
  rootMargin: '0px',
  threshold: 0
}

type TeventType = 'loading' | 'loaded' | 'error'

type Tlistener = {
  [key: string]: any;
  state: {
    loading?: boolean;
    loaded?: boolean;
    error?: boolean;
    attempt?: number;
    rendered?: boolean;
  };
  el: any;
  rect: object
  checkInView: () => boolean;
  load: () => void;
}

export type TvalueFormatterParam = string | Pick<VueLazyloadOptions, 'loading' | 'error'> & { src: string }


class Lazy {
  version: string;
  mode: string;
  ListenerQueue: Array<Tlistener>;
  TargetIndex: number;
  TargetQueue: Array<any>;
  options: VueLazyloadOptions;
  lazyLoadHandler: () => void;
  _imageCache: any;
  _observer?: IntersectionObserver | null;
  lazyContainerMananger: LazyContainerMananger | null;
  Event!: {
    listeners: {
      loading: Array<any>
      loaded: Array<any>
      error: Array<any>
    }
  };
  $on!: (event: TeventType, func: Function) => void;
  $once!: (event: TeventType, func: Function) => void
  $off!: (event: TeventType, func: Function) => void
  $emit!: (event: TeventType, context: any, inCache: boolean) => void
  constructor ({
    preLoad,
    error,
    throttleWait,
    preLoadTop,
    dispatchEvent,
    loading,
    attempt,
    silent = true,
    scale,
    listenEvents,
    filter,
    adapter,
    observer,
    observerOptions
  }:VueLazyloadOptions) {
    this.version = '__VUE_LAZYLOAD_VERSION__'
    this.lazyContainerMananger = null;
    this.mode = modeType.event
    this.ListenerQueue = []
    this.TargetIndex = 0
    this.TargetQueue = []
    this.options = {
      silent: silent,
      dispatchEvent: !!dispatchEvent,
      throttleWait: throttleWait || 200,
      preLoad: preLoad || 1.3,
      preLoadTop: preLoadTop || 0,
      error: error || DEFAULT_URL,
      loading: loading || DEFAULT_URL,
      attempt: attempt || 3,
      scale: scale || getDPR(scale),
      listenEvents: listenEvents || DEFAULT_EVENTS,
      supportWebp: supportWebp(),
      filter: filter || {},
      adapter: adapter || {},
      observer: !!observer,
      observerOptions: observerOptions || DEFAULT_OBSERVER_OPTIONS
    }
    this._initEvent()
    this._imageCache = new ImageCache(200)
    this.lazyLoadHandler = throttle(this._lazyLoadHandler.bind(this), this.options.throttleWait!)

    this.setMode(this.options.observer ? modeType.observer : modeType.event)
  }

  /**
   * output listener's load performance
   * @return {Array}
   */
  performance () {
    const list: Array<VueReactiveListener> = []

    this.ListenerQueue.map(item => list.push(item.performance()))

    return list
  }

  /*
   * add lazy component to queue
   * @param  {Vue} vm lazy component instance
   * @return
   */
  addLazyBox (vm: Tlistener) {
    this.ListenerQueue.push(vm)
    if (inBrowser) {
      this._addListenerTarget(window)
      this._observer && this._observer.observe(vm.el)
      if (vm.$el && vm.$el.parentNode) {
        this._addListenerTarget(vm.$el.parentNode)
      }
    }
  }

  /*
   * add image listener to queue
   * @param  {DOM} el
   * @param  {object} binding vue directive binding
   * @param  {vnode} vnode vue directive vnode
   * @return
   */
  add (el: HTMLElement, binding: DirectiveBinding, vnode: VNode) {
    if (this.ListenerQueue.some(item => item.el === el)) {
      this.update(el, binding)
      return nextTick(this.lazyLoadHandler)
    }

    let { src, loading, error, cors } = this._valueFormatter(binding.value)

    nextTick(() => {
      src = getBestSelectionFromSrcset(el, this.options.scale as number) || src
      this._observer && this._observer.observe(el)

      const container: string = Object.keys(binding.modifiers)[0]

      let $parent: any

      if (container) {
        $parent = binding.instance!.$refs[container]
        // if there is container passed in, try ref first, then fallback to getElementById to support the original usage
        $parent = $parent ? $parent.el || $parent : document.getElementById(container)
      }

      if (!$parent) {
        $parent = scrollParent(el)
      }

      const newListener = new ReactiveListener(
        el,
        src,
        error!,
        loading!,
        binding.arg!,
        $parent,
        this.options,
        cors!,
        this._elRenderer.bind(this),
        this._imageCache
      )

      this.ListenerQueue.push(newListener)

      if (inBrowser) {
        this._addListenerTarget(window)
        this._addListenerTarget($parent)
      }

      nextTick(this.lazyLoadHandler)
    })
  }

  /**
  * update image src
  * @param  {DOM} el
  * @param  {object} vue directive binding
  * @return
  */
  update (el: HTMLElement, binding: DirectiveBinding, vnode?: VNode) {
    let { src, loading, error } = this._valueFormatter(binding.value)
    src = getBestSelectionFromSrcset(el, this.options.scale!) || src

    const exist = this.ListenerQueue.find(item => item.el === el)
    if (!exist) {
      // https://github.com/hilongjw/vue-lazyload/issues/374
      if (el.getAttribute('lazy') !== 'loaded' || el.dataset.src !== src) {
        this.add(el, binding, vnode!)
      }
    } else {
      exist.update({
        src,
        loading,
        error
      })
    }
    if (this._observer) {
      this._observer.unobserve(el)
      this._observer.observe(el)
    }

    nextTick(this.lazyLoadHandler)
  }

  /**
  * remove listener form list
  * @param  {DOM} el
  * @return
  */
  remove (el: HTMLElement) {
    if (!el) return
    this._observer && this._observer.unobserve(el)
    const existItem = this.ListenerQueue.find(item => item.el === el)
    if (existItem) {
      this._removeListenerTarget(existItem.$parent)
      this._removeListenerTarget(window)
      remove(this.ListenerQueue, existItem)
      existItem.$destroy && existItem.$destroy()
    }
  }

  /*
   * remove lazy components form list
   * @param  {Vue} vm Vue instance
   * @return
   */
    removeComponent (vm: Tlistener) {
    if (!vm) return
    remove(this.ListenerQueue, vm)
    this._observer && this._observer.unobserve(vm.el)
    if (vm.$parent && vm.$el.parentNode) {
      this._removeListenerTarget(vm.$el.parentNode)
    }
    this._removeListenerTarget(window)
  }

  setMode (mode: string) {
    if (!hasIntersectionObserver && mode === modeType.observer) {
      mode = modeType.event
    }

    this.mode = mode // event or observer

    if (mode === modeType.event) {
      if (this._observer) {
        this.ListenerQueue.forEach(listener => {
          this._observer!.unobserve(listener.el as Element)
        })
        this._observer = null
      }

      this.TargetQueue.forEach(target => {
        this._initListen(target.el, true)
      })
    } else {
      this.TargetQueue.forEach(target => {
        this._initListen(target.el, false)
      })
      this._initIntersectionObserver()
    }
  }

  /*
  *** Private functions ***
  */

  /*
   * add listener target
   * @param  {DOM} el listener target
   * @return
   */
  _addListenerTarget (el: HTMLElement | Window) {
    if (!el) return
    let target = this.TargetQueue.find(target => target.el === el)
    if (!target) {
      target = {
        el: el,
        id: ++this.TargetIndex,
        childrenCount: 1,
        listened: true
      }
      this.mode === modeType.event && this._initListen(target.el, true)
      this.TargetQueue.push(target)
    } else {
      target.childrenCount++
    }
    return this.TargetIndex
  }

  /*
   * remove listener target or reduce target childrenCount
   * @param  {DOM} el or window
   * @return
   */
  _removeListenerTarget (el: HTMLElement | Window & typeof globalThis) {
    this.TargetQueue.forEach((target, index) => {
      if (target.el === el) {
        target.childrenCount--
        if (!target.childrenCount) {
          this._initListen(target.el, false)
          this.TargetQueue.splice(index, 1)
          target = null
        }
      }
    })
  }

  /*
   * add or remove eventlistener
   * @param  {DOM} el DOM or Window
   * @param  {boolean} start flag
   * @return
   */
  _initListen (el: HTMLElement, start: boolean) {
    this.options.listenEvents!.forEach((evt) => _[start ? 'on' : 'off'](el, evt, this.lazyLoadHandler))
  }

  _initEvent () {
    this.Event = {
      listeners: {
        loading: [],
        loaded: [],
        error: []
      }
    }

    this.$on = (event, func) => {
      if (!this.Event.listeners[event]) this.Event.listeners[event] = []
      this.Event.listeners[event].push(func)
    }

    this.$once = (event, func) => {
      const vm = this
      function on () {
        vm.$off(event, on)
        func.apply(vm, arguments)
      }
      this.$on(event, on)
    }

    this.$off = (event, func) => {
      if (!func) {
        if (!this.Event.listeners[event]) return
        this.Event.listeners[event].length = 0
        return
      }
      remove(this.Event.listeners[event], func)
    }

    this.$emit = (event, context, inCache) => {
      if (!this.Event.listeners[event]) return
      this.Event.listeners[event].forEach(func => func(context, inCache))
    }
  }

  /**
   * find nodes which in viewport and trigger load
   * @return
   */
  _lazyLoadHandler () {
    const freeList: Array<Tlistener> = []
    this.ListenerQueue.forEach((listener, index) => {
      if (!listener.el || !listener.el.parentNode || listener.state.loaded) {
        freeList.push(listener)
      }
      const catIn = listener.checkInView()
      if (!catIn) return
      if (!listener.state.loaded) listener.load()
    })
    freeList.forEach(item => {
      remove(this.ListenerQueue, item)
      item.$destroy && item.$destroy()
    })
  }

  /**
  * init IntersectionObserver
  * set mode to observer
  * @return
  */
  _initIntersectionObserver () {
    if (!hasIntersectionObserver) return
    this._observer = new IntersectionObserver(this._observerHandler.bind(this), this.options.observerOptions)
    if (this.ListenerQueue.length) {
      this.ListenerQueue.forEach(listener => {
        this._observer!.observe(listener.el as Element)
      })
    }
  }

  /**
  * init IntersectionObserver
  * @param {Array<IntersectionObserverEntry>} entries
  * @return
  */
  _observerHandler (entries: Array<IntersectionObserverEntry>) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        this.ListenerQueue.forEach(listener => {
          if (listener.el === entry.target) {
            if (listener.state.loaded) return this._observer!.unobserve(listener.el as Element)
            listener.load()
          }
        })
      }
    })
  }

  /**
  * set element attribute with image'url and state
  * @param  {ReactiveListener} lazyload listener object
  * @param  {TeventType} state will be rendered
  * @param  {bool} inCache  is rendered from cache
  * @return
  */
  _elRenderer (listener: ReactiveListener, state: TeventType, cache: boolean) {
    if (!listener.el) return
    const { el, bindType } = listener

    let src
    switch (state) {
      case 'loading':
        src = listener.loading
        break
      case 'error':
        src = listener.error
        break
      default:
        src = listener.src
        break
    }

    if (bindType) {
      // @ts-ignore
      el.style[bindType] = 'url("' + src + '")'
    } else if (el.getAttribute('src') !== src) {
      el.setAttribute('src', src!)
    }

    el.setAttribute('lazy', state)

    this.$emit(state, listener, cache)
    this.options.adapter[state] && this.options.adapter[state](listener, this.options)

    if (this.options.dispatchEvent) {
      const event = new CustomEvent(state, {
        detail: listener
      })
      el.dispatchEvent(event)
    }
  }

  _valueFormatter (
    value: TvalueFormatterParam
  )
  {
    if (typeof value === 'object') {
      if (!value.src && !this.options.silent) console.error('Vue Lazyload warning: miss src with ' + value)
      return {
        src: value.src,
        loading: value.loading || this.options.loading,
        error: value.error || this.options.error,
        cors: this.options.cors
      }
    }
    return {
      src: value,
      loading: this.options.loading,
      error: this.options.error,
      cors: this.options.cors
    }
  }
}

export default Lazy