import {
  loadImageAsync,
  noop
} from './util'
import Lazy from './lazy'
import { useCheckInView } from './useCheckInView'
import { loadImageAsyncOption } from '../types'

import {
  defineComponent,
  ref,
  reactive,
  watch,
  onMounted,
  onUnmounted,
  Ref,
  createVNode,
  computed
} from 'vue'

export default (lazy: Lazy) => {
  return defineComponent({
    props: {
      src: [String, Object],
      tag: {
        type: String,
        default: 'img'
      }
    },
    setup(props,{ slots }) {
      const el: Ref = ref(null)
      const options = reactive({
          src: '',
          error: '',
          loading: '',
          attempt: lazy.options.attempt
      })
      const state = reactive({
        loaded: false,
        error: false,
        attempt: 0
      })
      const {rect, checkInView } = useCheckInView(el, lazy.options.preLoad!)
      const renderSrc: Ref = ref('')
      const load = (onFinish = noop) => {
        if ((state.attempt > options.attempt! - 1) && state.error) {
          if (!lazy.options.silent) console.log(`VueLazyload log: ${options.src} tried too more than ${options.attempt} times`)
          onFinish()
          return
        }
        const src = options.src
        loadImageAsync({ src }, ({ src }: loadImageAsyncOption) => {
          renderSrc.value = src
          state.loaded = true
        }, () => {
          state.attempt++
          renderSrc.value = options.error
          state.error = true
        })
      }
      const vm = computed(() => {
        return {
          el: el.value,
          rect,
          checkInView,
          load,
          state,
        }
      })

      onMounted(() => {
        lazy.addLazyBox(vm.value)
        lazy.lazyLoadHandler()
      })
      onUnmounted(() => {
        lazy.removeComponent(vm.value)
      })

      const init = () => {
        const { src, loading, error } = lazy._valueFormatter(props.src)
        state.loaded = false
        options.src = src
        options.error = error!
        options.loading = loading!
        renderSrc.value = options.loading
      }

      watch(
        ()=> props.src,
        () => {
          init()
          lazy.addLazyBox(vm.value)
          lazy.lazyLoadHandler()
        }
      )

      init()

      return () => createVNode(
        props.tag,
        {
          src: renderSrc.value,
          ref: el
        },
        [slots.default?.()]
      )
    }
  })
}
