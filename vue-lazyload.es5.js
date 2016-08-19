'use strict';

var Promise = require('es6-promise').Promise;

exports.install = function (Vue, Options) {
    var isVueNext = Vue.version.split('.')[0] === '2';
    var DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
    if (!Options) {
        Options = {
            error: DEFAULT_URL,
            loading: DEFAULT_URL,
            try: 3
        };
    }
    var init = {
        error: Options.error ? Options.error : DEFAULT_URL,
        loading: Options.loading ? Options.loading : DEFAULT_URL,
        hasbind: false,
        isInChild: false,
        childEl: null,
        try: Options.try ? Options.try : 1
    };

    var Listeners = [];

    var debounce = function debounce(action, idle) {
        var last = void 0;
        return function () {
            var _this = this;

            var args = arguments;
            clearTimeout(last);
            last = setTimeout(function () {
                action.apply(_this, args);
            }, idle);
        };
    };

    var _ = {
        on: function on(type, func) {
            window.addEventListener(type, func);
        },
        off: function off(type, func) {
            window.removeEventListener(type, func);
        }
    };

    var lazyLoadHandler = debounce(function () {
        for (var i = 0; i < Listeners.length; ++i) {
            var listener = Listeners[i];
            checkCanShow(listener);
        }
    }, 300);

    var onListen = function onListen(start) {
        if (start) {
            _.on('scroll', lazyLoadHandler);
            _.on('wheel', lazyLoadHandler);
            _.on('mousewheel', lazyLoadHandler);
            _.on('resize', lazyLoadHandler);
        } else {
            init.hasbind = false;
            _.off('scroll', lazyLoadHandler);
            _.off('wheel', lazyLoadHandler);
            _.off('mousewheel', lazyLoadHandler);
            _.off('resize', lazyLoadHandler);
        }
    };

    var checkCanShow = function checkCanShow(listener) {
        var winH = void 0;
        var top = void 0;
        if (listener.parentEl) {
            winH = listener.parentEl.offsetHeight;
            top = listener.parentEl.scrollTop;
        } else {
            winH = window.screen.availHeight;
            top = document.documentElement.scrollTop || document.body.scrollTop;
        }

        var height = (top + winH) * window.devicePixelRatio * 1.3;
        if (listener.y < height) {
            render(listener);
        }
    };

    var render = function render(item) {
        if (item.try >= init.try) {
            return false;
        }
        item.try++;

        loadImageAsync(item).then(function (url) {
            var index = Listeners.indexOf(item);
            if (index !== -1) {
                Listeners.splice(index, 1);
            }
            if (!item.bindType) {
                item.el.setAttribute('src', item.src);
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + item.src + ')');
            }
            item.el.setAttribute('lazy', 'loaded');
        }).catch(function (error) {
            if (!item.bindType) {
                item.el.setAttribute('src', init.error);
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + init.error + ')');
            }
            item.el.setAttribute('lazy', 'error');
        });
    };

    var loadImageAsync = function loadImageAsync(item) {
        if (!item.bindType) {
            item.el.setAttribute('src', init.loading);
        } else {
            item.el.setAttribute('style', item.bindType + ': url(' + init.loading + ')');
        }

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
        var i = void 0;
        var len = Listeners.length;

        for (i = 0; i < len; i++) {
            if (Listeners[i] && Listeners[i].el === el) {
                Listeners.splice(i, 1);
            }
        }

        if (Listeners.length == 0) {
            onListen(false);
        }
    };

    var getPosition = function getPosition(el) {
        if (!el) return { y: 0 };
        var t = el.offsetTop;
        var elHeight = el.offsetHeight;
        for (t; el = el.offsetParent;) {
            t += el.offsetTop;
        }
        return {
            y: (t + elHeight) * window.devicePixelRatio
        };
    };

    var addListener = function addListener(el, binding, vnode) {
        if (!init.hasbind) {
            onListen(true);
        }
        var parentEl = null;
        var pos = getPosition(el);
        if (binding.modifiers) {
            parentEl = window.document.getElementById(Object.keys(binding.modifiers)[0]);
        }
        if (!binding.arg) {
            el.setAttribute('lazy', 'loading');
            el.setAttribute('src', init.loading);
        } else {
            el.setAttribute('lazy', 'loading');
            el.setAttribute('style', binding.arg + ': url(' + init.loading + ')');
        }

        Listeners.push({
            bindType: binding.arg,
            try: 0,
            parentEl: parentEl,
            el: el,
            src: binding.value,
            y: pos.y
        });
        lazyLoadHandler();
    };

    if (isVueNext) {
        Vue.directive('lazy', {
            bind: addListener,
            update: addListener,
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