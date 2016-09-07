const Promise = require('es6-promise').Promise

if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    'use strict';
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

exports.install = function(Vue, Options) {
    const isVueNext = Vue.version.split('.')[0] === '2'
    const DEFAULT_PRE = 1.3
    const DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg=='
    if (!Options) {
        Options = {
            preLoad: DEFAULT_PRE,
            error: DEFAULT_URL,
            loading: DEFAULT_URL,
            try: 3
        }
    }
    const Init = {
        preLoad: Options.preLoad || DEFAULT_PRE,
        error: Options.error ? Options.error : DEFAULT_URL,
        loading: Options.loading ? Options.loading : DEFAULT_URL,
        hasbind: false,
        try: Options.try ? Options.try : 1
    }

    const Listeners = []
    const Loaded = []

    const throttle = function (action, delay) {
        let timeout = null
        let lastRun = 0
        return function () {
            if (timeout) {
                return
            }
            let elapsed = (+new Date()) - lastRun
            let context = this
            let args = arguments
            let runCallback = function () {
                    lastRun = +new Date()
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
            _.on(el, 'scroll', lazyLoadHandler)
            _.on(el, 'wheel', lazyLoadHandler)
            _.on(el, 'mousewheel', lazyLoadHandler)
            _.on(el, 'resize', lazyLoadHandler)
            _.on(el, 'animationend', lazyLoadHandler)
            _.on(el, 'transitionend', lazyLoadHandler)
        } else {
            Init.hasbind = false
            _.off(el, 'scroll', lazyLoadHandler)
            _.off(el, 'wheel', lazyLoadHandler)
            _.off(el, 'mousewheel', lazyLoadHandler)
            _.off(el, 'resize', lazyLoadHandler)
            _.off(el, 'animationend', lazyLoadHandler)
            _.off(el, 'transitionend', lazyLoadHandler)
        }
    }

    const checkCanShow = function(listener) {
        if (Loaded.indexOf(listener.src) > -1) return setElRender(listener.el, listener.bindType, listener.src, 'loaded')
        let rect = listener.el.getBoundingClientRect()
        
        if (rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0) {
            render(listener)
        }
    }

    const setElRender = (el, bindType, src, state) => {
        if (!bindType) {
            el.setAttribute('src', src)
        } else {
            el.setAttribute('style', bindType + ': url(' + src + ')')
        }
        el.setAttribute('lazy', state)
    }

    const render = function(item) {
        if (item.try >= Init.try) {
            return false
        }
        item.try++

        loadImageAsync(item)
        .then((url) => {
            let index = Listeners.indexOf(item)
            if (index !== -1) {
                Listeners.splice(index, 1)
            }
            setElRender(item.el, item.bindType, item.src, 'loaded')
            Loaded.push(item.src)
        })
        .catch((error) => {
            setElRender(item.el, item.bindType, Init.error, 'error')
        })
    }

    const loadImageAsync = (item) => {
        return new Promise((resolve, reject) => {
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

        for (let i = 0, len = Listeners.length; i < len; i++) {
            if (Listeners[i] && Listeners[i].el === el) {
                Listeners.splice(i, 1)
            }
        }

        if (Init.hasbind && Listeners.length == 0) {
            onListen(window, false)
        }
    }

    const addListener = (el, binding, vnode) => {
        if (el.getAttribute('lazy') === 'loaded') return
        let hasIt = Listeners.find((item) => {
            return item.el === el
        })
        if (hasIt) {
            return Vue.nextTick(() => {
                setTimeout(() => {
                    lazyLoadHandler()
                }, 0)
            })
        }

        let parentEl = null
        
        if (binding.modifiers) {
            parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0])
        }

        setElRender(el, binding.arg, Init.loading, 'loading')

        Vue.nextTick(() => {
            Listeners.push({
                bindType: binding.arg,
                try: 0,
                parentEl: parentEl,
                el: el,
                src: binding.value
            })
            lazyLoadHandler()
            if (Listeners.length > 0 && !Init.hasbind) {
                Init.hasbind = true
                onListen(window, true)
            }
            if (parentEl) {
                onListen(parentEl, true)
            }
        })
    }

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: addListener,
            componentUpdated: lazyLoadHandler,
            unbind : componentWillUnmount
        })
    } else {
        Vue.directive('lazy', {
            bind () {},
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