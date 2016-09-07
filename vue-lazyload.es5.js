'use strict';

var Promise = require('es6-promise').Promise;

if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        'use strict';

        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}

exports.install = function (Vue, Options) {
    var isVueNext = Vue.version.split('.')[0] === '2';
    var DEFAULT_PRE = 1.3;
    var DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
    if (!Options) {
        Options = {
            preLoad: DEFAULT_PRE,
            error: DEFAULT_URL,
            loading: DEFAULT_URL,
            try: 3
        };
    }
    var Init = {
        preLoad: Options.preLoad || DEFAULT_PRE,
        error: Options.error ? Options.error : DEFAULT_URL,
        loading: Options.loading ? Options.loading : DEFAULT_URL,
        hasbind: false,
        try: Options.try ? Options.try : 1
    };

    var Listeners = [];
    var Loaded = [];

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
        if (Loaded.indexOf(listener.src) > -1) return setElRender(listener.el, listener.bindType, listener.src, 'loaded');
        var rect = listener.el.getBoundingClientRect();

        if (rect.top < window.innerHeight * Init.preLoad && rect.bottom > 0) {
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
        if (item.try >= Init.try) {
            return false;
        }
        item.try++;

        loadImageAsync(item).then(function (url) {
            var index = Listeners.indexOf(item);
            if (index !== -1) {
                Listeners.splice(index, 1);
            }
            setElRender(item.el, item.bindType, item.src, 'loaded');
            Loaded.push(item.src);
        }).catch(function (error) {
            setElRender(item.el, item.bindType, Init.error, 'error');
        });
    };

    var loadImageAsync = function loadImageAsync(item) {
        return new Promise(function (resolve, reject) {
            var image = new Image();
            image.src = item.src;

            image.onload = function () {
                resolve(item.src);
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

    var addListener = function addListener(el, binding, vnode) {
        if (el.getAttribute('lazy') === 'loaded') return;
        var hasIt = Listeners.find(function (item) {
            return item.el === el;
        });
        if (hasIt) {
            return Vue.nextTick(function () {
                setTimeout(function () {
                    lazyLoadHandler();
                }, 0);
            });
        }

        var parentEl = null;

        if (binding.modifiers) {
            parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0]);
        }

        setElRender(el, binding.arg, Init.loading, 'loading');

        Vue.nextTick(function () {
            Listeners.push({
                bindType: binding.arg,
                try: 0,
                parentEl: parentEl,
                el: el,
                src: binding.value
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
            componentUpdated: lazyLoadHandler,
            unbind: componentWillUnmount
        });
    } else {
        Vue.directive('lazy', {
            bind: function bind() {},
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
};
