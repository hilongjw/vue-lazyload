import Vue from 'vue'
var VueAsyncData = require('vue-async-data')
var VueResource = require('vue-resource')

import App from './App.vue'
import lazyload from './vue-lazyload.js'

Vue.use(lazyload, {
  error: 'dist/error.png',
  loading: 'dist/loading-spin.svg'
})

Vue.use(VueResource);
Vue.use(VueAsyncData);

/* eslint-disable no-new */
new Vue({
  el: 'body',
  components: {
    App
  }
})
