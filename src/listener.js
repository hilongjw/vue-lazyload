import {
  loadImageAsync,
  ObjectKeys,
  noop
} from './util'

let imageCache = {}

// el: {
//     state,
//     src,
//     error,
//     loading
// }

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

    this.rect = null

    this.$parent = $parent
    this.elRenderer = elRenderer

    this.performanceData = {
      init: Date.now(),
      loadStart: 0,
      loadEnd: 0
    }

    this.filter()
    this.initState()
    this.render('loading', false)
  }

  /*
   * init listener state
   * @return
   */
  initState () {
    this.el.dataset.src = this.src
    this.state = {
      error: false,
      loaded: false,
      rendered: false
    }
  }

  /*
   * record performance
   * @return
   */
  record (event) {
    this.performanceData[event] = Date.now()
  }

  /*
   * update image listener data
   * @param  {String} image uri
   * @param  {String} loading image uri
   * @param  {String} error image uri
   * @return
   */
  update ({ src, loading, error }) {
    const oldSrc = this.src
    this.src = src
    this.loading = loading
    this.error = error
    this.filter()
    if (oldSrc !== this.src) {
      this.attempt = 0
      this.initState()
    }
  }

  /*
   * get el node rect
   * @return
   */
  getRect () {
    this.rect = this.el.getBoundingClientRect()
  }

  /*
   *  check el is in view
   * @return {Boolean} el is in view
   */
  checkInView () {
    this.getRect()
    return (this.rect.top < window.innerHeight * this.options.preLoad && this.rect.bottom > this.options.preLoadTop) &&
            (this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0)
  }

  /*
   * listener filter
   */
  filter () {
    ObjectKeys(this.options.filter).map(key => {
      this.options.filter[key](this, this.options)
    })
  }

  /*
   * render loading first
   * @params cb:Function
   * @return
   */
  renderLoading (cb) {
    loadImageAsync({
      src: this.loading
    }, data => {
      this.render('loading', false)
      cb()
    }, () => {
      // handler `loading image` load failed
      cb()
      if (!this.options.silent) console.warn(`VueLazyload log: load failed with loading image(${this.loading})`)
    })
  }

  /*
   * try load image and  render it
   * @return
   */
  load (onFinish = noop) {
    if ((this.attempt > this.options.attempt - 1) && this.state.error) {
      if (!this.options.silent) console.log(`VueLazyload log: ${this.src} tried too more than ${this.options.attempt} times`)
      onFinish()
      return
    }

    if (this.state.loaded || imageCache[this.src]) {
      this.state.loaded = true
      onFinish()
      return this.render('loaded', true)
    }

    this.renderLoading(() => {
      this.attempt++

      this.record('loadStart')

      loadImageAsync({
        src: this.src
      }, data => {
        this.naturalHeight = data.naturalHeight
        this.naturalWidth = data.naturalWidth
        this.state.loaded = true
        this.state.error = false
        this.record('loadEnd')
        this.render('loaded', false)
        imageCache[this.src] = 1
        onFinish()
      }, err => {
        console.error(err)
        this.state.error = true
        this.state.loaded = false
        this.render('error', false)
      })
    })
  }

  /*
   * render image
   * @param  {String} state to render // ['loading', 'src', 'error']
   * @param  {String} is form cache
   * @return
   */
  render (state, cache) {
    this.elRenderer(this, state, cache)
  }

  /*
   * output performance data
   * @return {Object} performance data
   */
  performance () {
    let state = 'loading'
    let time = 0

    if (this.state.loaded) {
      state = 'loaded'
      time = (this.performanceData.loadEnd - this.performanceData.loadStart) / 1000
    }

    if (this.state.error) state = 'error'

    return {
      src: this.src,
      state,
      time
    }
  }

  /*
   * destroy
   * @return
   */
  destroy () {
    this.el = null
    this.src = null
    this.error = null
    this.loading = null
    this.bindType = null
    this.attempt = 0
  }
}
