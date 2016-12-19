import { loadImageAsync } from './util'
let imageCache = {}

export default class ReactiveListener {
    constructor ({ el, src, error, loading, bindType, $parent, options, elRenderer }) {
        this.el = el
        this.src = src
        this.error = error
        this.loading = loading
        this.bindType = bindType
        this.attempt = 0

        this.naturalHeight = 0
        this.naturalWidth = 0

        this.options = options

        this.initState()

        this.rect = el.getBoundingClientRect()

        this.$parent = $parent
        this.elRenderer = elRenderer
    }

    initState () {
        this.state = {
            error: false,
            loaded: false,
            rendered: false
        }
    }

    update ({ src, loading, error }) {
        this.src = src
        this.loading = loading
        this.error = error
        this.attempt = 0
        this.initState()
    }

    getRect () {
        this.rect = this.el.getBoundingClientRect()
    }

    checkInView () {
        this.getRect()
        return (this.rect.top < window.innerHeight * this.options.preLoad && this.rect.bottom > 0) &&
            (this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0)
    }

    load () {
        if ((this.attempt > this.options.attempt - 1) && this.state.error) {
            if (!this.options.slient) console.log('error end')
            return
        }

        if (this.state.loaded || imageCache[this.src]) {
            return this.render('loaded')
        }

        this.render('loading', true)

        this.attempt++

        loadImageAsync({
            src: this.src
        }, data => {
            this.naturalHeight = data.naturalHeight
            this.naturalWidth = data.naturalWidth
            this.state.loaded = true
            this.state.error = false
            this.render('loaded', true)
            imageCache[this.src] = 1
        }, err => {
            this.state.error = true
            this.state.loaded = false
            this.render('error', true)
        })
    }

    render (state, notify) {
        let src
        switch (state) {
            case 'loading':
                src = this.loading
                break
            case 'error':
                src = this.error
                break
            default:
                src = this.src
                break
        }

        this.elRenderer({
            el: this.el,
            bindType: this.bindType,
            src: src
        }, state, notify)
    }

    destroy () {
        this.el = null
        this.src = null
        this.error = null
        this.loading = null
        this.bindType = null
        this.attempt = 0
    }
}
