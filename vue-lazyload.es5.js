/*!
 * Vue-Lazyload.js v0.8.3
 * (c) 2016 Awe <hilongjw@gmail.com>
 * Released under the MIT License.
 */
(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global.install = factory());
}(this, (function () { 'use strict';

var Promise = require('es6-promise').Promise;
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
    var DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';

    var Init = {
        preLoad: Options.preLoad || 1.3,
        error: Options.error || DEFAULT_URL,
        loading: Options.loading || DEFAULT_URL,
        attempt: Options.attempt || 3,
        scale: Options.scale || inBrowser ? window.devicePixelRatio : 1,
        hasbind: false
    };

    var Listeners = [];
    var imageCache = [];

    var throttle = function throttle(action, delay) {
        var timeout = null;
        var lastRun = 0;
        return function () {
            if (timeout) {
                return;
            }
            var elapsed = +new Date() - lastRun;
            var context = this;
            var args = arguments;
            var runCallback = function runCallback() {
                lastRun = +new Date();
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
            _.on(el, 'scroll', lazyLoadHandler);
            _.on(el, 'wheel', lazyLoadHandler);
            _.on(el, 'mousewheel', lazyLoadHandler);
            _.on(el, 'resize', lazyLoadHandler);
            _.on(el, 'animationend', lazyLoadHandler);
            _.on(el, 'transitionend', lazyLoadHandler);
        } else {
            Init.hasbind = false;
            _.off(el, 'scroll', lazyLoadHandler);
            _.off(el, 'wheel', lazyLoadHandler);
            _.off(el, 'mousewheel', lazyLoadHandler);
            _.off(el, 'resize', lazyLoadHandler);
            _.off(el, 'animationend', lazyLoadHandler);
            _.off(el, 'transitionend', lazyLoadHandler);
        }
    };

    var checkCanShow = function checkCanShow(listener) {
        if (imageCache.indexOf(listener.src) > -1) return setElRender(listener.el, listener.bindType, listener.src, 'loaded');
        var rect = listener.el.getBoundingClientRect();

        if (rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0 && rect.left < window.innerWidth * Init.preLoad && rect.right > 0) {
            render(listener);
        }
    };

    var setElRender = function setElRender(el, bindType, src, state) {
        if (!bindType) {
            el.setAttribute('src', src);
        } else {
            el.setAttribute('style', bindType + ': url(' + src + ')');
        }
        el.setAttribute('lazy', state);
    };

    var render = function render(item) {
        if (item.attempt >= Init.attempt) return false;

        item.attempt++;

        loadImageAsync(item).then(function (image) {
            setElRender(item.el, item.bindType, item.src, 'loaded');
            imageCache.push(item.src);
            Listeners.$remove(item);
        }).catch(function (error) {
            setElRender(item.el, item.bindType, item.error, 'error');
        });
    };

    var loadImageAsync = function loadImageAsync(item) {
        return new Promise(function (resolve, reject) {
            var image = new Image();
            image.src = item.src;

            image.onload = function () {
                resolve({
                    naturalHeight: image.naturalHeight,
                    naturalWidth: image.naturalWidth,
                    src: item.src
                });
            };

            image.onerror = function () {
                reject();
            };
        });
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

    var addListener = function addListener(el, binding, vnode) {
        if (el.getAttribute('lazy') === 'loaded') return;
        if (checkElExist(el)) return;

        var parentEl = null;
        var imageSrc = binding.value;
        var imageLoading = Init.loading;
        var imageError = Init.error;

        if (typeof binding.value !== 'string' && binding.value) {
            imageSrc = binding.value.src;
            imageLoading = binding.value.loading || Init.loading;
            imageError = binding.value.error || Init.error;
        }
        if (binding.modifiers) {
            parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0]);
        }

        setElRender(el, binding.arg, imageLoading, 'loading');

        Vue.nextTick(function () {
            Listeners.push({
                bindType: binding.arg,
                attempt: 0,
                parentEl: parentEl,
                el: el,
                error: imageError,
                src: imageSrc
            });
            lazyLoadHandler();
            if (Listeners.length > 0 && !Init.hasbind) {
                Init.hasbind = true;
                onListen(window, true);
            }
            if (parentEl) {
                onListen(parentEl, true);
            }
        });
    };

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