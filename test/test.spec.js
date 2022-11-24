import { mount } from '@vue/test-utils'
import VueLazyload from '../src'
import Lazy from '../src/lazy'
import { createApp, inject } from 'vue'

describe('VueLazyload.js Test Suite', function () {
  const App = {
    template: '<div></div>',
    data () {
      return {
        Lazyload: inject('Lazyload')
      }
    }
  }

  it('install', function () {
    const wrapper = mount(App, {
      global: {
        plugins: [VueLazyload]
      }
    })

    expect(wrapper.vm.Lazyload.mode).toBe('event')
  })

  it('_valueFormatter', function () {
    const lazyload = new Lazy({
      error: "error",
      loading: "loading"
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
