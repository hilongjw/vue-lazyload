/*!
 * Vue-Lazyload.js v0.9.5
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

var vueLazyload = (function (Vue) {
    var Options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var isVueNext = Vue.version.split('.')[0] === '2';
    var DEFAULT_URL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    var Listeners = [];
    var imageCache = [];

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

    var throttle = function throttle(action, delay) {
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
    };

    var _ = {
        on: function on(el, type, func) {
            el.addEventListener(type, func);
        },
        off: function off(el, type, func) {
            el.removeEventListener(type, func);
        }
    };

    var lazyLoadHandler = throttle(function () {
        for (var i = 0, len = Listeners.length; i < len; ++i) {
            checkCanShow(Listeners[i]);
        }
    }, 300);

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

    var checkCanShow = function checkCanShow(listener) {
        if (imageCache.indexOf(listener.src) !== -1) return setElRender(listener, 'loaded');
        var rect = listener.el.getBoundingClientRect();

        if (rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0 && rect.left < window.innerWidth * Init.preLoad && rect.right > 0) {
            render(listener);
        }
    };

    var setElRender = function setElRender(listener, state, emit) {
        var el = listener.el;
        var bindType = listener.bindType;

        var src = state === 'error' ? listener.error : listener.src;

        if (!bindType) {
            if (el.getAttribute('src') !== src) {
                el.setAttribute('src', src);
            }
        } else {
            el.style[bindType] = 'url(' + src + ')';
        }

        el.setAttribute('lazy', state);

        if (emit) {
            $Lazyload.$emit(state, listener);
            if (Init.adapter[state]) {
                Init.adapter[state](listener, state);
            }
        }
    };

    var render = function render(listener) {
        if (listener.attempt >= Init.attempt) return false;
        listener.attempt++;

        if (imageCache.indexOf(listener.src) !== -1) return setElRender(listener, 'loaded');
        imageCache.push(listener.src);

        loadImageAsync(listener, function (image) {
            listener = Object.assign(listener, image);
            setElRender(listener, 'loaded', true);
            Listeners.$remove(listener);
        }, function (error) {
            imageCache.$remove(listener.src);
            setElRender(listener, 'error', true);
        });
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

    var componentWillUnmount = function componentWillUnmount(el, binding, vnode, OldVnode) {
        if (!el) return;

        for (var i = 0, len = Listeners.length; i < len; i++) {
            if (Listeners[i] && Listeners[i].el === el) {
                Listeners.splice(i, 1);
            }
        }

        if (Init.hasbind && Listeners.length == 0) {
            onListen(window, false);
        }
    };

    var checkElExist = function checkElExist(el) {
        var hasIt = false;

        Listeners.forEach(function (item) {
            if (item.el === el) hasIt = true;
        });

        if (hasIt) {
            return Vue.nextTick(function () {
                lazyLoadHandler();
            });
        }
        return hasIt;
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

    var addListener = function addListener(el, binding, vnode) {
        if (el.getAttribute('lazy') === 'loaded') return;
        if (checkElExist(el)) return;

        var parentEl = null;
        var imageSrc = binding.value;
        var imageLoading = Init.loading;
        var imageError = Init.error;

        if (binding.value && typeof binding.value !== 'string') {
            imageSrc = binding.value.src;
            imageLoading = binding.value.loading || Init.loading;
            imageError = binding.value.error || Init.error;
        }

        if (imageCache.indexOf(imageSrc) > -1) {
            return setElRender({
                el: el,
                bindType: binding.arg,
                src: imageSrc
            }, 'loaded');
        }

        Vue.nextTick(function () {
            var parentId = void 0;
            if (binding.modifiers) {
                parentId = Object.keys(binding.modifiers)[0];
                parentEl = window.document.getElementById(parentId);
            }

            var listener = {
                bindType: binding.arg,
                parentId: parentId,
                attempt: 0,
                parentEl: parentEl,
                el: el,
                error: imageError,
                src: imageSrc
            };

            listener = listenerFilter(listener);

            Listeners.push(listener);

            setElRender({
                el: el,
                bindType: binding.arg,
                src: imageLoading
            }, 'loading', true);

            lazyLoadHandler();

            if (Listeners.length > 0 && !Init.hasbind) {
                Init.hasbind = true;
                onListen(window, true);

                if (parentEl) {
                    onListen(parentEl, true);
                }
            }
        });
    };

    Vue.prototype.$Lazyload = $Lazyload;

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: addListener,
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

return vueLazyload;

})));