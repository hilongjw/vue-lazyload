import Vue from 'vue'
import App from './App.vue'
import lazyload from './vue-lazyload.js'

Vue.use(lazyload, {
  error: 'dist/error.png',
  loading: 'dist/loading-spin.svg'
})

/* eslint-disable no-new */
new Vue({
  el: 'body',
  components: {
    App
  }
})
