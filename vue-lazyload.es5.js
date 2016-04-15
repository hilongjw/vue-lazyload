'use strict';

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.install = function (Vue, options) {
    var init = {
        error: options.error,
        loading: options.loading,
        hasbind: false,
        isInChild: false,
        childEl: null,
        try: 2
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
                item.el.removeAttribute('lazy');
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + item.src + ')');
                item.el.removeAttribute('lazy');
            }
        }).catch(function (error) {
            item.el.setAttribute('lazy', 'error');
            if (!item.bindType) {
                item.el.setAttribute('src', init.error);
            } else {
                item.el.setAttribute('style', item.bindType + ': url(' + init.error + ')');
            }
        });
    };

    var loadImageAsync = function loadImageAsync(item) {
        if (!item.bindType) {
            item.el.setAttribute('src', init.loading);
        } else {
            item.el.setAttribute('style', item.bindType + ': url(' + init.loading + ')');
        }

        return new _bluebird2.default(function (resolve, reject) {
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
        for (i = 0; i < len; i++) {
            if (listeners[i].src == src) {
                listeners.splice(i, 1);
            }
        }

        if (listeners.length == 0) {
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
            if (!init.hasbind) {
                if (document.getElementById(Object.keys(this.modifiers)[0])) {
                    init.isInChild = true;
                    init.childEl = document.getElementById(Object.keys(this.modifiers)[0]);
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
            }
        },
        update: function update(newValue, oldValue) {
            var _this2 = this;

            this.el.setAttribute('lazy', 'loading');
            if (!this.arg) {
                this.el.setAttribute('src', init.loading);
            } else {
                this.el.setAttribute('style', this.arg + ': url(' + init.loading + ')');
            }
            var parentEl = null;
            if (document.getElementById(Object.keys(this.modifiers)[0])) {
                parentEl = document.getElementById(Object.keys(this.modifiers)[0]);
            }
            this.vm.$nextTick(function () {
                var pos = getPosition(_this2.el);
                listeners.push({
                    bindType: _this2.arg,
                    try: 0,
                    parentEl: parentEl,
                    el: _this2.el,
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
