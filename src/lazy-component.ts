import Lazy from './lazy'
import {
  defineComponent,
  onMounted,
  onUnmounted,
  ref,
  reactive,
  computed,
  createVNode
} from 'vue'
import { useCheckInView } from './useCheckInView'

export default (lazy: Lazy) => {
  return defineComponent({
    props: {
      tag: {
        type: String,
        default: 'div'
      }
    },
    emits: ['show'],
    setup(props, { emit, slots }) {
      const el = ref<HTMLElement>()
      const state = reactive({
        loaded: false,
        error: false,
        attempt: 0
      })
      const show = ref(false)
      const { rect, checkInView } = useCheckInView(el, lazy.options.preLoad!)
      const load = () => {
        show.value = true
        state.loaded = true
        emit('show', show.value)
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

      return () => createVNode(
        props.tag,
        {
          ref: el
        },
        [show.value && slots.default?.()]
      )
    }
  })
}