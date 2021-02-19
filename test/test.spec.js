import Vue from 'vue'
import VueLazyload from '../src'
import genLazyCore from '../src/lazy'
import assert from 'assert'

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
      loading: 'loading'
    })

    expect(lazyload._valueFormatter('src').src).toBe('src')
    expect(lazyload._valueFormatter('src').error).toBe('error')
    expect(lazyload._valueFormatter('src').loading).toBe('loading')

    expect(lazyload._valueFormatter({
      src: 'src',
      error: 'error',
      loading: 'loading'
    }).src).toBe('src')

    expect(lazyload._valueFormatter({
      src: 'src',
      error: 'error',
      loading: 'loading'
    }).error).toBe('error')

    expect(lazyload._valueFormatter({
      src: 'src',
      error: 'error',
      loading: 'loading'
    }).loading).toBe('loading')
  })
})
