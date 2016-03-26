exports.install = function (Vue, options) {
    const init = {
        error: options.error,
        loading: options.loading,
        hasbind: false,
        try: options.try || 2
    }

    const listeners = []

    const debounce = function (action, idle) {
        let last
        return function () {
            let args = arguments
            clearTimeout(last)
            last = setTimeout(() => {
                action.apply(this, args)
            }, idle)
        }
    }

    const lazyLoadHandler = debounce(() => {
        for(let i = 0; i < listeners.length; ++i) {
            const listener = listeners[i]
            checkCanShow(listener)
        }
    }, 300)

    const checkCanShow = function (listener) {
        let winH = window.screen.availHeight
        let top = document.documentElement.scrollTop || document.body.scrollTop
        let height = (top + winH) * window.devicePixelRatio * 1.3
        if ( listener.y < height) {
            render(listener)
        }
    }

    const render = function (item) {
        if (item.try >= init.try) {
            return false
        }
        item.try++

        loadImageAsync(item)
        .then((url) => {
            let index = listeners.indexOf(item)
            if (index !== -1) {
                listeners.splice(index, 1)
            }
            if (!item.bindType) {
                item.el.setAttribute('src', item.src)
                item.el.removeAttribute('lazy')
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + item.src + ')')
                item.el.removeAttribute('lazy')
            }

        })
        .catch((error) => {
            if (!item.bindType) {
                item.el.setAttribute('lazy', 'error')
                item.el.setAttribute('src', init.error)
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + init.error + ')')
                item.el.setAttribute('lazy', 'error')
            }
        })
    }

    const loadImageAsync = function (item) {
        if (!item.bindType) {
            item.el.setAttribute('src', init.loading)
            item.el.setAttribute('lazy', 'loading')
        } else {
            item.el.setAttribute('style', item.bindType + ': url(' + init.loading + ')')
            item.el.setAttribute('lazy', 'loading')
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

    const componentWillUnmount = function (src) {
        let i
        let len = listeners.length
        for (i=0; i<len; i++) {
            if (listeners[i].src == src) {
                listeners.splice(i,1)
            }
        }

        if (listeners.length == 0) {
            window.removeEventListener('scroll', lazyLoadHandler)
            window.removeEventListener('wheel', lazyLoadHandler)
            window.removeEventListener('mousewheel', lazyLoadHandler)
            window.removeEventListener('resize', lazyLoadHandler)
        }
      }

    const getPosition = function (el) {
        let t = el.offsetTop
        let elHeight = el.offsetHeight
        for (t; el = el.offsetParent;) {  
                t += el.offsetTop
        }
        return {
            y: (t+elHeight) * window.devicePixelRatio
        }
    }

    Vue.directive('lazy', {
        bind: function() {
            if (!init.hasbind) {
                init.hasbind = true
                window.addEventListener('scroll', lazyLoadHandler)
                window.addEventListener('wheel', lazyLoadHandler)
                window.addEventListener('mousewheel', lazyLoadHandler)
                window.addEventListener('resize', lazyLoadHandler)
                lazyLoadHandler()
            }
        },
        update: function(newValue, oldValue) {
            this.el.setAttribute('lazy', 'loading')
            if (!this.arg) {
                this.el.setAttribute('src', init.loading)
            } else {
                this.el.setAttribute('style', this.arg + ': url(' + init.loading + ')')
            }
            this.vm.$nextTick(() => {
                let pos = getPosition(this.el)
                listeners.push({
                    bindType: this.arg,
                    try: 0,
                    el: this.el,
                    src: newValue,
                    y: pos.y
                })
                lazyLoadHandler()
            })
        },
        unbind: function (src) {
            componentWillUnmount(src)
        }
    })
}