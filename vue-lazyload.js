/*!
 * Vue-Lazyload.js v1.0.0-rc8
 * (c) 2017 Awe <hilongjw@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
    typeof define === 'function' && define.amd ? define(['vue'], factory) :
    (global.VueLazyload = factory(global.Vue));
}(this, (function (Vue) { 'use strict';

Vue = 'default' in Vue ? Vue['default'] : Vue;

var inBrowser = typeof window !== 'undefined';

function remove$1(arr, item) {
    if (!arr.length) return;
    var index = arr.indexOf(item);
    if (index > -1) return arr.splice(index, 1);
}

function assign(target, source) {
    if (!target || !source) return target || {};
    if (target instanceof Object) {
        for (var key in source) {
            target[key] = source[key];
        }
    }
    return target;
}

function some(arr, fn) {
    var has = false;
    for (var i = 0, len = arr.length; i < len; i++) {
        if (fn(arr[i])) {
            has = true;
            break;
        }
    }
    return has;
}

function getBestSelectionFromSrcset(el, scale) {
    if (el.tagName !== 'IMG' || !el.getAttribute('srcset')) return;
    var options = el.getAttribute('srcset');
    var result = [];
    var container = el.parentNode;
    var containerWidth = container.offsetWidth * scale;

    var spaceIndex = void 0;
    var tmpSrc = void 0;
    var tmpWidth = void 0;

    options = options.trim().split(',');

    options.map(function (item) {
        item = item.trim();
        spaceIndex = item.lastIndexOf(' ');
        if (spaceIndex === -1) {
            tmpSrc = item;
            tmpWidth = 999998;
        } else {
            tmpSrc = item.substr(0, spaceIndex);
            tmpWidth = parseInt(item.substr(spaceIndex + 1, item.length - spaceIndex - 2), 10);
        }
        result.push([tmpWidth, tmpSrc]);
    });

    result.sort(function (a, b) {
        if (a[0] < b[0]) {
            return -1;
        }
        if (a[0] > b[0]) {
            return 1;
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
    var bestSelectedSrc = '';
    var tmpOption = void 0;
    var resultCount = result.length;

    for (var i = 0; i < resultCount; i++) {
        tmpOption = result[i];
        if (tmpOption[0] >= containerWidth) {
            bestSelectedSrc = tmpOption[1];
            break;
        }
    }

    return bestSelectedSrc;
}

function find(arr, fn) {
    var item = void 0;
    for (var i = 0, len = arr.length; i < len; i++) {
        if (fn(arr[i])) {
            item = arr[i];
            break;
        }
    }
    return item;
}

var getDPR = function getDPR() {
    var scale = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
    return inBrowser && window.devicePixelRatio || scale;
};

function supportWebp() {
    var support = true;
    var d = document;

    try {
        var el = d.createElement('object');
        el.type = 'image/webp';
        el.innerHTML = '!';
        d.body.appendChild(el);
        support = !el.offsetWidth;
        d.body.removeChild(el);
    } catch (err) {
        support = false;
    }

    return support;
}

function throttle(action, delay) {
    var timeout = null;
    var lastRun = 0;
    return function () {
        if (timeout) {
            return;
        }
        var elapsed = Date.now() - lastRun;
        var context = this;
        var args = arguments;
        var runCallback = function runCallback() {
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

var _ = {
    on: function on(el, type, func) {
        el.addEventListener(type, func);
    },
    off: function off(el, type, func) {
        el.removeEventListener(type, func);
    }
};

var loadImageAsync = function loadImageAsync(item, resolve, reject) {
    var image = new Image();
    image.src = item.src;

    image.onload = function () {
        resolve({
            naturalHeight: image.naturalHeight,
            naturalWidth: image.naturalWidth,
            src: item.src
        });
    };

    image.onerror = function (e) {
        reject(e);
    };
};

var _createClass$1 = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var imageCache = {};

var ReactiveListener = function () {
    function ReactiveListener(_ref) {
        var el = _ref.el,
            src = _ref.src,
            error = _ref.error,
            loading = _ref.loading,
            bindType = _ref.bindType,
            $parent = _ref.$parent,
            options = _ref.options,
            elRenderer = _ref.elRenderer;

        _classCallCheck$1(this, ReactiveListener);

        this.el = el;
        this.src = src;
        this.error = error;
        this.loading = loading;
        this.bindType = bindType;
        this.attempt = 0;

        this.naturalHeight = 0;
        this.naturalWidth = 0;

        this.options = options;

        this.initState();

        this.rect = el.getBoundingClientRect();

        this.$parent = $parent;
        this.elRenderer = elRenderer;
    }

    _createClass$1(ReactiveListener, [{
        key: 'initState',
        value: function initState() {
            this.state = {
                error: false,
                loaded: false,
                rendered: false
            };
        }
    }, {
        key: 'update',
        value: function update(_ref2) {
            var src = _ref2.src,
                loading = _ref2.loading,
                error = _ref2.error;

            this.src = src;
            this.loading = loading;
            this.error = error;
            this.attempt = 0;
            this.initState();
        }
    }, {
        key: 'getRect',
        value: function getRect() {
            this.rect = this.el.getBoundingClientRect();
        }
    }, {
        key: 'checkInView',
        value: function checkInView() {
            this.getRect();
            return this.rect.top < window.innerHeight * this.options.preLoad && this.rect.bottom > 0 && this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0;
        }
    }, {
        key: 'load',
        value: function load() {
            var _this = this;

            if (this.attempt > this.options.attempt - 1 && this.state.error) {
                if (!this.options.silent) console.log('error end');
                return;
            }

            if (this.state.loaded || imageCache[this.src]) {
                return this.render('loaded');
            }

            this.render('loading', true);

            this.attempt++;

            loadImageAsync({
                src: this.src
            }, function (data) {
                _this.naturalHeight = data.naturalHeight;
                _this.naturalWidth = data.naturalWidth;
                _this.state.loaded = true;
                _this.state.error = false;
                _this.render('loaded', true);
                imageCache[_this.src] = 1;
            }, function (err) {
                _this.state.error = true;
                _this.state.loaded = false;
                _this.render('error', true);
            });
        }
    }, {
        key: 'render',
        value: function render(state, notify) {
            var src = void 0;
            switch (state) {
                case 'loading':
                    src = this.loading;
                    break;
                case 'error':
                    src = this.error;
                    break;
                default:
                    src = this.src;
                    break;
            }

            this.elRenderer({
                el: this.el,
                bindType: this.bindType,
                src: src
            }, state, notify);
        }
    }, {
        key: 'destroy',
        value: function destroy() {
            this.el = null;
            this.src = null;
            this.error = null;
            this.loading = null;
            this.bindType = null;
            this.attempt = 0;
        }
    }]);

    return ReactiveListener;
}();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
var DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend', 'touchmove'];

var Lazy = function () {
    function Lazy(_ref) {
        var _this = this;

        var preLoad = _ref.preLoad,
            error = _ref.error,
            loading = _ref.loading,
            attempt = _ref.attempt,
            silent = _ref.silent,
            scale = _ref.scale,
            listenEvents = _ref.listenEvents,
            hasbind = _ref.hasbind,
            filter = _ref.filter,
            adapter = _ref.adapter;

        _classCallCheck(this, Lazy);

        this.ListenerQueue = [];
        this.options = {
            silent: silent || true,
            preLoad: preLoad || 1.3,
            error: error || DEFAULT_URL,
            loading: loading || DEFAULT_URL,
            attempt: attempt || 3,
            scale: getDPR(scale),
            ListenEvents: listenEvents || DEFAULT_EVENTS,
            hasbind: false,
            supportWebp: supportWebp(),
            filter: filter || {},
            adapter: adapter || {}
        };
        this.initEvent();

        this.lazyLoadHandler = throttle(function () {
            var catIn = false;
            _this.ListenerQueue.forEach(function (listener) {
                if (listener.state.loaded) return;
                catIn = listener.checkInView();
                catIn && listener.load();
            });
        }, 200);
    }

    _createClass(Lazy, [{
        key: 'addLazyBox',
        value: function addLazyBox(vm) {
            this.ListenerQueue.push(vm);
            this.options.hasbind = true;
            this.initListen(window, true);
        }
    }, {
        key: 'add',
        value: function add(el, binding, vnode) {
            var _this2 = this;

            if (some(this.ListenerQueue, function (item) {
                return item.el === el;
            })) {
                this.update(el, binding);
                return Vue.nextTick(this.lazyLoadHandler);
            }

            var _valueFormatter = this.valueFormatter(binding.value),
                src = _valueFormatter.src,
                loading = _valueFormatter.loading,
                error = _valueFormatter.error;

            Vue.nextTick(function () {
                var tmp = getBestSelectionFromSrcset(el, _this2.options.scale);

                if (tmp) {
                    src = tmp;
                }

                var container = Object.keys(binding.modifiers)[0];
                var $parent = void 0;

                if (container) {
                    $parent = vnode.context.$refs[container];
                    // if there is container passed in, try ref first, then fallback to getElementById to support the original usage
                    $parent = $parent ? $parent.$el || $parent : document.getElementById(container);
                }

                _this2.ListenerQueue.push(_this2.listenerFilter(new ReactiveListener({
                    bindType: binding.arg,
                    $parent: $parent,
                    el: el,
                    loading: loading,
                    error: error,
                    src: src,
                    elRenderer: _this2.elRenderer.bind(_this2),
                    options: _this2.options
                })));

                if (!_this2.ListenerQueue.length || _this2.options.hasbind) return;

                _this2.options.hasbind = true;
                _this2.initListen(window, true);
                $parent && _this2.initListen($parent, true);
                _this2.lazyLoadHandler();
                Vue.nextTick(function () {
                    return _this2.lazyLoadHandler();
                });
            });
        }
    }, {
        key: 'update',
        value: function update(el, binding) {
            var _this3 = this;

            var _valueFormatter2 = this.valueFormatter(binding.value),
                src = _valueFormatter2.src,
                loading = _valueFormatter2.loading,
                error = _valueFormatter2.error;

            var exist = find(this.ListenerQueue, function (item) {
                return item.el === el;
            });

            exist && exist.src !== src && exist.update({
                src: src,
                loading: loading,
                error: error
            });
            this.lazyLoadHandler();
            Vue.nextTick(function () {
                return _this3.lazyLoadHandler();
            });
        }
    }, {
        key: 'remove',
        value: function remove(el) {
            if (!el) return;
            var existItem = find(this.ListenerQueue, function (item) {
                return item.el === el;
            });
            existItem && remove$1(this.ListenerQueue, existItem) && existItem.destroy();
            this.options.hasbind && !this.ListenerQueue.length && this.initListen(window, false);
        }
    }, {
        key: 'initListen',
        value: function initListen(el, start) {
            var _this4 = this;

            this.options.hasbind = start;
            this.options.ListenEvents.forEach(function (evt) {
                return _[start ? 'on' : 'off'](el, evt, _this4.lazyLoadHandler);
            });
        }
    }, {
        key: 'initEvent',
        value: function initEvent() {
            var _this5 = this;

            this.Event = {
                listeners: {
                    loading: [],
                    loaded: [],
                    error: []
                }
            };

            this.$on = function (event, func) {
                _this5.Event.listeners[event].push(func);
            }, this.$once = function (event, func) {
                var vm = _this5;
                function on() {
                    vm.$off(event, on);
                    func.apply(vm, arguments);
                }
                _this5.$on(event, on);
            }, this.$off = function (event, func) {
                if (!func) {
                    _this5.Event.listeners[event] = [];
                    return;
                }
                remove$1(_this5.Event.listeners[event], func);
            }, this.$emit = function (event, context) {
                _this5.Event.listeners[event].forEach(function (func) {
                    return func(context);
                });
            };
        }
    }, {
        key: 'elRenderer',
        value: function elRenderer(data, state, notify) {
            var el = data.el,
                bindType = data.bindType,
                src = data.src;

            // don't remove it please

            if (!el) return;

            if (bindType) {
                el.style[bindType] = 'url(' + src + ')';
            } else if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src);
            }

            el.setAttribute('lazy', state);

            if (!notify) return;
            this.$emit(state, data);
            this.options.adapter[state] && this.options.adapter[state](data, this.options);
        }
    }, {
        key: 'listenerFilter',
        value: function listenerFilter(listener) {
            if (this.options.filter.webp && this.options.supportWebp) {
                listener.src = this.options.filter.webp(listener, this.options);
            }
            if (this.options.filter.customer) {
                listener.src = this.options.filter.customer(listener, this.options);
            }
            return listener;
        }
    }, {
        key: 'valueFormatter',
        value: function valueFormatter(value) {
            var src = value;
            var loading = this.options.loading;
            var error = this.options.error;

            if (Vue.util.isObject(value)) {
                if (!value.src && !this.options.silent) Vue.util.warn('Vue Lazyload warning: miss src with ' + value);
                src = value.src;
                loading = value.loading || this.options.loading;
                error = value.error || this.options.error;
            }
            return {
                src: src,
                loading: loading,
                error: error
            };
        }
    }]);

    return Lazy;
}();

var LazyComponent = (function (lazy) {
    return {
        props: {
            tag: {
                type: String,
                default: 'div'
            }
        },
        render: function render(h) {
            if (this.show === false) {
                return h(this.tag, {
                    attrs: {
                        class: 'cov'
                    }
                });
            }
            return h(this.tag, {
                attrs: {
                    class: 'cov'
                }
            }, this.$slots.default);
        },
        data: function data() {
            return {
                state: {
                    loaded: false
                },
                rect: {},
                show: false
            };
        },
        mounted: function mounted() {
            lazy.addLazyBox(this);
            lazy.lazyLoadHandler();
        },

        methods: {
            getRect: function getRect() {
                this.rect = this.$el.getBoundingClientRect();
            },
            checkInView: function checkInView() {
                this.getRect();
                return inBrowser && this.rect.top < window.innerHeight * lazy.options.preLoad && this.rect.bottom > 0 && this.rect.left < window.innerWidth * lazy.options.preLoad && this.rect.right > 0;
            },
            load: function load() {
                if (typeof this.$el.attributes.lazy !== 'undefined' && typeof this.$el.attributes.lazy.value !== 'undefined') {
                    var state = this.$el.attributes.lazy.value;
                    this.state.loaded = state === 'loaded';
                    this.state.error = state === 'error';
                    this.$emit(state, this.$el);
                } else {
                    this.$emit('loading', this.$el);
                    this.$nextTick(lazy.lazyLoadHandler);
                }

                this.show = true;
            }
        }
    };
});

var index = (function (Vue$$1) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var lazy = new Lazy(options);
    var isVueNext = Vue$$1.version.split('.')[0] === '2';

    Vue$$1.prototype.$Lazyload = lazy;
    Vue$$1.component('lazy-component', LazyComponent(lazy));

    if (isVueNext) {
        Vue$$1.directive('lazy', {
            bind: lazy.add.bind(lazy),
            update: lazy.update.bind(lazy),
            componentUpdated: lazy.lazyLoadHandler.bind(lazy),
            unbind: lazy.remove.bind(lazy)
        });
    } else {
        Vue$$1.directive('lazy', {
            bind: lazy.lazyLoadHandler.bind(lazy),
            update: function update(newValue, oldValue) {
                assign(this.vm.$refs, this.vm.$els);
                lazy.add(this.el, {
                    modifiers: this.modifiers || {},
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                }, {
                    context: this.vm
                });
            },
            unbind: function unbind() {
                lazy.remove(this.el);
            }
        });
    }
});

return index;

})));
