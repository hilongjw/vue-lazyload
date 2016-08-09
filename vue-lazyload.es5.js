'use strict';
var Promise = require('es6-promise').Promise;
exports.install = function (Vue, options) {
    var DEFAULT_URL = 'data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAAA1BMVEXs7Oxc9QatAAAACklEQVQI12NgAAAAAgAB4iG8MwAAAABJRU5ErkJggg==';
    if (!options) {
        options = {
            error: DEFAULT_URL,
            loading: DEFAULT_URL,
            try: 3
        };
    }
    var init = {
        error: options.error ? options.error : DEFAULT_URL,
        loading: options.loading ? options.loading : DEFAULT_URL,
        hasbind: false,
        isInChild: false,
        childEl: null,
        try: options.try ? options.try : 1
    };

    var listeners = [];

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

    var lazyLoadHandler = debounce(function () {
        for (var i = 0; i < listeners.length; ++i) {
            var listener = listeners[i];
            checkCanShow(listener);
        }
    }, 300);

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
            var index = listeners.indexOf(item);
            if (index !== -1) {
                listeners.splice(index, 1);
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

    var componentWillUnmount = function componentWillUnmount(src) {
        var i = void 0;
        var len = listeners.length;
        src = src || DEFAULT_URL;
        for (i = 0; i < len; i++) {
            if (listeners[i].src == src) {
                listeners.splice(i, 1);
            }
        }

        if (listeners.length == 0) {
            init.hasbind = false;
            window.removeEventListener('scroll', lazyLoadHandler);
            window.removeEventListener('wheel', lazyLoadHandler);
            window.removeEventListener('mousewheel', lazyLoadHandler);
            window.removeEventListener('resize', lazyLoadHandler);
        }
    };

    var getPosition = function getPosition(el) {
        var t = el.offsetTop;
        var elHeight = el.offsetHeight;
        for (t; el = el.offsetParent;) {
            t += el.offsetTop;
        }
        return {
            y: (t + elHeight) * window.devicePixelRatio
        };
    };

    Vue.directive('lazy', {
        bind: function bind() {
            var _this2 = this;

            if (!init.hasbind) {
                Vue.nextTick(function () {
                    if (document.getElementById(Object.keys(_this2.modifiers)[0])) {
                        init.isInChild = true;
                        init.childEl = document.getElementById(Object.keys(_this2.modifiers)[0]);
                    }
                    init.hasbind = true;
                    if (init.isInChild) {
                        init.childEl.addEventListener('scroll', lazyLoadHandler);
                    }
                    window.addEventListener('scroll', lazyLoadHandler);
                    window.addEventListener('wheel', lazyLoadHandler);
                    window.addEventListener('mousewheel', lazyLoadHandler);
                    window.addEventListener('resize', lazyLoadHandler);
                    lazyLoadHandler();
                });
            }
        },
        update: function update(newValue, oldValue) {
            var _this3 = this;

            this.el.setAttribute('lazy', 'loading');
            if (!this.arg) {
                this.el.setAttribute('src', init.loading);
            } else {
                this.el.setAttribute('style', this.arg + ': url(' + init.loading + ')');
            }
            var parentEl = null;
            this.vm.$nextTick(function () {
                if (document.getElementById(Object.keys(_this3.modifiers)[0])) {
                    parentEl = document.getElementById(Object.keys(_this3.modifiers)[0]);
                }
                var pos = getPosition(_this3.el);
                listeners.push({
                    bindType: _this3.arg,
                    try: 0,
                    parentEl: parentEl,
                    el: _this3.el,
                    src: newValue,
                    y: pos.y
                });
                lazyLoadHandler();
            });
        },
        unbind: function unbind(src) {
            componentWillUnmount(src);
        }
    });
};