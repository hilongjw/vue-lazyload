import Lazy from './lazy'
import LazyComponent from './lazy-component'
import LazyContainer from './lazy-container'
import LazyImage from './lazy-image'
import { assign } from './util'

export default {
  /*
  * install function
  * @param  {Vue} Vue
  * @param  {object} options  lazyload options
  */
  install (Vue, options = {}) {
    const LazyClass = Lazy(Vue)
    const lazy = new LazyClass(options)
    const lazyContainer = new LazyContainer({ lazy })

    const isVue2 = Vue.version.split('.')[0] === '2'

    Vue.prototype.$Lazyload = lazy

    if (options.lazyComponent) {
      Vue.component('lazy-component', LazyComponent(lazy))
    }

    if (options.lazyImage) {
      Vue.component('lazy-image', LazyImage(lazy))
    }

    if (isVue2) {
      Vue.directive('lazy', {
        bind: lazy.add.bind(lazy),
        update: lazy.update.bind(lazy),
        componentUpdated: lazy.lazyLoadHandler.bind(lazy),
        unbind: lazy.remove.bind(lazy)
      })
      Vue.directive('lazy-container', {
        bind: lazyContainer.bind.bind(lazyContainer),
        componentUpdated: lazyContainer.update.bind(lazyContainer),
        unbind: lazyContainer.unbind.bind(lazyContainer)
      })
    } else {
      Vue.directive('lazy', {
        bind: lazy.lazyLoadHandler.bind(lazy),
        update (newValue, oldValue) {
          assign(this.vm.$refs, this.vm.$els)
          lazy.add(this.el, {
            modifiers: this.modifiers || {},
            arg: this.arg,
            value: newValue,
            oldValue: oldValue
          }, {
            context: this.vm
          })
        },
        unbind () {
          lazy.remove(this.el)
        }
      })

      Vue.directive('lazy-container', {
        update (newValue, oldValue) {
          lazyContainer.update(this.el, {
            modifiers: this.modifiers || {},
            arg: this.arg,
            value: newValue,
            oldValue: oldValue
          }, {
            context: this.vm
          })
        },
        unbind () {
          lazyContainer.unbind(this.el)
        }
      })
    }
  }
}

export {
  Lazy,
  LazyComponent,
  LazyImage,
  LazyContainer
}
