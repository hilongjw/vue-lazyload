import Vue from 'vue'
import VueLazyload from '../src'
import genLazyCore from '../src/lazy'

describe('VueLazyload.js Test Suite', function () {
  it('install', function () {
    Vue.use(VueLazyload)
    const vm = new Vue()
    assert(vm.$Lazyload, 'has $Lazyload')
  })

  it('_valueFormatter', function () {
    const LazyCore = genLazyCore(Vue)

    const lazyload = new LazyCore({
        error: 'error',
        loading: 'loading',
    })

    expect(lazyload._valueFormatter('src').src).to.equal('src')
    expect(lazyload._valueFormatter('src').error).to.equal('error')
    expect(lazyload._valueFormatter('src').loading).to.equal('loading')

    expect(lazyload._valueFormatter({
        src: 'src',
        error: 'error',
        loading: 'loading',
    }).src).to.equal('src')

    expect(lazyload._valueFormatter({
        src: 'src',
        error: 'error',
        loading: 'loading',
    }).error).to.equal('error')

    expect(lazyload._valueFormatter({
        src: 'src',
        error: 'error',
        loading: 'loading',
    }).loading).to.equal('loading')
  })
})
