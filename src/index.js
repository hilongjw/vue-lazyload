import { inBrowser,  _, throttle, supportWebp, getDPR, loadImageAsync } from './util'
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
            this.listeners[event].$remove(func)
        },
        $emit (event, context) {
            this.listeners[event].forEach(func => {
                func(context)
            })
        }
    }

    const lazyLoadHandler = throttle(() => {
        for (let i = 0, len = ListenerQueue.length; i < len; ++i) {
            checkCanShow(ListenerQueue[i])
        }
    }, 300)

    const checkCanShow = (listener) => {
        if (listener.state.loaded) return 
        if (listener.checkInView()) {
            listener.load()
        }
    }

    const onListen = (el, start) => {
        if (start) {
            Init.ListenEvents.forEach((evt) => {
                _.on(el, evt, lazyLoadHandler)
            })
        } else {
            Init.hasbind = false
            Init.ListenEvents.forEach((evt) => {
                _.off(el, evt, lazyLoadHandler)
            })
        }
    }

    const componentWillUnmount = (el, binding, vnode, OldVnode) => {
        if (!el) return

        for (let i = 0, len = ListenerQueue.length; i < len; i++) {
            if (ListenerQueue[i] && ListenerQueue[i].el === el) {
                ListenerQueue[i].destroy()
                ListenerQueue.splice(i, 1)
            }
        }

        if (Init.hasbind && ListenerQueue.length == 0) {
            onListen(window, false)
        }
    }

    const checkElExist = (el) => {
        let hasIt = false

        for (let item of ListenerQueue) {
            if (item.el === el) {
                hasIt = true
                break
            }
        }

        return hasIt
    }

    const elRenderer = (data, state, notify) => {
        const { el, bindType, src } = data

        if (!bindType) {
            if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src)
            }
        } else {
            el.style[bindType] = 'url(' + src + ')'
        }

        el.setAttribute('lazy', state)

        if (notify) {
            $Lazyload.$emit(state, data)
            if (Init.adapter[state]) {
                Init.adapter[state](data, Init)
            }
        }
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

    function valueFormater (value) {
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
        if (checkElExist(el)) {
            updateListener(el, binding)
            return Vue.nextTick(() => {
                lazyLoadHandler()
            })
        }

        let $parent = null
        let { src, loading, error } = valueFormater(binding.value)

        Vue.nextTick(() => {
            let parentId
            if (binding.modifiers) {
                parentId = Object.keys(binding.modifiers)[0]
                $parent = window.document.getElementById(parentId)
            }

            let listener = new ReactiveListener({
                bindType: binding.arg,
                $parent,
                el,
                loading,
                error,
                src,
                Init,
                elRenderer
            })

            listener = listenerFilter(listener)

            ListenerQueue.push(listener)

            lazyLoadHandler()

            if (ListenerQueue.length > 0 && !Init.hasbind) {
                Init.hasbind = true
                onListen(window, true)

                if ($parent) {
                    onListen($parent, true)
                }
            }
        })
    }

    const updateListener = (el, binding) => {
        let { src, loading, error } = valueFormater(binding.value)

        for (let i = 0, len = ListenerQueue.length; i < len; i++) {
            if (ListenerQueue[i] && ListenerQueue[i].el === el) {
                if (ListenerQueue[i].src !== src ) {
                    ListenerQueue[i].update({
                        src,
                        loading,
                        error
                    })
                }
                break
            }
        }
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
                addListener(this.el, {
                    modifiers: this.modifiers,
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                })
            },
            unbind () {
                componentWillUnmount(this.el)
            }
        })
    }
}
