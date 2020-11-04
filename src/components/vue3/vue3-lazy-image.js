import {
  inBrowser,
  loadImageAsync,
  noop
} from '../../util'
import {
  h,
  ref,
  getCurrentInstance,
  watch,
  onMounted,
  onBeforeUnmount
} from 'vue3'

export default (lazyManager) => {
  return {
    props: {
      src: [String, Object],
      tag: {
        type: String,
        default: 'img'
      }
    },
    setup(props, { slots }) {
      const renderSrc = ref('')
      const options = {
        src: '',
        error: '',
        loading: '',
        attempt: lazyManager.options.attempt
      }
      const state = {
        loaded: false,
        error: false,
        attempt: 0
      }
      const rect = {}
      const dom = getCurrentInstance()

      const that = {
        state: state,
        options: options,
        rect: rect,
        renderSrc: renderSrc,
        getRect () {
          this.rect = dom.refs.root.getBoundingClientRect()
        },
        checkInView () {
          this.getRect()
          return inBrowser &&
            (this.rect.top < window.innerHeight * lazyManager.options.preLoad && this.rect.bottom > 0) &&
            (this.rect.left < window.innerWidth * lazyManager.options.preLoad && this.rect.right > 0)
        },
        load (onFinish = noop) {
          if ((this.state.attempt > this.options.attempt - 1) && this.state.error) {
            if (!lazyManager.options.silent) console.log(`VueLazyload log: ${this.options.src} tried too more than ${this.options.attempt} times`)
            onFinish()
            return
          }
          const src = this.options.src
          loadImageAsync({ src }, ({ src }) => {
            this.renderSrc.value = src
            this.state.loaded = true
          }, e => {
            this.state.attempt++
            this.renderSrc.value = this.options.error
            this.state.error = true
          })
        },
       $destroy() {}
      }

      vueImage.lazyManager = lazyManager
      vueImage.init(state, options, renderSrc)

      watch(() => props,src, () => {
        vueImage.init(state, options, renderSrc)
        lazyManager.addLazyBox(that)
        lazyManager.lazyLoadHandler()
      })

      onMounted(() => {
        that.el = getCurrentInstance().refs.root
        lazyManager.addLazyBox(that)
        lazyManager.lazyLoadHandler()
      })

      onBeforeUnmount(() => {
        lazyManager.removeComponent(that)
      })

      return () =>
        h(props.tag,{
          ref: 'root',
          attrs: {
            src: renderSrc
          }
        }, slots.default())
    }
  }
}

const vueImage = {
  init(state, options, renderSrc) {
    const opt = this.lazyManage._valueFormatter(src)
    state.loaded = false
    options.src = opt.src
    options.error = opt.error
    options.loading = opt.loading
    renderSrc.value = options.loading
  }
}
