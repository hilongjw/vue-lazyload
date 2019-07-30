import { inBrowser } from './util'

export default (lazy) => {
  return {
    props: {
      tag: {
        type: String,
        default: 'div'
      }
    },
    render (h) {
      if (this.show === false) {
        return h(this.tag)
      }
      return h(this.tag, null, this.$slots.default)
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
