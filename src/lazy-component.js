import { inBrowser } from './util'
import Lazy from './lazy'

const LazyComponent = (lazy) => {
  return {
    props: {
      tag: {
        type: String,
        default: 'div'
      }
    },
    render (h) {
      return h(this.tag, null, this.show ? this.$slots.default : null)
    },
    data () {
      return {
        el: null,
        state: {
          loaded: false
        },
        rect: {},
        show: false
      }
    },
    mounted () {
      this.el = this.$el
      lazy.addLazyBox(this)
      lazy.lazyLoadHandler()
    },
    beforeDestroy () {
      lazy.removeComponent(this)
    },
    methods: {
      getRect () {
        this.rect = this.$el.getBoundingClientRect()
      },
      checkInView () {
        this.getRect()
        return inBrowser &&
                    (this.rect.top < window.innerHeight * lazy.options.preLoad && this.rect.bottom > 0) &&
                    (this.rect.left < window.innerWidth * lazy.options.preLoad && this.rect.right > 0)
      },
      load () {
        this.show = true
        this.state.loaded = true
        this.$emit('show', this)
      },
      destroy () {
        return this.$destroy
      }
    }
  }
}

LazyComponent.install = function (Vue, options = {}) {
  const LazyClass = Lazy(Vue)
  const lazy = new LazyClass(options)
  Vue.component('lazy-component', LazyComponent(lazy))
}

export default LazyComponent
