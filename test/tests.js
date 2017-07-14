'use strict'
const it = require('mocha').it
const chai = require('chai')
const expect = require('chai').expect
const lazyload = require('../lib')
const Vue = require('vue')

describe('VueLazyload.js Test Suite', function () {
  it('install', function () {
    Vue.use(lazyload)
    const vm = new Vue()
    expect(vm.$Lazyload, 'has $Lazyload')
  })

  it('_valueFormatter', function () {
    const genLazyCore = require('../lib/lazy').default
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

  // it('add and remove TargetListener', function () {
  //   Vue.use(lazyload)
  //   const vm = new Vue()

  //   const list = Array.from({ length: 10 }).map((v, i) => {
  //       return { i, addEventListener () {}, removeEventListener () {} }
  //   })

  //   list.map(el => vm.$Lazyload._addListenerTarget(el))

  //   list.map(el => vm.$Lazyload._removeListenerTarget(el))

  //   expect(vm.$Lazyload.TargetQueue.length).to.equal(0)
  // })
})