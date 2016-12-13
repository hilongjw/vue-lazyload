/*!
 * Vue-Lazyload.js v1.0.0-rc1
 * (c) 2016 Awe <hilongjw@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.install = factory());
}(this, (function () { 'use strict';

var inBrowser = typeof window !== 'undefined';

if (!Array.prototype.$remove) {
    Array.prototype.$remove = function (item) {
        if (!this.length) return;
        var index = this.indexOf(item);
        if (index > -1) {
            return this.splice(index, 1);
        }
    };
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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var imageCache = {};

var ReactiveListener = function () {
    function ReactiveListener(_ref) {
        var el = _ref.el;
        var src = _ref.src;
        var error = _ref.error;
        var loading = _ref.loading;
        var bindType = _ref.bindType;
        var $parent = _ref.$parent;
        var Init = _ref.Init;
        var elRenderer = _ref.elRenderer;

        _classCallCheck(this, ReactiveListener);

        this.el = el;
        this.src = src;
        this.error = error;
        this.loading = loading;
        this.bindType = bindType;
        this.attempt = 0;

        this.naturalHeight = 0;
        this.naturalWidth = 0;

        this.Init = Init;

        this.initState();

        this.rect = el.getBoundingClientRect();

        this.$parent = $parent;
        this.elRenderer = elRenderer;
    }

    _createClass(ReactiveListener, [{
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
            return this.rect.top < window.innerHeight * this.Init.preLoad && this.rect.bottom > 0 && this.rect.left < window.innerWidth * this.Init.preLoad && this.rect.right > 0;
        }
    }, {
        key: 'load',
        value: function load() {
            var _this = this;

            if (this.attempt > this.Init.attempt - 1) return this.render('error');
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
                _this.render('loaded', true);
                imageCache[_this.src] = 1;
            }, function (err) {
                _this.state.error = true;
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

var index = (function (Vue) {
    var Options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var isVueNext = Vue.version.split('.')[0] === '2';
    var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    var ListenerQueue = [];

    var Init = {
        preLoad: Options.preLoad || 1.3,
        error: Options.error || DEFAULT_URL,
        loading: Options.loading || DEFAULT_URL,
        attempt: Options.attempt || 3,
        scale: getDPR(Options.scale),
        ListenEvents: Options.listenEvents || ['scroll', 'wheel', 'mousewheel', 'resize', 'animationend', 'transitionend'],
        hasbind: false,
        supportWebp: supportWebp(),
        filter: Options.filter || {},
        adapter: Options.adapter || {}
    };

    var $Lazyload = {
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
            this.listeners[event].$remove(func);
        },
        $emit: function $emit(event, context) {
            this.listeners[event].forEach(function (func) {
                func(context);
            });
        }
    };

    var lazyLoadHandler = throttle(function () {
        for (var i = 0, len = ListenerQueue.length; i < len; ++i) {
            checkCanShow(ListenerQueue[i]);
        }
    }, 300);

    var checkCanShow = function checkCanShow(listener) {
        if (listener.state.loaded) return;
        if (listener.checkInView()) {
            listener.load();
        }
    };

    var onListen = function onListen(el, start) {
        if (start) {
            Init.ListenEvents.forEach(function (evt) {
                _.on(el, evt, lazyLoadHandler);
            });
        } else {
            Init.hasbind = false;
            Init.ListenEvents.forEach(function (evt) {
                _.off(el, evt, lazyLoadHandler);
            });
        }
    };

    var componentWillUnmount = function componentWillUnmount(el, binding, vnode, OldVnode) {
        if (!el) return;

        for (var i = 0, len = ListenerQueue.length; i < len; i++) {
            if (ListenerQueue[i] && ListenerQueue[i].el === el) {
                ListenerQueue[i].destroy();
                ListenerQueue.splice(i, 1);
            }
        }

        if (Init.hasbind && ListenerQueue.length == 0) {
            onListen(window, false);
        }
    };

    var checkElExist = function checkElExist(el) {
        var hasIt = false;

        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            for (var _iterator = ListenerQueue[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var item = _step.value;

                if (item.el === el) {
                    hasIt = true;
                    break;
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }

        return hasIt;
    };

    var elRenderer = function elRenderer(data, state, notify) {
        var el = data.el;
        var bindType = data.bindType;
        var src = data.src;


        if (!bindType) {
            if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src);
            }
        } else {
            el.style[bindType] = 'url(' + src + ')';
        }

        el.setAttribute('lazy', state);

        if (notify) {
            $Lazyload.$emit(state, data);
            if (Init.adapter[state]) {
                Init.adapter[state](data, Init);
            }
        }
    };

    function listenerFilter(listener) {
        if (Init.filter.webp && Init.supportWebp) {
            listener.src = Init.filter.webp(listener, Init);
        }
        if (Init.filter.customer) {
            listener.src = Init.filter.customer(listener, Init);
        }
        return listener;
    }

    function valueFormater(value) {
        var src = value;
        var loading = Init.loading;
        var error = Init.error;

        if (value && typeof value !== 'string') {
            if (!value.src) console.error('miss src with ', value);
            src = value.src;
            loading = value.loading || Init.loading;
            error = value.error || Init.error;
        }

        return {
            src: src,
            loading: loading,
            error: error
        };
    }

    var addListener = function addListener(el, binding, vnode) {
        if (checkElExist(el)) {
            updateListener(el, binding);
            return Vue.nextTick(function () {
                lazyLoadHandler();
            });
        }

        var $parent = null;

        var _valueFormater = valueFormater(binding.value);

        var src = _valueFormater.src;
        var loading = _valueFormater.loading;
        var error = _valueFormater.error;


        Vue.nextTick(function () {
            var parentId = void 0;
            if (binding.modifiers) {
                parentId = Object.keys(binding.modifiers)[0];
                $parent = window.document.getElementById(parentId);
            }

            var listener = new ReactiveListener({
                bindType: binding.arg,
                $parent: $parent,
                el: el,
                loading: loading,
                error: error,
                src: src,
                Init: Init,
                elRenderer: elRenderer
            });

            listener = listenerFilter(listener);

            ListenerQueue.push(listener);

            lazyLoadHandler();

            if (ListenerQueue.length > 0 && !Init.hasbind) {
                Init.hasbind = true;
                onListen(window, true);

                if ($parent) {
                    onListen($parent, true);
                }
            }
        });
    };

    var updateListener = function updateListener(el, binding) {
        var _valueFormater2 = valueFormater(binding.value);

        var src = _valueFormater2.src;
        var loading = _valueFormater2.loading;
        var error = _valueFormater2.error;


        for (var i = 0, len = ListenerQueue.length; i < len; i++) {
            if (ListenerQueue[i] && ListenerQueue[i].el === el) {
                if (ListenerQueue[i].src !== src) {
                    ListenerQueue[i].update({
                        src: src,
                        loading: loading,
                        error: error
                    });
                    console.log('changed');
                }
                break;
            }
        }
    };

    Vue.prototype.$Lazyload = $Lazyload;

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: updateListener,
            inserted: addListener,
            componentUpdated: lazyLoadHandler,
            unbind: componentWillUnmount
        });
    } else {
        Vue.directive('lazy', {
            bind: lazyLoadHandler,
            update: function update(newValue, oldValue) {
                addListener(this.el, {
                    modifiers: this.modifiers,
                    arg: this.arg,
                    value: newValue,
                    oldValue: oldValue
                });
            },
            unbind: function unbind() {
                componentWillUnmount(this.el);
            }
        });
    }
});

return index;

})));