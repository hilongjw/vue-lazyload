'use strict';
var Promise = require('es6-promise').Promise;

exports.install = function(Vue, Options) {
    const DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=='
    if (!Options) {
        Options = {
            error: DEFAULT_URL,
            loading: DEFAULT_URL,
            try: 3
        }
    }
    const init = {
        error: Options.error ? Options.error : DEFAULT_URL,
        loading: Options.loading ? Options.loading : DEFAULT_URL,
        hasbind: false,
        isInChild: false,
        childEl: null,
        try: Options.try ? Options.try : 1
    }

    const Listeners = []

    const debounce = function(action, idle) {
        let last = null
        return function() {
            let args = arguments
            clearTimeout(last)
            last = setTimeout(() => {
                action.apply(this, args)
            }, idle)
        }
    }

    const _ = {
        on (type, func) {
            window.addEventListener(type, func)
        },
        off (type, func) {
            window.removeEventListener(type, func)
        },
    }

    const lazyLoadHandler = debounce(() => {
        for (let i = 0; i < Listeners.length; ++i) {
            const listener = Listeners[i]
            checkCanShow(listener)
        }
    }, 300)

    const onListen = (start) => {
        if (start) {
            _.on('scroll', lazyLoadHandler)
            _.on('wheel', lazyLoadHandler)
            _.on('mousewheel', lazyLoadHandler)
            _.on('resize', lazyLoadHandler)
        } else {
            init.hasbind = false
            _.off('scroll', lazyLoadHandler)
            _.off('wheel', lazyLoadHandler)
            _.off('mousewheel', lazyLoadHandler)
            _.off('resize', lazyLoadHandler)
        }
    }

    const checkCanShow = function(listener) {
        let winH = 0
        let top = 0
        if (listener.parentEl) {
            winH = listener.parentEl.offsetHeight
            top = listener.parentEl.scrollTop
        } else {
            winH = window.screen.availHeight
            top = document.documentElement.scrollTop || document.body.scrollTop
        }

        let height = (top + winH) * window.devicePixelRatio * 1.3
        if (listener.y < height) {
            render(listener)
        }
    }

    const render = function(item) {
        if (item.try >= init.try) {
            return false
        }
        item.try++

            loadImageAsync(item)
            .then((url) => {
                let index = Listeners.indexOf(item)
                if (index !== -1) {
                    Listeners.splice(index, 1)
                }
                if (!item.bindType) {
                    item.el.setAttribute('src', item.src)
                } else {
                    item.el.setAttribute('style', item.bindType + ': url(' + item.src + ')')
                }
                item.el.setAttribute('lazy', 'loaded')

            })
            .catch((error) => {
                if (!item.bindType) {
                    item.el.setAttribute('src', init.error)
                } else {
                    item.el.setAttribute('style', item.bindType + ': url(' + init.error + ')')
                }
                item.el.setAttribute('lazy', 'error')
            })
    }

    const loadImageAsync = function(item) {
        if (!item.bindType) {
            item.el.setAttribute('src', init.loading)
        } else {
            item.el.setAttribute('style', item.bindType + ': url(' + init.loading + ')')
        }

        return new Promise(function(resolve, reject) {
            let image = new Image()
            image.src = item.src

            image.onload = function() {
                resolve(item.src)
            }

            image.onerror = function() {
                reject()
            }

        })
    }

    const componentWillUnmount = (el, binding, vnode, OldVnode) => {
        if (!el) return
        let i
        let len = Listeners.length

        for (i = 0; i < len; i++) {
            if (Listeners[i] && Listeners[i].el === el) {
                Listeners.splice(i, 1)
            }
        }

        if (Listeners.length == 0) {
            onListen(false)
        }
    }

    const getPosition = function(el) {
        if (!el) return { y: 0 }
        let t = el.offsetTop
        let elHeight = el.offsetHeight
        for (t; el = el.offsetParent;) {
            t += el.offsetTop
        }
        return {
            y: (t + elHeight) * window.devicePixelRatio
        }
    }


    const addListener = (el, binding, vnode) => {
        if (!init.hasbind) {
            onListen(true)
        }
        let parentEl = null
        let pos = getPosition(el)
        if (binding.modifiers) {
            parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0])
        }
        if (!binding.arg) {
            el.setAttribute('lazy', 'loading')
            el.setAttribute('src', init.loading)
        } else {
            el.setAttribute('lazy', 'loading')
            el.setAttribute('style', binding.arg + ': url(' + init.loading + ')')
        }
        
        Listeners.push({
            bindType: binding.arg,
            try: 0,
            parentEl: parentEl,
            el: el,
            src: binding.value,
            y: pos.y
        })
        lazyLoadHandler()
    }

    Vue.directive('lazy', {
        bind: addListener,
        update: addListener,
        unbind : componentWillUnmount
    })
}
