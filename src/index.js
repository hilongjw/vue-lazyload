import { remove,  _, throttle, supportWebp, getDPR } from './util'
import ReactiveListener from './listener'

export default (Vue, Options = {}) => {
    const isVueNext = Vue.version.split('.')[0] === '2'
    const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const ListenerQueue = []

    const Init = {
        preLoad: Options.preLoad || 1.3,
        error: Options.error || DEFAULT_URL,
        loading: Options.loading || DEFAULT_URL,
        attempt: Options.attempt || 3,
        scale: getDPR(Options.scale),
        ListenEvents: Options.listenEvents || ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend'],
        hasbind: false,
        supportWebp: supportWebp(),
        filter: Options.filter || {},
        adapter: Options.adapter || {}
    }

    const $Lazyload = {
        listeners: {
            loading: [],
            loaded: [],
            error: []
        },
        $on (event, func) {
            this.listeners[event].push(func)
        },
        $once (event, func) {
            const vm = this
            function on () {
                vm.$off(event, on)
                func.apply(vm, arguments)
            }
            this.$on(event, on)
        },
        $off (event, func) {
            if (!func) {
                this.listeners[event] = []
                return
            }
            remove(this.listeners[event], func)
        },
        $emit (event, context) {
            this.listeners[event].forEach(func => {
                func(context)
            })
        }
    }

    const lazyLoadHandler = throttle(() => {
        ListenerQueue.forEach(listener => {
            if (listener.state.loaded) return
            listener.checkInView() && listener.load()
        })
    }, 300)

    const onListen = (el, start) => {
        Init.hasbind = start
        Init.ListenEvents.forEach((evt) => {
            _[start ? 'on' : 'off'](el, evt, lazyLoadHandler)
        })
    }

    const componentWillUnmount = el => {
        if (!el) return

        const exist = ListenerQueue.find(item => item.el === el)

        exist && remove(ListenerQueue, exist).destroy()

        Init.hasbind && !ListenerQueue.length && onListen(window, false)
    }

    const elRenderer = (data, state, notify) => {
        const { el, bindType, src } = data

        if (!el) return

        if (!bindType) {
            if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src)
            }
        } else {
            el.style[bindType] = 'url(' + src + ')'
        }

        el.setAttribute('lazy', state)

        if (!notify) return

        $Lazyload.$emit(state, data)
        Init.adapter[state] && Init.adapter[state](data, Init)
    }

    function listenerFilter (listener) {
        if (Init.filter.webp && Init.supportWebp) {
            listener.src = Init.filter.webp(listener, Init)
        }
        if (Init.filter.customer) {
            listener.src = Init.filter.customer(listener, Init)
        }
        return listener
    }

    function valueFormatter (value) {
        let src = value
        let loading = Init.loading
        let error = Init.error

        if (value && typeof(value) !== 'string') {
            if (!value.src) console.error('miss src with ', value)
            src = value.src
            loading = value.loading || Init.loading
            error = value.error || Init.error
        }
        return {
            src,
            loading,
            error 
        }
    }

    const addListener = (el, binding, vnode) => {
        if (ListenerQueue.some(item => item.el === el)) {
            updateListener(el, binding)
            return Vue.nextTick(lazyLoadHandler)
        }

        let { src, loading, error } = valueFormatter(binding.value)

        Vue.nextTick(() => {
            // binding.modifiers will never be null
            let $parent = vnode.context.$refs[Object.keys(binding.modifiers)[0]]
            // try to get $el of ref, if there is on $el, it a normal DOM node
            $parent = $parent && $parent.$el || $parent

            ListenerQueue.push(listenerFilter(new ReactiveListener({
                bindType: binding.arg,
                $parent,
                el,
                loading,
                error,
                src,
                Init,
                elRenderer
            })))

            lazyLoadHandler()

            if (!ListenerQueue.length || Init.hasbind) return

            Init.hasbind = true
            onListen(window, true)
            $parent && onListen($parent, true)
        })
    }

    const updateListener = (el, binding) => {
        let { src, loading, error } = valueFormatter(binding.value)

        const exist = ListenerQueue.find(item => item.el === el)

        exist && exist.src !== src && exist.update({
            src,
            loading,
            error
        })
    }

    Vue.prototype.$Lazyload = $Lazyload

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: updateListener,
            inserted: addListener,
            componentUpdated: lazyLoadHandler,
            unbind : componentWillUnmount
        })
    } else {
        Vue.directive('lazy', {
            bind: lazyLoadHandler,
            update (newValue, oldValue) {
                Object.assign(this.$refs, this.$els)
                addListener(this.el, {
                    modifiers: this.modifiers || {},
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                }, { context: this })
            },
            unbind () {
                componentWillUnmount(this.el)
            }
        })
    }
}
