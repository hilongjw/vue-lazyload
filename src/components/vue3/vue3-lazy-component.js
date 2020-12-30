import { inBrowser } from '../../util'
import {
  h,
  ref,
  getCurrentInstance,
  onMounted,
  onBeforeUnmount
} from 'vue3'

export default (lazy) => {
  return {
    props: {
      tag: {
        type: String,
        default: 'div'
      }
    },
    setup(props, { slots, emit }) {
      const show = ref(false)
      const state = { loaded: false }
      const rect = {}
      const dom = getCurrentInstance()

      const that = {
        el: null,
        state: state,
        rect: rect,
        show: show,
        getRect () {
          this.rect = dom.refs.root.getBoundingClientRect()
        },
        checkInView () {
          this.getRect()
          return inBrowser &&
            (this.rect.top < window.innerHeight * lazy.options.preLoad && this.rect.bottom > 0) &&
            (this.rect.left < window.innerWidth * lazy.options.preLoad && this.rect.right > 0)
        },
        load () {
          this.show.value = true
          this.state.loaded = true
          emit('show', this)
        }
      }

      onMounted(() => {
        that.el = getCurrentInstance().refs.root
        lazy.addLazyBox(that)
        lazy.lazyLoadHandler()
      })

      onBeforeUnmount(() => {
        lazy.removeComponent(that)
      })

      return () => 
        h(props.tag, { ref: 'root' }, show ? slots.default() : null)      
    }
  }
}
