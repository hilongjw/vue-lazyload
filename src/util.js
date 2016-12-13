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

function throttle (action, delay) {
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

export {
    inBrowser,
    _,
    throttle,
    supportWebp,
    getDPR,
    loadImageAsync
}