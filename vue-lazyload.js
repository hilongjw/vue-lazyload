const inBrowser = typeof window !== 'undefined'

if (!Array.prototype.$remove) {
    Array.prototype.$remove = function (item) {
        if (!this.length) return
        const index = this.indexOf(item)
        if (index > -1) {
          return this.splice(index, 1)
        }
    }
}

export default (Vue, Options = {}) => {
    const isVueNext = Vue.version.split('.')[0] === '2'
    const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
    const Listeners = []
    const imageCache = []

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

    function getDPR (scale = 1) {
        if (!inBrowser) return scale
        if (window.devicePixelRatio) {
            return window.devicePixelRatio
        }
        return scale
    }

    function supportWebp () {
        let support = true
        const d = document

        try {
            let el = d.createElement('object')
            el.type = 'image/webp'
            el.innerHTML = '!'
            d.body.appendChild(el)
            support = !el.offsetWidth
            d.body.removeChild(el)
        } catch (err) {
            support = false
        }

        return support
    }

    const throttle = function (action, delay) {
        let timeout = null
        let lastRun = 0
        return function () {
            if (timeout) {
                return
            }
            let elapsed = Date.now() - lastRun
            let context = this
            let args = arguments
            let runCallback = function () {
                    lastRun = Date.now()
                    timeout = false
                    action.apply(context, args)
                }
            if (elapsed >= delay) {
                runCallback()
            }
            else {
                timeout = setTimeout(runCallback, delay)
            }
        }
    }

    const _ = {
        on (el, type, func) {
            el.addEventListener(type, func)
        },
        off (el, type, func) {
            el.removeEventListener(type, func)
        }
    }

    const lazyLoadHandler = throttle(() => {
        for (let i = 0, len = Listeners.length; i < len; ++i) {
            checkCanShow(Listeners[i])
        }
    }, 300)

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

    const checkCanShow = (listener) => {
        if (imageCache.indexOf(listener.src) !== -1) return setElRender(listener, 'loaded')
        let rect = listener.el.getBoundingClientRect()

        if ((rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0) && (rect.left < window.innerWidth * Init.preLoad && rect.right > 0)) {
            render(listener)
        }
    }

    const setElRender = (listener, state, emit) => {
        const { el, bindType } = listener
        let src = state === 'error' ? listener.error : listener.src

        if (!bindType) {
            if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src)
            }
        } else {
            el.style[bindType] = 'url(' + src + ')'
        }

        el.setAttribute('lazy', state)

        if (emit) {
            $Lazyload.$emit(state, listener)
            if (Init.adapter[state]) {
                Init.adapter[state](listener, Init)
            }
        }
    }

    const render = (listener) => {
        if (listener.attempt >= Init.attempt) return false
        listener.attempt++

        if (imageCache.indexOf(listener.src) !== -1) return setElRender(listener, 'loaded')
        imageCache.push(listener.src)

        loadImageAsync(listener, (image) => {
                listener = Object.assign(listener, image)
                setElRender(listener, 'loaded', true)
                Listeners.$remove(listener)
            }, (error) => {
                imageCache.$remove(listener.src)
                setElRender(listener, 'error', true)
            })
    }

    const loadImageAsync = (item, resolve, reject) => {
        let image = new Image()
        image.src = item.src

        image.onload = function () {
            resolve({
                naturalHeight: image.naturalHeight,
                naturalWidth: image.naturalWidth,
                src: item.src
            })
        }

        image.onerror = function (e) {
            reject(e)
        }
    }

    const componentWillUnmount = (el, binding, vnode, OldVnode) => {
        if (!el) return

        for (let i = 0, len = Listeners.length; i < len; i++) {
            if (Listeners[i] && Listeners[i].el === el) {
                Listeners.splice(i, 1)
            }
        }

        if (Init.hasbind && Listeners.length == 0) {
            onListen(window, false)
        }
    }

    const checkElExist = (el) => {
        let hasIt = false

        Listeners.forEach((item) => {
            if (item.el === el) hasIt = true
        })

        if (hasIt) {
            return Vue.nextTick(() => {
                lazyLoadHandler()
            })
        }
        return hasIt
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

    const addListener = (el, binding, vnode) => {
        if (el.getAttribute('lazy') === 'loaded') return
        if (checkElExist(el)) return

        let parentEl = null
        let imageSrc = binding.value
        let imageLoading = Init.loading
        let imageError = Init.error

        if (binding.value && typeof(binding.value) !== 'string') {
            imageSrc = binding.value.src
            imageLoading = binding.value.loading || Init.loading
            imageError = binding.value.error || Init.error
        }

        if (imageCache.indexOf(imageSrc) > -1) {
            return setElRender({
                el: el, 
                bindType: binding.arg,
                src: imageSrc
            }, 'loaded')
        }

        Vue.nextTick(() => {
            let parentId
            if (binding.modifiers) {
                parentId = Object.keys(binding.modifiers)[0]
                parentEl = window.document.getElementById(parentId)
            }

            let listener = {
                bindType: binding.arg,
                parentId: parentId,
                attempt: 0,
                parentEl: parentEl,
                el: el,
                error: imageError,
                src: imageSrc
            }

            listener = listenerFilter(listener)

            Listeners.push(listener)

            setElRender({
                el: el, 
                bindType: binding.arg, 
                src: imageLoading
            }, 'loading', true)

            lazyLoadHandler()

            if (Listeners.length > 0 && !Init.hasbind) {
                Init.hasbind = true
                onListen(window, true)

                if (parentEl) {
                    onListen(parentEl, true)
                }
            }
        })
    }

    Vue.prototype.$Lazyload = $Lazyload

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: addListener,
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
