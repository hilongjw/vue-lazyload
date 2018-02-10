# Vue-Lazyload

[![Build Status](https://img.shields.io/circleci/project/hilongjw/vue-lazyload/master.svg?style=flat-square)](https://circleci.com/gh/hilongjw/vue-lazyload)
[![npm version](https://img.shields.io/npm/v/vue-lazyload.svg?style=flat-square)](http://badge.fury.io/js/vue-lazyload)
[![npm downloads](https://img.shields.io/npm/dm/vue-lazyload.svg?style=flat-square)](http://badge.fury.io/js/vue-lazyload)
[![npm license](https://img.shields.io/npm/l/vue-lazyload.svg?style=flat-square)](http://badge.fury.io/js/vue-lazyload)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![CDNJS version](https://img.shields.io/cdnjs/v/vue-lazyload.svg)](https://cdnjs.com/libraries/vue-lazyload)

Vue module for lazyloading images in your applications. Some of goals of this project worth noting include:

* Be lightweight, powerful and easy to use
* Work on any image type
* Add loading class while image is loading
* Supports both of Vue 1.0 and Vue 2.0



# Table of Contents

* [___Demo___](#demo)
* [___Requirements___](#requirements)
* [___Installation___](#installation)
* [___Usage___](#usage)
 * [___Constructor Options___](#constructor-options)
 * [___Implementation___](#implementation)
    * [___Basic___](#basic)
    * [___Css state___](#css-state)
* [___Methods___](#methods)
  * [__Event hook__](#event-hook)
  * [__LazyLoadHandler__](#lazyloadhandler)
  * [__Performance__](#performance)
* [___Authors && Contributors___](#authors-&&-Contributors)
* [___License___](#license)


# Demo

[___Demo___](http://hilongjw.github.io/vue-lazyload/)

# Requirements

- [Vue.js](https://github.com/vuejs/vue) `1.x` or `2.x`


# Installation

## npm

```bash

$ npm install vue-lazyload -D

```

## CDN

CDN: [https://unpkg.com/vue-lazyload/vue-lazyload.js](https://unpkg.com/vue-lazyload/vue-lazyload.js)

```html
<script src="https://unpkg.com/vue-lazyload/vue-lazyload.js"></script>
<script>
  Vue.use(VueLazyload)
  ...
</script>

```

# Usage

main.js:

```javascript

import Vue from 'vue'
import App from './App.vue'
import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload)

// or with options
Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: 'dist/error.png',
  loading: 'dist/loading.gif',
  attempt: 1
})

new Vue({
  el: 'body',
  components: {
    App
  }
})
```

template:

```html
<ul>
  <li v-for="img in list">
    <img v-lazy="img.src" >
  </li>
</ul>
```

use `v-lazy-container` work with raw HTML

```html
<div v-lazy-container="{ selector: 'img' }">
  <img data-src="//domain.com/img1.jpg">
  <img data-src="//domain.com/img2.jpg">
  <img data-src="//domain.com/im3.jpg">
</div>
```

## Constructor Options

|key|description|default|options|
|:---|---|---|---|
| `preLoad`|proportion of pre-loading height|`1.3`|`Number`|
|`error`|src of the image upon load fail|`'data-src'`|`String`
|`loading`|src of the image while loading|`'data-src'`|`String`|
|`attempt`|attempts count|`3`|`Number`|
|`listenEvents`|events that you want vue listen for|`['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove']`| [Desired Listen Events](#desired-listen-events) |
|`adapter`| dynamically modify the attribute of element |`{ }`| [Element Adapter](#element-adapter) |
|`filter`| the image's listener filter |`{ }`| [Image listener filter](#image-listener-filter) |
|`lazyComponent`| lazyload component | `false` | [Lazy Component](#lazy-component)
| `dispatchEvent`|trigger the dom event|`false`|`Boolean`|
| `throttleWait`|throttle wait|`200`|`Number`|
| `observer`|use IntersectionObserver|`false`|`Boolean`|
| `observerOptions`|IntersectionObserver options|{ rootMargin: '0px', threshold: 0.1 }|[IntersectionObserver](#intersectionobserver)|
| `silent`|do not print debug info|`true`|`Boolean`|

### Desired Listen Events

You can configure which events you want vue-lazyload by passing in an array
of listener names.

```javascript
Vue.use(VueLazyload, {
  preLoad: 1.3,
  error: 'dist/error.png',
  loading: 'dist/loading.gif',
  attempt: 1,
  // the default is ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend']
  listenEvents: [ 'scroll' ]
})
```

This is useful if you are having trouble with this plugin resetting itself to loading
when you have certain animations and transitions taking place


### Image listener filter

dynamically modify the src of image

```javascript
Vue.use(vueLazy, {
    filter: {
      progressive (listener, options) {
          const isCDN = /qiniudn.com/
          if (isCDN.test(listener.src)) {
              listener.el.setAttribute('lazy-progressive', 'true')
              listener.loading = listener.src + '?imageView2/1/w/10/h/10'
          }
      },
      webp (listener, options) {
          if (!options.supportWebp) return
          const isCDN = /qiniudn.com/
          if (isCDN.test(listener.src)) {
              listener.src += '?imageView2/2/format/webp'
          }
      }
    }
})
```


### Element Adapter

```javascript
Vue.use(vueLazy, {
    adapter: {
        loaded ({ bindType, el, naturalHeight, naturalWidth, $parent, src, loading, error, Init }) {
            // do something here
            // example for call LoadedHandler
            LoadedHandler(el)
        },
        loading (listender, Init) {
            console.log('loading')
        },
        error (listender, Init) {
            console.log('error')
        }
    }
})
```

### IntersectionObserver

use [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to to improve performance of a large number of nodes.

```javascript
Vue.use(vueLazy, {
  // set observer to true
  observer: true,

  // optional
  observerOptions: {
    rootMargin: '0px',
    threshold: 0.1
  }
})
```


### Lazy Component
```javascript
Vue.use(VueLazyload, {
  lazyComponent: true
});
```

```html
<lazy-component @show="handler">
  <img class="mini-cover" :src="img.src" width="100%" height="400">
</lazy-component>

<script>
  {
    ...
    methods: {
      handler (component) {
        console.log('this component is showing')
      }
    }

  }
</script>
```


## Implementation

### Basic

vue-lazyload will set this img element's `src` with `imgUrl` string

```html
<script>
export default {
  data () {
    return {
      imgObj: {
        src: 'http://xx.com/logo.png',
        error: 'http://xx.com/error.png',
        loading: 'http://xx.com/loading-spin.svg'
      },
      imgUrl: 'http://xx.com/logo.png' // String
    }
  }
}
</script>

<template>
  <div ref="container">
     <img v-lazy="imgUrl"/>
     <div v-lazy:background-image="imgUrl"></div>

     <!-- with customer error and loading -->
     <img v-lazy="imgObj"/>
     <div v-lazy:background-image="imgObj"></div>

     <!-- Customer scrollable element -->
     <img v-lazy.container ="imgUrl"/>
     <div v-lazy:background-image.container="img"></div>

    <!-- srcset -->
    <img v-lazy="'img.400px.jpg'" data-srcset="img.400px.jpg 400w, img.800px.jpg 800w, img.1200px.jpg 1200w">
    <img v-lazy="imgUrl" :data-srcset="imgUrl' + '?size=400 400w, ' + imgUrl + ' ?size=800 800w, ' + imgUrl +'/1200.jpg 1200w'" />
  </div>
</template>
```

### CSS state

There are three states while img loading

`loading`  `loaded`  `error`

```html
<img src="imgUrl" lazy="loading">
<img src="imgUrl" lazy="loaded">
<img src="imgUrl" lazy="error">
```

```html
<style>
  img[lazy=loading] {
    /*your style here*/
  }
  img[lazy=error] {
    /*your style here*/
  }
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
  }
  .yourclass[lazy=loaded] {
    /*your style here*/
  }
</style>
```

## Methods

### Event Hook

`vm.$Lazyload.$on(event, callback)`
`vm.$Lazyload.$off(event, callback)`
`vm.$Lazyload.$once(event, callback)`

- `$on` Listen for a custom events `loading`, `loaded`, `error`
- `$once` Listen for a custom event, but only once. The listener will be removed once it triggers for the first time.
- `$off` Remove event listener(s).

#### `vm.$Lazyload.$on`

#### Arguments:

 * `{string} event`
 * `{Function} callback`

#### Example

```javascript
vm.$Lazyload.$on('loaded', function ({ bindType, el, naturalHeight, naturalWidth, $parent, src, loading, error }, formCache) {
  console.log(el, src)
})
```

#### `vm.$Lazyload.$once`

#### Arguments:

 * `{string} event`
 * `{Function} callback`

#### Example

```javascript
vm.$Lazyload.$once('loaded', function ({ el, src }) {
  console.log(el, src)
})
```

#### `vm.$Lazyload.$off`

If only the event is provided, remove all listeners for that event

#### Arguments:

 * `{string} event`
 * `{Function} callback`

#### Example

```javascript
function handler ({ el, src }, formCache) {
  console.log(el, src)
}
vm.$Lazyload.$on('loaded', handler)
vm.$Lazyload.$off('loaded', handler)
vm.$Lazyload.$off('loaded')
```

### LazyLoadHandler

`vm.$Lazyload.lazyLoadHandler`

Manually trigger lazy loading position calculation

#### Example

```javascript

this.$Lazyload.lazyLoadHandler()

```

### Performance

```javascript
this.$Lazyload.$on('loaded', function (listener) {
  console.table(this.$Lazyload.performance())
})
```

![performance-demo](http://ww1.sinaimg.cn/large/69402bf8gw1fbo62ocvlaj213k09w78w.jpg)

# Authors && Contributors

- [hilongjw](https://github.com/hilongjw)
- [imcvampire](https://github.com/imcvampire)
- [darrynten](https://github.com/darrynten)
- [biluochun](https://github.com/biluochun)
- [whwnow](https://github.com/whwnow)
- [Leopoldthecoder](https://github.com/Leopoldthecoder)
- [michalbcz](https://github.com/michalbcz)
- [blue0728](https://github.com/blue0728)
- [JounQin](https://github.com/JounQin)
- [llissery](https://github.com/llissery)
- [mega667](https://github.com/mega667)
- [RobinCK](https://github.com/RobinCK)
- [GallenHu](https://github.com/GallenHu)

# License

[The MIT License](http://opensource.org/licenses/MIT)
