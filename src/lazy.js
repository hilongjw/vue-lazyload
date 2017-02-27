import { 
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
    isObject
} from './util'

import ReactiveListener from './listener'

const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']

export default function (Vue) {
    return class Lazy {
        constructor ({ preLoad, error, loading, attempt, silent, scale, listenEvents, hasbind, filter, adapter }) {
            this.ListenerQueue = []
            this.options = {
                silent: silent || true,
                preLoad: preLoad || 1.3,
                error: error || DEFAULT_URL,
                loading: loading || DEFAULT_URL,
                attempt: attempt || 3,
                scale: getDPR(scale),
                ListenEvents: listenEvents || DEFAULT_EVENTS,
                hasbind: false,
                supportWebp: supportWebp(),
                filter: filter || {},
                adapter: adapter || {}
            }
            this.initEvent()

            this.lazyLoadHandler = throttle(() => {
                let catIn = false
                this.ListenerQueue.forEach(listener => {
                    if (listener.state.loaded) return
                    catIn = listener.checkInView()
                    catIn && listener.load()
                })
            }, 200)
        }

        config (options = {}) {
            assign(this.options, options)
        }

        addLazyBox (vm) {
            this.ListenerQueue.push(vm)
            this.options.hasbind = true
            this.initListen(window, true)
        }

        add (el, binding, vnode) {
            if (some(this.ListenerQueue, item => item.el === el)) {
                this.update(el, binding)
                return Vue.nextTick(this.lazyLoadHandler)
            }

            let { src, loading, error } = this.valueFormatter(binding.value)

            Vue.nextTick(() => {
                let tmp = getBestSelectionFromSrcset(el, this.options.scale)

                if (tmp) {
                    src = tmp
                }

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

                this.ListenerQueue.push(this.listenerFilter(new ReactiveListener({
                    bindType: binding.arg,
                    $parent,
                    el,
                    loading,
                    error,
                    src,
                    elRenderer: this.elRenderer.bind(this),
                    options: this.options
                })))

                if (!this.ListenerQueue.length || this.options.hasbind) return

                this.options.hasbind = true
                this.initListen(window, true)
                $parent && this.initListen($parent, true)
                this.lazyLoadHandler()
                Vue.nextTick(() => this.lazyLoadHandler())
            })
        }

        update (el, binding) {
            let { src, loading, error } = this.valueFormatter(binding.value)

            const exist = find(this.ListenerQueue, item => item.el === el)

            exist && exist.src !== src && exist.update({
                src,
                loading,
                error
            })
            this.lazyLoadHandler()
            Vue.nextTick(() => this.lazyLoadHandler())
        }

        remove (el) {
            if (!el) return
            const existItem = find(this.ListenerQueue, item => item.el === el)
            existItem && remove(this.ListenerQueue, existItem) && existItem.destroy()
            this.options.hasbind && !this.ListenerQueue.length && this.initListen(window, false)
        }

        removeComponent (vm) {
            vm && remove(this.ListenerQueue, vm)
            this.options.hasbind && !this.ListenerQueue.length && this.initListen(window, false)
        }

        initListen (el, start) {
            this.options.hasbind = start
            this.options.ListenEvents.forEach((evt) => _[start ? 'on' : 'off'](el, evt, this.lazyLoadHandler))
        }

        initEvent () {
            this.Event = {
                listeners: {
                    loading: [],
                    loaded: [],
                    error: []
                }
            }

            this.$on = (event, func) => {
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
                    this.Event.listeners[event] = []
                    return
                }
                remove(this.Event.listeners[event], func)
            }

            this.$emit = (event, context, inCache) => {
                this.Event.listeners[event].forEach(func => func(context, inCache))
            }
        }

        performance () {
            let list = []

            this.ListenerQueue.map(item => {
                list.push(item.performance())
            })

            return list
        }

        /**
         * set element attribute with image'url and state
         * @param  {object} lazyload listener object
         * @param  {string} state will be rendered
         * @param  {bool} inCache  is rendered from cache 
         * @return
         */
        elRenderer (listener, state, cache) {
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
                el.style[bindType] = 'url(' + src + ')'
            } else if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src)
            }

            el.setAttribute('lazy', state)

            this.$emit(state, listener, cache)
            this.options.adapter[state] && this.options.adapter[state](listener, this.options)
        }

        listenerFilter (listener) {
            if (this.options.filter.webp && this.options.supportWebp) {
                listener.src = this.options.filter.webp(listener, this.options)
            }
            if (this.options.filter.customer) {
                listener.src = this.options.filter.customer(listener, this.options)
            }
            return listener
        }


        /**
         * generate loading loaded error image url 
         * @param {string} image's src
         * @return {object} image's loading, loaded, error url
         */
        valueFormatter (value) {
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
