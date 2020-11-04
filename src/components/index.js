import Vue3LazyComponent from './vue3/vue3-lazy-component'
import Vue3LazyImage from './vue3/vue3-lazy-image'
import LazyComponent from './lazy-component'
import LazyImage from './lazy-image'

export function getLazyImage (tag, lazy) {
  return 'isVue3' === tag ? Vue3LazyComponent(lazy) : LazyImage(lazy)
}

export function getLazyComponent(tag, lazy) {
  return 'isVue3' === tag ? Vue3LazyComponent(lazy) : LazyComponent(lazy)
}
