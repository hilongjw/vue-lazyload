Vue-Lazyload 
========

see demo: [http://hilongjw.github.io/vue-lazyload/](http://hilongjw.github.io/vue-lazyload/)

Vue module for lazyloading images in your applications. Some of goals of this project worth noting include:

* Be lightweight, powerful and easy to use
* Work on any image type
* Add loading class while image is loading
* Supports both of Vue 1.0 and Vue 2.0

## Requirements

- Vue: ^1.0.0 or ^2.0.0 

## Install

From npm:

``` sh

$ npm install vue-lazyload --save

```

## Usage

```javascript
//main.js

import Vue from 'vue'
import App from './App.vue'

// supports both of Vue 1.0 and Vue 2.0
import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload, {
  preLoad: 1.3,
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
    </ul>
  </div>
</template>
```

## API

**Directive**

Basic

vue-lazyload will set this img element's `src` with `imgUrl`

```javascript
data: {
  imgUrl: 'http://xx.com/logo.png'
}
```
```html
<img v-lazy="imgUrl" />
```

Elemet with background-image 

```html
<div v-lazy:background-image="img" ></div>

<!-- rendered-->
<div style="background-image: url(dist/test3.jpg)"></div>
```

Customer scrollable element

```html
<ul id="container">
  <li v-for="img in list">
    <img v-lazy.container="img">
  </li> 
</ul>
```

**Options**

| params         | type         | detail      |
| :------------- |:-------------|:------------|
| preLoad        | Number       | proportion of pre-loading height|
| error          | String       | error img src |
| loading        | String       | loading img src |
| try            | Number       | attempts count|


**CSS state**

```
<img src="http://xxx.io/logo.png" lazy="loaded">
```

loading, loaded, error

```html
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

