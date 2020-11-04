import Lazy from './lazy'
import LazyContainer from './lazy-container'
import { getLazyImage, getLazyComponent } from './components'
import { assign } from './util'
import { nextTick } from 'vue3'

const pluginScheam = {
  isVue3: (app, lazy, lazyContainer) => {
    app.provide('lazyload', lazy)
    app.directive('lazy', {
      beforeMount(el, binding, vnode) {
        lazy.add.call(lazy, el, binding, vnode)
      },
      beforeUpdate(el, binding, vnode) {
        lazy.update.call(lazy, el, binding, vnode)
      },
      updated() {
        lazy.lazyLoadHandler.call(lazy)
      },
      unmounted(el) {
        lazy.remove.call(lazy, el)
      }
    })
    app.directive('lazy-container', {
      beforeMount(el, binding, vnode) {
        lazyContainer.bind.call(lazyContainer, el, binding, vnode)
      },
      updated(el, binding, vnode) {
        lazyContainer.update.call(lazyContainer, el, binding, vnode)
      },
      unmounted(el) {
        lazyContainer.unbind.call(lazyContainer, el)
      }
    })
  },
  isVue2: (Vue, lazy, lazyContainer) => {
    Vue.prototype.$Lazyload = lazy
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
  },
  isVue1: (Vue, lazy, lazyContainer) => {
    Vue.prototype.$Lazyload = lazy
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

export default {
  /*
  * install function
  * @param  {Vue} Vue
  * @param  {object} options  lazyload options
  */
  install (_Vue, options = {}) {
    let vueVer = 'isVue2'
    const Vue = Object.create(_Vue)

    switch (Vue.version.split('.')[0]) {
      case '3':
        Vue.nextTick = nextTick
        vueVer = 'isVue3'
        break
      case '2':
        vueVer = 'isVue2'
        break
      default:
        vueVer = 'isVue1'
        break
    }

    const LazyClass = Lazy(Vue)
    const lazy = new LazyClass(options)
    const lazyContainer = new LazyContainer({ lazy })

    if (options.lazyComponent) {
      Vue.component('lazy-component', getLazyComponent(vueVer, lazy))
    }

    if (options.lazyImage) {
      Vue.component('lazy-image', getLazyImage(vueVer, lazy))
    }

    pluginScheam[vueVer](Vue, lazy, lazyContainer)
  }
}
