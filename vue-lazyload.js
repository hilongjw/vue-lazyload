/*!
 * Vue-Lazyload.js v1.0.0-rc5
 * (c) 2016 Awe <hilongjw@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('vue')) :
    typeof define === 'function' && define.amd ? define(['vue'], factory) :
    (global.install = factory(global.Vue));
}(this, (function (Vue) { 'use strict';

Vue = 'default' in Vue ? Vue['default'] : Vue;

var inBrowser = typeof window !== 'undefined';

function remove$1(arr, item) {
    if (!arr.length) return;
    var index = arr.indexOf(item);
    if (index > -1) return arr.splice(index, 1);
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

function getDPR() {
    var scale = arguments.length <= 0 || arguments[0] === undefined ? 1 : arguments[0];

    if (!inBrowser) return scale;
    if (window.devicePixelRatio) {
        return window.devicePixelRatio;
    }
    return scale;
}

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
        var el = _ref.el;
        var src = _ref.src;
        var error = _ref.error;
        var loading = _ref.loading;
        var bindType = _ref.bindType;
        var $parent = _ref.$parent;
        var options = _ref.options;
        var elRenderer = _ref.elRenderer;

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
            var src = _ref2.src;
            var loading = _ref2.loading;
            var error = _ref2.error;

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
                if (!this.options.slient) console.log('error end');
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

var isVueNext = Vue.version.split('.')[0] === '2';
var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
var DEFAULT_EVENTS = ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend'];

var Lazy = function () {
    function Lazy(_ref) {
        var _this = this;

        var preLoad = _ref.preLoad;
        var error = _ref.error;
        var loading = _ref.loading;
        var attempt = _ref.attempt;
        var silent = _ref.silent;
        var scale = _ref.scale;
        var listenEvents = _ref.listenEvents;
        var hasbind = _ref.hasbind;
        var filter = _ref.filter;
        var adapter = _ref.adapter;

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
        }, 300);
    }

    _createClass(Lazy, [{
        key: 'add',
        value: function add(el, binding, vnode) {
            var _this2 = this;

            if (some(this.ListenerQueue, function (item) {
                return item.el === el;
            })) {
                updateListener(el, binding);
                return Vue.nextTick(this.lazyLoadHandler);
            }

            var _valueFormater = this.valueFormater(binding.value);

            var src = _valueFormater.src;
            var loading = _valueFormater.loading;
            var error = _valueFormater.error;


            Vue.nextTick(function () {
                var $parent = vnode.context.$refs[Object.keys(binding.modifiers)[0]];
                $parent = $parent && $parent.$el || $parent;

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
                Vue.nextTick(function () {
                    _this2.lazyLoadHandler();
                });
            });
        }
    }, {
        key: 'update',
        value: function update(el, binding) {
            var _valueFormater2 = this.valueFormater(binding.value);

            var src = _valueFormater2.src;
            var loading = _valueFormater2.loading;
            var error = _valueFormater2.error;


            var exist = find(this.ListenerQueue, function (item) {
                return item.el === el;
            });

            exist && exist.src !== src && exist.update({
                src: src,
                loading: loading,
                error: error
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
            var _this3 = this;

            this.options.hasbind = start;
            this.options.ListenEvents.forEach(function (evt) {
                _[start ? 'on' : 'off'](el, evt, _this3.lazyLoadHandler);
            });
        }
    }, {
        key: 'initEvent',
        value: function initEvent() {
            this.Event = {
                listeners: {
                    loading: [],
                    loaded: [],
                    error: []
                },
                $on: function $on(event, func) {
                    this.listeners[event].push(func);
                },
                $once: function $once(event, func) {
                    var vm = this;
                    function on() {
                        vm.$off(event, on);
                        func.apply(vm, arguments);
                    }
                    this.$on(event, on);
                },
                $off: function $off(event, func) {
                    if (!func) {
                        this.listeners[event] = [];
                        return;
                    }
                    remove$1(this.listeners[event], func);
                },
                $emit: function $emit(event, context) {
                    this.listeners[event].forEach(function (func) {
                        func(context);
                    });
                }
            };
        }
    }, {
        key: 'elRenderer',
        value: function elRenderer(data, state, notify) {
            var el = data.el;
            var bindType = data.bindType;
            var src = data.src;


            if (bindType) {
                el.style[bindType] = 'url(' + src + ')';
            } else if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src);
            }

            el.setAttribute('lazy', state);

            if (!notify) return;
            this.Event.$emit(state, data);
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
        key: 'valueFormater',
        value: function valueFormater(value) {
            var src = value;
            var loading = this.options.loading;
            var error = this.options.error;

            if (Vue.util.isObject(value)) {
                if (!value.src && !this.options.slient) Vue.util.warn('Vue Lazyload warning: miss src with ' + value);
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

var index = (function (Vue$$1) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var lazy = new Lazy(options);
    var isVueNext = Vue$$1.version.split('.')[0] === '2';

    Vue$$1.prototype.$Lazyload = lazy;

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
                Object.assign(this.$refs, this.$els);
                lazy.add(this.el, {
                    modifiers: this.modifiers || {},
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                }, {
                    context: this
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