import {
  inBrowser,
  CustomEvent,
  remove,
  some,
  find,
  _,
  throttle,
  supportWebp,
  getDPR,
  scrollParent,
  getBestSelectionFromSrcset,
  assign,
  isObject,
  hasIntersectionObserver,
  modeType
} from './util'

import ReactiveListener from './listener'

const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']
const DEFAULT_OBSERVER_OPTIONS = {
  rootMargin: '0px',
  threshold: 0
}

const DEFAULT_LAZYLOAD_COMPONENT_OPTIONS = {
  observeBottom: true
}

export default function (Vue) {
  return class Lazy {
    constructor ({ preLoad, error, throttleWait, preLoadTop, dispatchEvent, loading, attempt, silent = true, scale, listenEvents, hasbind, filter, adapter, observer, observerOptions, lazyComponentOptions }) {
      this.version = '__VUE_LAZYLOAD_VERSION__'
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
        ListenEvents: listenEvents || DEFAULT_EVENTS,
        hasbind: false,
        supportWebp: supportWebp(),
        filter: filter || {},
        adapter: adapter || {},
        observer: !!observer,
        observerOptions: observerOptions || DEFAULT_OBSERVER_OPTIONS,
        lazyComponentOptions: lazyComponentOptions || DEFAULT_LAZYLOAD_COMPONENT_OPTIONS
      }
      this._initEvent()

      this.lazyLoadHandler = throttle(this._lazyLoadHandler.bind(this), this.options.throttleWait)

      this.setMode(this.options.observer ? modeType.observer : modeType.event)
    }

    /**
     * update config
     * @param  {Object} config params
     * @return
     */
    config (options = {}) {
      assign(this.options, options)
    }

    /**
     * output listener's load performance
     * @return {Array}
     */
    performance () {
      let list = []

      this.ListenerQueue.map(item => {
        list.push(item.performance())
      })

      return list
    }

    /*
     * add lazy component to queue
     * @param  {Vue} vm lazy component instance
     * @return
     */
    addLazyBox (vm) {
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
    add (el, binding, vnode) {
      if (some(this.ListenerQueue, item => item.el === el)) {
        this.update(el, binding)
        return Vue.nextTick(this.lazyLoadHandler)
      }

      let { src, loading, error } = this._valueFormatter(binding.value)

      Vue.nextTick(() => {
        src = getBestSelectionFromSrcset(el, this.options.scale) || src
        this._observer && this._observer.observe(el)

        const container = Object.keys(binding.modifiers)[0]
        let $parent

        if (container) {
          $parent = vnode.context.$refs[container]
          // if there is container passed in, try ref first, then fallback to getElementById to support the original usage
          $parent = $parent ? $parent.$el || $parent : document.getElementById(container)
        }

        if (!$parent) {
          $parent = scrollParent(el)
        }

        const newListener = new ReactiveListener({
          bindType: binding.arg,
          $parent,
          el,
          loading,
          error,
          src,
          elRenderer: this._elRenderer.bind(this),
          options: this.options
        })

        this.ListenerQueue.push(newListener)

        if (inBrowser) {
          this._addListenerTarget(window)
          this._addListenerTarget($parent)
        }

        this.lazyLoadHandler()
        Vue.nextTick(() => this.lazyLoadHandler())
      })
    }

    /**
    * update image src
    * @param  {DOM} el
    * @param  {object} vue directive binding
    * @return
    */
    update (el, binding) {
      let { src, loading, error } = this._valueFormatter(binding.value)
      src = getBestSelectionFromSrcset(el, this.options.scale) || src

      const exist = find(this.ListenerQueue, item => item.el === el)
      exist && exist.update({
        src,
        loading,
        error
      })
      if (this._observer) {
        this._observer.unobserve(el)
        this._observer.observe(el)
      }
      this.lazyLoadHandler()
      Vue.nextTick(() => this.lazyLoadHandler())
    }

    /**
    * remove listener form list
    * @param  {DOM} el
    * @return
    */
    remove (el) {
      if (!el) return
      this._observer && this._observer.unobserve(el)
      const existItem = find(this.ListenerQueue, item => item.el === el)
      if (existItem) {
        this._removeListenerTarget(existItem.$parent)
        this._removeListenerTarget(window)
        remove(this.ListenerQueue, existItem) && existItem.destroy()
      }
    }

    /*
     * remove lazy components form list
     * @param  {Vue} vm Vue instance
     * @return
     */
    removeComponent (vm) {
      if (!vm) return
      remove(this.ListenerQueue, vm)
      this._observer && this._observer.unobserve(vm.el)
      if (vm.$parent && vm.$el.parentNode) {
        this._removeListenerTarget(vm.$el.parentNode)
      }
      this._removeListenerTarget(window)
    }

    setMode (mode) {
      if (!hasIntersectionObserver && mode === modeType.observer) {
        mode = modeType.event
      }

      this.mode = mode // event or observer

      if (mode === modeType.event) {
        if (this._observer) {
          this.ListenerQueue.forEach(listener => {
            this._observer.unobserve(listener.el)
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
    _addListenerTarget (el) {
      if (!el) return
      let target = find(this.TargetQueue, target => target.el === el)
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
    _removeListenerTarget (el) {
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
    _initListen (el, start) {
      this.options.ListenEvents.forEach((evt) => _[start ? 'on' : 'off'](el, evt, this.lazyLoadHandler))
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
      const freeList = []
      this.ListenerQueue.forEach((listener, index) => {
        if (!listener.state.error && listener.state.loaded) {
          return freeList.push(listener)
        }
        const catIn = listener.checkInView()
        if (!catIn) return
        listener.load()
      })
      freeList.forEach(vm => remove(this.ListenerQueue, vm))
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
          this._observer.observe(listener.el)
        })
      }
    }

    /**
    * init IntersectionObserver
    * @return
    */
    _observerHandler (entries, observer) {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.ListenerQueue.forEach(listener => {
            if (listener.el === entry.target) {
              if (listener.state.loaded) return this._observer.unobserve(listener.el)
              listener.load()
            }
          })
        }
      })
    }

    /**
    * set element attribute with image'url and state
    * @param  {object} lazyload listener object
    * @param  {string} state will be rendered
    * @param  {bool} inCache  is rendered from cache
    * @return
    */
    _elRenderer (listener, state, cache) {
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
        el.style[bindType] = 'url("' + src + '")'
      } else if (el.getAttribute('src') !== src) {
        el.setAttribute('src', src)
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

    /**
    * generate loading loaded error image url
    * @param {string} image's src
    * @return {object} image's loading, loaded, error url
    */
    _valueFormatter (value) {
      let src = value
      let loading = this.options.loading
      let error = this.options.error

      // value is object
      if (isObject(value)) {
        if (!value.src && !this.options.silent) console.error('Vue Lazyload warning: miss src with ' + value)
        src = value.src
        loading = value.loading || this.options.loading
        error = value.error || this.options.error
      }
      return {
        src,
        loading,
        error
      }
    }
  }
}
