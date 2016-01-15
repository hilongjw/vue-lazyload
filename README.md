Vue-Lazyload 
========

 - see demo[http://hilongjw.github.io/vue-lazyload/](http://hilongjw.github.io/vue-lazyload/)
 - Vue module for lazyloading images in your applications. Some of goals of this project worth noting include:

* Be lightweight, powerful and easy to use
* Work on any image type
* Add loading class while image is loading

## Requirements

- vue: ^1.0.0

## Install

From npm:

``` sh
$ npm install vue-focus --save
```

##Usage

```javascript
//main.js

import Vue from 'vue'
import App from './App.vue'
import lazyload from 'vue-lazyload'

Vue.use(lazyload, {
  error: 'dist/error.png',
  loading: 'dist/loading.gif'
})

new Vue({
  el: 'body',
  components: {
    App
  }
})
```

```html
<!--your.vue-->
<script>
export default {
  data () {
    return {
      list: ['dist/test1.jpg', 'dist/test2.jpg', 'dist/test3.jpg', 'dist/test4.jpg', 'dist/test5.jpg', 'dist/test6.jpg', 'dist/test7.jpg', 'dist/test8.jpg']
    }
  },
  ready () {},
  destroyed () {}
}
</script>

<template>
  <div class="img-list">
    <ul>
      <li v-for="img in list" track-by="$index">
        <img v-lazy="img">
      </li>
    </ul>
  </div>
</template>

<style>
  img[lazy=loading]{
    /*your style here*/
  }
  img[lazy=error]{
    /*your style here*/
  }
</style>

```

### todo

* more custom setting
* css loading
