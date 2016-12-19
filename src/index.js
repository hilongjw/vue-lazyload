import Lazy from './lazy'

export default (Vue, options = {}) => {
    const lazy = new Lazy(options)
    const isVueNext = Vue.version.split('.')[0] === '2'

    Vue.prototype.$Lazyload = lazy

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: lazy.add.bind(lazy),
            update: lazy.update.bind(lazy),
            componentUpdated: lazy.lazyLoadHandler.bind(lazy),
            unbind : lazy.remove.bind(lazy)
        })
    } else {
        Vue.directive('lazy', {
            bind: lazy.lazyLoadHandler.bind(lazy),
            update (newValue, oldValue) {
                Object.assign(this.$refs, this.$els)
                lazy.add(this.el, {
                    modifiers: this.modifiers || {},
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                }, {
                    context: this
                })
            },
            unbind () {
                lazy.remove(this.el)
            }
        })
    }
}
