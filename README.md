Vue-Lazyload 
========

see demo: [http://hilongjw.github.io/vue-lazyload/](http://hilongjw.github.io/vue-lazyload/)

Vue module for lazyloading images in your applications. Some of goals of this project worth noting include:

* Be lightweight, powerful and easy to use
* Work on any image type
* Add loading class while image is loading

## Requirements

- vue: ^1.0.0

## Install

From npm:

``` sh

$ npm install vue-lazyload --save

```

##Usage

```javascript
//main.js

import Vue from 'vue'
import App from './App.vue'
import lazyload from 'vue-lazyload'

Vue.use(lazyload, {
  error: 'dist/error.png',
  loading: 'dist/loading.gif',
  try: 3 // default 1
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
      list: [
        'your_images_url', 
        'your_images_url', 
        'your_images_url'
      ]
    }
  }
}
</script>

<template>
  <div class="img-list">
    <ul id="container">
      <li v-for="img in list">
        <img v-lazy="img">
      </li>
      <!-- 
      for custom container
      <li v-for="img in list">
        <img v-lazy.container="img">
      </li> 

      for background-image
      <li v-for="img in list">
        <div v-lazy:background-image="img" class="bg-box"></div>
      </li>
      -->
    </ul>
  </div>
</template>

<style>
  img[lazy=loading] {
    /*your style here*/
  }
  img[lazy=error] {
    /*your style here*/
  },
  img[lazy=loaded] {
    /*your style here*/
  }
  /*
  or background-image
  */
  .yourclass[lazy=loading] {
    /*your style here*/
  }
  .yourclass[lazy=error] {
    /*your style here*/
  },
  .yourclass[lazy=loaded] {
    /*your style here*/
  }
</style>

```
