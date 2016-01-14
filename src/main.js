import Vue from 'vue'
import App from './App.vue'
import lazyload from './vue-lazyload.js'

Vue.directive('lazy', lazyload)

/* eslint-disable no-new */
new Vue({
  el: 'body',
  components: {
    App
  }
})
