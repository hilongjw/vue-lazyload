/*!
 * Vue-Lazyload.js v3.0.0
 * (c) 2023 Awe <hilongjw@gmail.com>
 * Released under the MIT License.
 */

import { nextTick, reactive, defineComponent, ref, computed, onMounted, onUnmounted, createVNode, watch } from 'vue';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var assignSymbols$1 = createCommonjsModule(function (module) {

  const toString = Object.prototype.toString;
  const isEnumerable = Object.prototype.propertyIsEnumerable;
  const getSymbols = Object.getOwnPropertySymbols;

  module.exports = (target, ...args) => {
    if (!isObject(target)) {
      throw new TypeError('expected the first argument to be an object');
    }

    if (args.length === 0 || typeof Symbol !== 'function' || typeof getSymbols !== 'function') {
      return target;
    }

    for (let arg of args) {
      let names = getSymbols(arg);

      for (let key of names) {
        if (isEnumerable.call(arg, key)) {
          target[key] = arg[key];
        }
      }
    }
    return target;
  };

  function isObject(val) {
    return typeof val === 'function' || toString.call(val) === '[object Object]' || Array.isArray(val);
  }
});

var assignSymbols$2 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	'default': assignSymbols$1,
	__moduleExports: assignSymbols$1
});

var assignSymbols = ( assignSymbols$2 && assignSymbols$1 ) || assignSymbols$2;

var assignDeep = createCommonjsModule(function (module) {

  const toString = Object.prototype.toString;

  const isValidKey = key => {
    return key !== '__proto__' && key !== 'constructor' && key !== 'prototype';
  };

  const assign = module.exports = (target, ...args) => {
    let i = 0;
    if (isPrimitive(target)) target = args[i++];
    if (!target) target = {};
    for (; i < args.length; i++) {
      if (isObject(args[i])) {
        for (const key of Object.keys(args[i])) {
          if (isValidKey(key)) {
            if (isObject(target[key]) && isObject(args[i][key])) {
              assign(target[key], args[i][key]);
            } else {
              target[key] = args[i][key];
            }
          }
        }
        assignSymbols(target, args[i]);
      }
    }
    return target;
  };

  function isObject(val) {
    return typeof val === 'function' || toString.call(val) === '[object Object]';
  }

  function isPrimitive(val) {
    return typeof val === 'object' ? val === null : typeof val !== 'function';
  }
});

const inBrowser = typeof window !== 'undefined' && window !== null;
const hasIntersectionObserver = checkIntersectionObserver();
function checkIntersectionObserver() {
    if (inBrowser && 'IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype) {
        // Minimal polyfill for Edge 15's lack of `isIntersecting`
        // See: https://github.com/w3c/IntersectionObserver/issues/211
        if (!('isIntersecting' in window.IntersectionObserverEntry.prototype)) {
            Object.defineProperty(window.IntersectionObserverEntry.prototype, 'isIntersecting', {
                get: function () {
                    return this.intersectionRatio > 0;
                }
            });
        }
        return true;
    }
    return false;
}
const modeType = {
    event: 'event',
    observer: 'observer'
};
function remove(arr, item) {
    if (!arr.length) return;
    const index = arr.indexOf(item);
    if (index > -1) return arr.splice(index, 1);
}
function getBestSelectionFromSrcset(el, scale) {
    if (el.tagName !== 'IMG' || !el.getAttribute('data-srcset')) return '';
    let options = el.getAttribute('data-srcset').trim().split(',');
    const result = [];
    const container = el.parentNode;
    const containerWidth = container.offsetWidth * scale;
    let spaceIndex;
    let tmpSrc;
    let tmpWidth;
    options.forEach(item => {
        item = item.trim();
        spaceIndex = item.lastIndexOf(' ');
        if (spaceIndex === -1) {
            tmpSrc = item;
            tmpWidth = 99999;
        } else {
            tmpSrc = item.substr(0, spaceIndex);
            tmpWidth = parseInt(item.substr(spaceIndex + 1, item.length - spaceIndex - 2), 10);
        }
        result.push([tmpWidth, tmpSrc]);
    });
    result.sort((a, b) => {
        if (a[0] < b[0]) {
            return 1;
        }
        if (a[0] > b[0]) {
            return -1;
        }
        if (a[0] === b[0]) {
            if (b[1].indexOf('.webp', b[1].length - 5) !== -1) {
                return 1;
            }
            if (a[1].indexOf('.webp', a[1].length - 5) !== -1) {
                return -1;
            }
        }
        return 0;
    });
    let bestSelectedSrc = '';
    let tmpOption;
    for (let i = 0; i < result.length; i++) {
        tmpOption = result[i];
        bestSelectedSrc = tmpOption[1];
        const next = result[i + 1];
        if (next && next[0] < containerWidth) {
            bestSelectedSrc = tmpOption[1];
            break;
        } else if (!next) {
            bestSelectedSrc = tmpOption[1];
            break;
        }
    }
    return bestSelectedSrc;
}
const getDPR = (scale = 1) => inBrowser ? window.devicePixelRatio || scale : scale;
// https://developers.google.com/speed/webp/faq#how_can_i_detect_browser_support_using_javascript
function supportWebp() {
    if (!inBrowser) return false;
    let support = true;
    function checkWebpFeature(feature, callback) {
        const kTestImages = {
            lossy: 'UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA',
            lossless: 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==',
            alpha: 'UklGRkoAAABXRUJQVlA4WAoAAAAQAAAAAAAAAAAAQUxQSAwAAAARBxAR/Q9ERP8DAABWUDggGAAAABQBAJ0BKgEAAQAAAP4AAA3AAP7mtQAAAA==',
            animation: 'UklGRlIAAABXRUJQVlA4WAoAAAASAAAAAAAAAAAAQU5JTQYAAAD/////AABBTk1GJgAAAAAAAAAAAAAAAAAAAGQAAABWUDhMDQAAAC8AAAAQBxAREYiI/gcA'
        };
        const img = new Image();
        img.onload = function () {
            const result = img.width > 0 && img.height > 0;
            callback(result);
        };
        img.onerror = function () {
            // eslint-disable-next-line node/no-callback-literal
            callback(false);
        };
        img.src = 'data:image/webp;base64,' + kTestImages[feature];
    }
    checkWebpFeature('lossy', isSupported => {
        support = isSupported;
    });
    checkWebpFeature('lossless', isSupported => {
        support = isSupported;
    });
    checkWebpFeature('alpha', isSupported => {
        support = isSupported;
    });
    checkWebpFeature('animation', isSupported => {
        support = isSupported;
    });
    return support;
}
function throttle(action, delay) {
    let timeout = null;
    let lastRun = 0;
    return function () {
        if (timeout) {
            return;
        }
        const elapsed = Date.now() - lastRun;
        // @ts-ignore
        const context = this;
        const args = arguments;
        const runCallback = function () {
            lastRun = Date.now();
            timeout = false;
            action.apply(context, args);
        };
        if (elapsed >= delay) {
            runCallback();
        } else {
            timeout = setTimeout(runCallback, delay);
        }
    };
}
function testSupportsPassive() {
    if (!inBrowser) return false;
    let support = false;
    try {
        const opts = Object.defineProperty({}, 'passive', {
            get: function () {
                support = true;
            }
        });
        window.addEventListener('test', noop, opts);
    } catch (e) {}
    return support;
}
const supportsPassive = testSupportsPassive();
const _ = {
    on(el, type, func, capture = false) {
        if (supportsPassive) {
            el.addEventListener(type, func, {
                capture: capture,
                passive: true
            });
        } else {
            el.addEventListener(type, func, capture);
        }
    },
    off(el, type, func, capture = false) {
        el.removeEventListener(type, func, capture);
    }
};
const loadImageAsync = (item, resolve, reject) => {
    let image = new Image();
    if (!item || !item.src) {
        const err = new Error('image src is required');
        return reject(err);
    }
    if (item.cors) {
        image.crossOrigin = item.cors;
    }
    image.src = item.src;
    image.onload = function () {
        resolve({
            naturalHeight: image.naturalHeight,
            naturalWidth: image.naturalWidth,
            src: image.src
        });
        image = null;
    };
    image.onerror = function (e) {
        reject(e);
    };
};
// keyof CSSStyleDeclaration
const style = (el, prop) => {
    return typeof getComputedStyle !== 'undefined' ? getComputedStyle(el, null).getPropertyValue(prop) : el.style[prop];
};
const overflow = el => {
    return style(el, 'overflow') + style(el, 'overflowY') + style(el, 'overflowX');
};
const scrollParent = el => {
    if (!inBrowser) return;
    if (!(el instanceof Element)) {
        return window;
    }
    let parent = el;
    while (parent) {
        if (parent === document.body || parent === document.documentElement) {
            break;
        }
        if (!parent.parentNode) {
            break;
        }
        if (/(scroll|auto)/.test(overflow(parent))) {
            return parent;
        }
        parent = parent.parentNode;
    }
    return window;
};
function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
function noop() {}
class ImageCache {
    constructor(max) {
        this.max = max || 100;
        this._caches = [];
    }
    has(key) {
        return this._caches.indexOf(key) > -1;
    }
    add(key) {
        if (this.has(key)) return;
        this._caches.push(key);
        if (this._caches.length > this.max) {
            this.free();
        }
    }
    free() {
        this._caches.shift();
    }
}

// el: {
//     state,
//     src,
//     error,
//     loading
// }
class ReactiveListener {
    constructor(el, src, error, loading, bindType, $parent, options, cors, elRenderer, imageCache) {
        this.el = el;
        this.src = src;
        this.error = error;
        this.loading = loading;
        this.bindType = bindType;
        this.attempt = 0;
        this.cors = cors;
        this.naturalHeight = 0;
        this.naturalWidth = 0;
        this.options = options;
        this.rect = {};
        this.$parent = $parent;
        this.elRenderer = elRenderer;
        this._imageCache = imageCache;
        this.performanceData = {
            init: Date.now(),
            loadStart: 0,
            loadEnd: 0
        };
        this.filter();
        this.initState();
        this.render('loading', false);
    }
    /*
     * init listener state
     * @return
     */
    initState() {
        if ('dataset' in this.el) {
            this.el.dataset.src = this.src;
        } else {
            this.el.setAttribute('data-src', this.src);
        }
        this.state = {
            loading: false,
            error: false,
            loaded: false,
            rendered: false
        };
    }
    /*
     * record performance
     * @return
     */
    record(event) {
        this.performanceData[event] = Date.now();
    }
    /*
     * update image listener data
     * @param  {String} image uri
     * @param  {String} loading image uri
     * @param  {String} error image uri
     * @return
     */
    update(option) {
        const oldSrc = this.src;
        this.src = option.src;
        this.loading = option.loading;
        this.error = option.error;
        this.filter();
        if (oldSrc !== this.src) {
            this.attempt = 0;
            this.initState();
        }
    }
    /*
     * get el node rect
     * @return
     */
    getRect() {
        this.rect = this.el.getBoundingClientRect();
    }
    /*
     * check el is in view
     * @return {Boolean} el is in view
     */
    checkInView() {
        this.getRect();
        return this.rect.top < window.innerHeight * this.options.preLoad && this.rect.bottom > this.options.preLoadTop && this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0;
    }
    /*
     * listener filter
     */
    filter() {
        for (const key in this.options.filter) {
            this.options.filter[key](this, this.options);
        }
    }
    /*
     * render loading first
     * @params cb:Function
     * @return
     */
    renderLoading(cb) {
        this.state.loading = true;
        loadImageAsync({
            src: this.loading,
            cors: this.cors
        }, () => {
            this.render('loading', false);
            this.state.loading = false;
            cb();
        }, () => {
            // handler `loading image` load failed
            cb();
            this.state.loading = false;
            if (!this.options.silent) console.warn(`VueLazyload log: load failed with loading image(${this.loading})`);
        });
    }
    /*
     * try load image and  render it
     * @return
     */
    load(onFinish = noop) {
        if (this.attempt > this.options.attempt - 1 && this.state.error) {
            if (!this.options.silent) console.log(`VueLazyload log: ${this.src} tried too more than ${this.options.attempt} times`);
            onFinish();
            return;
        }
        if (this.state.rendered && this.state.loaded) return;
        if (this._imageCache.has(this.src)) {
            this.state.loaded = true;
            this.render('loaded', true);
            this.state.rendered = true;
            return onFinish();
        }
        this.renderLoading(() => {
            this.attempt++;
            this.options.adapter.beforeLoad && this.options.adapter.beforeLoad(this, this.options);
            this.record('loadStart');
            loadImageAsync({
                src: this.src,
                cors: this.cors
            }, data => {
                this.naturalHeight = data.naturalHeight;
                this.naturalWidth = data.naturalWidth;
                this.state.loaded = true;
                this.state.error = false;
                this.record('loadEnd');
                this.render('loaded', false);
                this.state.rendered = true;
                this._imageCache.add(this.src);
                onFinish();
            }, err => {
                !this.options.silent && console.error(err);
                this.state.error = true;
                this.state.loaded = false;
                this.render('error', false);
            });
        });
    }
    /*
     * render image
     * @param  {String} state to render // ['loading', 'src', 'error']
     * @param  {String} is form cache
     * @return
     */
    render(state, cache) {
        this.elRenderer(this, state, cache);
    }
    /*
     * output performance data
     * @return {Object} performance data
     */
    performance() {
        let state = 'loading';
        let time = 0;
        if (this.state.loaded) {
            state = 'loaded';
            time = (this.performanceData.loadEnd - this.performanceData.loadStart) / 1000;
        }
        if (this.state.error) state = 'error';
        return {
            src: this.src,
            state,
            time
        };
    }
    /*
     * $destroy
     * @return
     */
    $destroy() {
        this.el = null;
        this.src = '';
        this.error = null;
        this.loading = '';
        this.bindType = null;
        this.attempt = 0;
    }
}

const DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
const DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'];
const DEFAULT_OBSERVER_OPTIONS = {
    rootMargin: '0px',
    threshold: 0
};
class Lazy {
    constructor({ preLoad, error, throttleWait, preLoadTop, dispatchEvent, loading, attempt, silent = true, scale, listenEvents, filter, adapter, observer, observerOptions }) {
        this.version = '"3.0.0"';
        this.lazyContainerMananger = null;
        this.mode = modeType.event;
        this.ListenerQueue = [];
        this.TargetIndex = 0;
        this.TargetQueue = [];
        this.options = {
            silent: silent,
            dispatchEvent: !!dispatchEvent,
            throttleWait: throttleWait || 200,
            preLoad: preLoad || 1.3,
            preLoadTop: preLoadTop || 0,
            error: error || DEFAULT_URL,
            loading: loading || DEFAULT_URL,
            attempt: attempt || 3,
            scale: scale || getDPR(scale),
            listenEvents: listenEvents || DEFAULT_EVENTS,
            supportWebp: supportWebp(),
            filter: filter || {},
            adapter: adapter || {},
            observer: !!observer,
            observerOptions: observerOptions || DEFAULT_OBSERVER_OPTIONS
        };
        this._initEvent();
        this._imageCache = new ImageCache(200);
        this.lazyLoadHandler = throttle(this._lazyLoadHandler.bind(this), this.options.throttleWait);
        this.setMode(this.options.observer ? modeType.observer : modeType.event);
    }
    /**
     * output listener's load performance
     * @return {Array}
     */
    performance() {
        const list = [];
        this.ListenerQueue.map(item => list.push(item.performance()));
        return list;
    }
    /*
     * add lazy component to queue
     * @param  {Vue} vm lazy component instance
     * @return
     */
    addLazyBox(vm) {
        this.ListenerQueue.push(vm);
        if (inBrowser) {
            this._addListenerTarget(window);
            this._observer && this._observer.observe(vm.el);
            if (vm.$el && vm.$el.parentNode) {
                this._addListenerTarget(vm.$el.parentNode);
            }
        }
    }
    /*
     * add image listener to queue
     * @param  {DOM} el
     * @param  {object} binding vue directive binding
     * @param  {vnode} vnode vue directive vnode
     * @return
     */
    add(el, binding, vnode) {
        if (this.ListenerQueue.some(item => item.el === el)) {
            this.update(el, binding);
            return nextTick(this.lazyLoadHandler);
        }
        let { src, loading, error, cors } = this._valueFormatter(binding.value);
        nextTick(() => {
            src = getBestSelectionFromSrcset(el, this.options.scale) || src;
            this._observer && this._observer.observe(el);
            const container = Object.keys(binding.modifiers)[0];
            let $parent;
            if (container) {
                $parent = binding.instance.$refs[container];
                // if there is container passed in, try ref first, then fallback to getElementById to support the original usage
                $parent = $parent ? $parent.el || $parent : document.getElementById(container);
            }
            if (!$parent) {
                $parent = scrollParent(el);
            }
            const newListener = new ReactiveListener(el, src, error, loading, binding.arg, $parent, this.options, cors, this._elRenderer.bind(this), this._imageCache);
            this.ListenerQueue.push(newListener);
            if (inBrowser) {
                this._addListenerTarget(window);
                this._addListenerTarget($parent);
            }
            nextTick(this.lazyLoadHandler);
        });
    }
    /**
    * update image src
    * @param  {DOM} el
    * @param  {object} vue directive binding
    * @return
    */
    update(el, binding, vnode) {
        let { src, loading, error } = this._valueFormatter(binding.value);
        src = getBestSelectionFromSrcset(el, this.options.scale) || src;
        const exist = this.ListenerQueue.find(item => item.el === el);
        if (!exist) {
            // https://github.com/hilongjw/vue-lazyload/issues/374
            if (el.getAttribute('lazy') !== 'loaded' || el.dataset.src !== src) {
                this.add(el, binding, vnode);
            }
        } else {
            exist.update({
                src,
                loading,
                error
            });
        }
        if (this._observer) {
            this._observer.unobserve(el);
            this._observer.observe(el);
        }
        nextTick(this.lazyLoadHandler);
    }
    /**
    * remove listener form list
    * @param  {DOM} el
    * @return
    */
    remove(el) {
        if (!el) return;
        this._observer && this._observer.unobserve(el);
        const existItem = this.ListenerQueue.find(item => item.el === el);
        if (existItem) {
            this._removeListenerTarget(existItem.$parent);
            this._removeListenerTarget(window);
            remove(this.ListenerQueue, existItem);
            existItem.$destroy && existItem.$destroy();
        }
    }
    /*
     * remove lazy components form list
     * @param  {Vue} vm Vue instance
     * @return
     */
    removeComponent(vm) {
        if (!vm) return;
        remove(this.ListenerQueue, vm);
        this._observer && this._observer.unobserve(vm.el);
        if (vm.$parent && vm.$el.parentNode) {
            this._removeListenerTarget(vm.$el.parentNode);
        }
        this._removeListenerTarget(window);
    }
    setMode(mode) {
        if (!hasIntersectionObserver && mode === modeType.observer) {
            mode = modeType.event;
        }
        this.mode = mode; // event or observer
        if (mode === modeType.event) {
            if (this._observer) {
                this.ListenerQueue.forEach(listener => {
                    this._observer.unobserve(listener.el);
                });
                this._observer = null;
            }
            this.TargetQueue.forEach(target => {
                this._initListen(target.el, true);
            });
        } else {
            this.TargetQueue.forEach(target => {
                this._initListen(target.el, false);
            });
            this._initIntersectionObserver();
        }
    }
    /*
    *** Private functions ***
    */
    /*
     * add listener target
     * @param  {DOM} el listener target
     * @return
     */
    _addListenerTarget(el) {
        if (!el) return;
        let target = this.TargetQueue.find(target => target.el === el);
        if (!target) {
            target = {
                el: el,
                id: ++this.TargetIndex,
                childrenCount: 1,
                listened: true
            };
            this.mode === modeType.event && this._initListen(target.el, true);
            this.TargetQueue.push(target);
        } else {
            target.childrenCount++;
        }
        return this.TargetIndex;
    }
    /*
     * remove listener target or reduce target childrenCount
     * @param  {DOM} el or window
     * @return
     */
    _removeListenerTarget(el) {
        this.TargetQueue.forEach((target, index) => {
            if (target.el === el) {
                target.childrenCount--;
                if (!target.childrenCount) {
                    this._initListen(target.el, false);
                    this.TargetQueue.splice(index, 1);
                    target = null;
                }
            }
        });
    }
    /*
     * add or remove eventlistener
     * @param  {DOM} el DOM or Window
     * @param  {boolean} start flag
     * @return
     */
    _initListen(el, start) {
        this.options.listenEvents.forEach(evt => _[start ? 'on' : 'off'](el, evt, this.lazyLoadHandler));
    }
    _initEvent() {
        this.Event = {
            listeners: {
                loading: [],
                loaded: [],
                error: []
            }
        };
        this.$on = (event, func) => {
            if (!this.Event.listeners[event]) this.Event.listeners[event] = [];
            this.Event.listeners[event].push(func);
        };
        this.$once = (event, func) => {
            const vm = this;
            function on() {
                vm.$off(event, on);
                func.apply(vm, arguments);
            }
            this.$on(event, on);
        };
        this.$off = (event, func) => {
            if (!func) {
                if (!this.Event.listeners[event]) return;
                this.Event.listeners[event].length = 0;
                return;
            }
            remove(this.Event.listeners[event], func);
        };
        this.$emit = (event, context, inCache) => {
            if (!this.Event.listeners[event]) return;
            this.Event.listeners[event].forEach(func => func(context, inCache));
        };
    }
    /**
     * find nodes which in viewport and trigger load
     * @return
     */
    _lazyLoadHandler() {
        const freeList = [];
        this.ListenerQueue.forEach((listener, index) => {
            if (!listener.el || !listener.el.parentNode || listener.state.loaded) {
                freeList.push(listener);
            }
            const catIn = listener.checkInView();
            if (!catIn) return;
            if (!listener.state.loaded) listener.load();
        });
        freeList.forEach(item => {
            remove(this.ListenerQueue, item);
            item.$destroy && item.$destroy();
        });
    }
    /**
    * init IntersectionObserver
    * set mode to observer
    * @return
    */
    _initIntersectionObserver() {
        if (!hasIntersectionObserver) return;
        this._observer = new IntersectionObserver(this._observerHandler.bind(this), this.options.observerOptions);
        if (this.ListenerQueue.length) {
            this.ListenerQueue.forEach(listener => {
                this._observer.observe(listener.el);
            });
        }
    }
    /**
    * init IntersectionObserver
    * @param {Array<IntersectionObserverEntry>} entries
    * @return
    */
    _observerHandler(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                this.ListenerQueue.forEach(listener => {
                    if (listener.el === entry.target) {
                        if (listener.state.loaded) return this._observer.unobserve(listener.el);
                        listener.load();
                    }
                });
            }
        });
    }
    /**
    * set element attribute with image'url and state
    * @param  {ReactiveListener} lazyload listener object
    * @param  {TeventType} state will be rendered
    * @param  {bool} inCache  is rendered from cache
    * @return
    */
    _elRenderer(listener, state, cache) {
        if (!listener.el) return;
        const { el, bindType } = listener;
        let src;
        switch (state) {
            case 'loading':
                src = listener.loading;
                break;
            case 'error':
                src = listener.error;
                break;
            default:
                src = listener.src;
                break;
        }
        if (bindType) {
            // @ts-ignore
            el.style[bindType] = 'url("' + src + '")';
        } else if (el.getAttribute('src') !== src) {
            el.setAttribute('src', src);
        }
        el.setAttribute('lazy', state);
        this.$emit(state, listener, cache);
        this.options.adapter[state] && this.options.adapter[state](listener, this.options);
        if (this.options.dispatchEvent) {
            const event = new CustomEvent(state, {
                detail: listener
            });
            el.dispatchEvent(event);
        }
    }
    _valueFormatter(value) {
        if (isObject(value)) {
            if (!value.src && !this.options.silent) console.error('Vue Lazyload warning: miss src with ' + value);
            return {
                src: value.src,
                loading: value.loading || this.options.loading,
                error: value.error || this.options.error,
                cors: this.options.cors
            };
        }
        return {
            src: value,
            loading: this.options.loading,
            error: this.options.error,
            cors: this.options.cors
        };
    }
}

const useCheckInView = (el, preLoad) => {
    let rect = reactive({});
    const getRect = () => {
        rect = el.value.getBoundingClientRect();
    };
    const checkInView = () => {
        getRect();
        return inBrowser && rect.top < window.innerHeight * preLoad && rect.bottom > 0 && rect.left < window.innerWidth * preLoad && rect.right > 0;
    };
    return {
        rect,
        checkInView
    };
};

var LazyComponent = (lazy => {
    return defineComponent({
        props: {
            tag: {
                type: String,
                default: 'div'
            }
        },
        emits: ['show'],
        setup(props, { emit, slots }) {
            const el = ref();
            const state = reactive({
                loaded: false,
                error: false,
                attempt: 0
            });
            const show = ref(false);
            const { rect, checkInView } = useCheckInView(el, lazy.options.preLoad);
            const load = () => {
                show.value = true;
                state.loaded = true;
                emit('show', show.value);
            };
            const vm = computed(() => {
                return {
                    el: el.value,
                    rect,
                    checkInView,
                    load,
                    state
                };
            });
            onMounted(() => {
                lazy.addLazyBox(vm.value);
                lazy.lazyLoadHandler();
            });
            onUnmounted(() => {
                lazy.removeComponent(vm.value);
            });
            return () => {
                var _a;
                return createVNode(props.tag, {
                    ref: el
                }, [show.value && ((_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots))]);
            };
        }
    });
});

class LazyContainerMananger {
    constructor(lazy) {
        this.lazy = lazy;
        lazy.lazyContainerMananger = this;
        this._queue = [];
    }
    bind(el, binding, vnode) {
        const container = new LazyContainer(el, binding, vnode, this.lazy);
        this._queue.push(container);
    }
    update(el, binding, vnode) {
        const container = this._queue.find(item => item.el === el);
        if (!container) return;
        container.update(el, binding);
    }
    unbind(el, binding, vnode) {
        const container = this._queue.find(item => item.el === el);
        if (!container) return;
        container.clear();
        remove(this._queue, container);
    }
}
const defaultOptions = {
    selector: 'img',
    error: '',
    loading: ''
};
class LazyContainer {
    constructor(el, binding, vnode, lazy) {
        this.el = el;
        this.vnode = vnode;
        this.binding = binding;
        this.options = {};
        this.lazy = lazy;
        this._queue = [];
        this.update(el, binding);
    }
    update(el, binding) {
        this.el = el;
        this.options = assignDeep({}, defaultOptions, binding.value);
        const imgs = this.getImgs();
        imgs.forEach(el => {
            this.lazy.add(el, assignDeep({}, this.binding, {
                value: {
                    src: el.getAttribute('data-src') || el.dataset.src,
                    error: el.getAttribute('data-error') || el.dataset.error || this.options.error,
                    loading: el.getAttribute('data-loading') || el.dataset.loading || this.options.loading
                }
            }), this.vnode);
        });
    }
    getImgs() {
        return Array.from(this.el.querySelectorAll(this.options.selector));
    }
    clear() {
        const imgs = this.getImgs();
        imgs.forEach(el => this.lazy.remove(el));
        this.vnode = null;
        this.binding = null;
        this.lazy = null;
    }
}

var LazyImage = (lazy => {
    return defineComponent({
        setup(props, { slots }) {
            const el = ref();
            const options = reactive({
                src: '',
                error: '',
                loading: '',
                attempt: lazy.options.attempt
            });
            const state = reactive({
                loaded: false,
                error: false,
                attempt: 0
            });
            const { rect, checkInView } = useCheckInView(el, lazy.options.preLoad);
            const renderSrc = ref('');
            const load = (onFinish = noop) => {
                if (state.attempt > options.attempt - 1 && state.error) {
                    if (!lazy.options.silent) console.log(`VueLazyload log: ${options.src} tried too more than ${options.attempt} times`);
                    return onFinish();
                }
                const src = options.src;
                loadImageAsync({ src }, ({ src }) => {
                    renderSrc.value = src;
                    state.loaded = true;
                }, () => {
                    state.attempt++;
                    renderSrc.value = options.error;
                    state.error = true;
                });
            };
            const vm = computed(() => {
                return {
                    el: el.value,
                    rect,
                    checkInView,
                    load,
                    state
                };
            });
            onMounted(() => {
                lazy.addLazyBox(vm.value);
                lazy.lazyLoadHandler();
            });
            onUnmounted(() => {
                lazy.removeComponent(vm.value);
            });
            const init = () => {
                const { src, loading, error } = lazy._valueFormatter(props.src);
                state.loaded = false;
                options.src = src;
                options.error = error;
                options.loading = loading;
                renderSrc.value = options.loading;
            };
            watch(() => props.src, () => {
                init();
                lazy.addLazyBox(vm.value);
                lazy.lazyLoadHandler();
            }, {
                immediate: true
            });
            return () => {
                var _a;
                return createVNode(props.tag || 'img', {
                    src: renderSrc.value,
                    ref: el
                }, [(_a = slots.default) === null || _a === void 0 ? void 0 : _a.call(slots)]);
            };
        }
    });
});

var index = {
    /*
    * install function
    * @param  {Vue} Vue
    * @param  {object} options lazyload options
    */
    install(Vue, options = {}) {
        const lazy = new Lazy(options);
        const lazyContainer = new LazyContainerMananger(lazy);
        const vueVersion = Number(Vue.version.split('.')[0]);
        if (vueVersion < 3) return new Error('Vue version at least 3.0');
        Vue.config.globalProperties.$Lazyload = lazy;
        Vue.provide('Lazyload', lazy);
        if (options.lazyComponent) {
            Vue.component('lazy-component', LazyComponent(lazy));
        }
        if (options.lazyImage) {
            Vue.component('lazy-image', LazyImage(lazy));
        }
        Vue.directive('lazy', {
            beforeMount: lazy.add.bind(lazy),
            beforeUpdate: lazy.update.bind(lazy),
            updated: lazy.lazyLoadHandler.bind(lazy),
            unmounted: lazy.remove.bind(lazy)
        });
        Vue.directive('lazy-container', {
            beforeMount: lazyContainer.bind.bind(lazyContainer),
            updated: lazyContainer.update.bind(lazyContainer),
            unmounted: lazyContainer.unbind.bind(lazyContainer)
        });
    }
};

export { index as default };
