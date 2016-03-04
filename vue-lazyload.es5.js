'use strict';

var _temporalUndefined = {};

function _temporalAssertDefined(val, name, undef) { if (val === undef) { throw new ReferenceError(name + ' is not defined - temporal dead zone'); } return true; }

exports.install = function (Vue, options) {
    /* set the vue directive */
    Vue.directive('lazy', {
        init: {
            error: options.error,
            loading: options.loading,
            hasbind: false
        },
        img: [],
        /* set the img show with it state */
        show: function show() {
            var _this = this;

            var winH = _temporalUndefined;
            var top = _temporalUndefined;

            winH = window.screen.availHeight * window.devicePixelRatio;
            top = document.documentElement.scrollTop || document.body.scrollTop;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function () {
                    var item = _temporalUndefined;
                    item = _step.value;

                    //img in viewport and unload and less than 5 attempts
                    if ((_temporalAssertDefined(item, 'item', _temporalUndefined) && item).y < (_temporalAssertDefined(top, 'top', _temporalUndefined) && top) + (_temporalAssertDefined(winH, 'winH', _temporalUndefined) && winH) && !(_temporalAssertDefined(item, 'item', _temporalUndefined) && item).loaded && (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).testCount < 5) {
                        (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).testCount++;
                        _this.loadImageAsync((_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el, (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).src, (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).bindType).then(function (url) {
                            (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).loaded = true;
                            if (!(_temporalAssertDefined(item, 'item', _temporalUndefined) && item).bindType) {
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('src', (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).src);
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.removeAttribute('lazy');
                            } else {
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('style', (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).bindType + ': url(' + (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).src + ')');
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.removeAttribute('lazy');
                            }
                        }, function (error) {

                            if (!(_temporalAssertDefined(item, 'item', _temporalUndefined) && item).bindType) {
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('lazy', 'error');
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('src', _this.init.error);
                            } else {
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('style', (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).bindType + ': url(' + _this.init.error + ')');
                                (_temporalAssertDefined(item, 'item', _temporalUndefined) && item).el.setAttribute('lazy', 'error');
                            }
                        });
                    }
                };

                for (var _iterator = this.img[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator['return']) {
                        _iterator['return']();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }
        },
        /**
         * get the img load state
         * @param  {object} image's dom
         * @param  {string} image url
         * @return {Promise} image load
         */
        loadImageAsync: function loadImageAsync(el, url, bindType) {
            if (!bindType) {
                el.setAttribute('src', this.init.loading);
                el.setAttribute('lazy', 'loading');
            } else {
                el.setAttribute('style', bindType + ': url(' + this.init.loading + ')');
                el.setAttribute('lazy', 'loading');
            }

            return new Promise(function (resolve, reject) {
                var image = _temporalUndefined;
                image = new Image();
                (_temporalAssertDefined(image, 'image', _temporalUndefined) && image).src = url;

                (_temporalAssertDefined(image, 'image', _temporalUndefined) && image).onload = function () {
                    resolve(url);
                };

                (_temporalAssertDefined(image, 'image', _temporalUndefined) && image).onerror = function () {
                    reject(new Error('Could not load image at ' + url));
                };
            });
        },
        /**
         * get the dom coordinates
         * @param  {object} images
         * @return {object} coordinates
         */
        getPst: function getPst(el) {
            var ua = _temporalUndefined;
            var isOpera = _temporalUndefined;
            var isIE = _temporalUndefined; // not opera spoof 

            var parent = _temporalUndefined;
            var pos = _temporalUndefined;
            var box = _temporalUndefined;
            ua = navigator.userAgent.toLowerCase();
            isOpera = (_temporalAssertDefined(ua, 'ua', _temporalUndefined) && ua).indexOf('opera') != -1;
            isIE = (_temporalAssertDefined(ua, 'ua', _temporalUndefined) && ua).indexOf('msie') != -1 && !(_temporalAssertDefined(isOpera, 'isOpera', _temporalUndefined) && isOpera);
            if (el.parentNode === null || el.style.display == 'none') {
                return false;
            }parent = null;
            pos = [];
            box = undefined;
            if (el.getBoundingClientRect) // IE 
                {
                    var scrollTop = _temporalUndefined;
                    var scrollLeft = _temporalUndefined;

                    _temporalAssertDefined(_temporalAssertDefined(box, 'box', _temporalUndefined) && box, 'box', _temporalUndefined);

                    box = el.getBoundingClientRect();
                    scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
                    scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
                    return {
                        x: (_temporalAssertDefined(box, 'box', _temporalUndefined) && box).left + (_temporalAssertDefined(scrollLeft, 'scrollLeft', _temporalUndefined) && scrollLeft),
                        y: (_temporalAssertDefined(box, 'box', _temporalUndefined) && box).top + (_temporalAssertDefined(scrollTop, 'scrollTop', _temporalUndefined) && scrollTop)
                    };
                } else if (document.getBoxObjectFor) // gecko 
                {
                    var borderLeft = _temporalUndefined;
                    var borderTop = _temporalUndefined;

                    _temporalAssertDefined(_temporalAssertDefined(box, 'box', _temporalUndefined) && box, 'box', _temporalUndefined);

                    box = document.getBoxObjectFor(el);
                    borderLeft = el.style.borderLeftWidth ? parseInt(el.style.borderLeftWidth) : 0;
                    borderTop = el.style.borderTopWidth ? parseInt(el.style.borderTopWidth) : 0;

                    _temporalAssertDefined(_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos, 'pos', _temporalUndefined);

                    pos = [(_temporalAssertDefined(_temporalAssertDefined(box, 'box', _temporalUndefined) && box, 'box', _temporalUndefined) && _temporalAssertDefined(box, 'box', _temporalUndefined) && box).x - (_temporalAssertDefined(borderLeft, 'borderLeft', _temporalUndefined) && borderLeft), (_temporalAssertDefined(_temporalAssertDefined(box, 'box', _temporalUndefined) && box, 'box', _temporalUndefined) && _temporalAssertDefined(box, 'box', _temporalUndefined) && box).y - (_temporalAssertDefined(borderTop, 'borderTop', _temporalUndefined) && borderTop)];
                } else // safari & opera 
                {
                    _temporalAssertDefined(_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos, 'pos', _temporalUndefined);

                    pos = [el.offsetLeft, el.offsetTop];

                    _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                    parent = el.offsetParent;

                    if ((_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent) != el) {
                        while (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent) {
                            (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[0] += (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).offsetLeft;
                            (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[1] += (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).offsetTop;

                            _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                            parent = (_temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined) && _temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).offsetParent;
                        }
                    }
                    if ((_temporalAssertDefined(ua, 'ua', _temporalUndefined) && ua).indexOf('opera') != -1 || (_temporalAssertDefined(ua, 'ua', _temporalUndefined) && ua).indexOf('safari') != -1 && el.style.position == 'absolute') {
                        (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[0] -= document.body.offsetLeft;
                        (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[1] -= document.body.offsetTop;
                    }
                }
            if (el.parentNode) {
                _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                parent = el.parentNode;
            } else {
                _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                parent = null;
            }
            while (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent && (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).tagName != 'BODY' && (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).tagName != 'HTML') {
                // account for any scrolled ancestors 
                (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[0] -= (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).scrollLeft;
                (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[1] -= (_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).scrollTop;
                if ((_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).parentNode) {
                    _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                    parent = (_temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined) && _temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent).parentNode;
                } else {
                    _temporalAssertDefined(_temporalAssertDefined(parent, 'parent', _temporalUndefined) && parent, 'parent', _temporalUndefined);

                    parent = null;
                }
            }
            return {
                x: (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[0],
                y: (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos)[1]
            };
        },
        bind: function bind(src) {
            var _this2 = this;

            var self = _temporalUndefined;
            self = this;
            if (!this.init.hasbind) {
                this.init.hasbind = true;
                window.addEventListener('scroll', function () {
                    _this2.show();
                }, false);
            }
        },
        update: function update(src) {
            var _this3 = this;

            if (!this.arg) {
                this.el.setAttribute('src', this.init.loading);
                this.el.setAttribute('lazy', 'loading');
            } else {
                this.el.setAttribute('style', this.arg + ': url(' + this.init.loading + ')');
                this.el.setAttribute('lazy', 'loading');
            }
            this.vm.$nextTick(function () {
                var pos = _temporalUndefined;
                pos = _this3.getPst(_this3.el);
                _this3.img.push({
                    bindType: _this3.arg,
                    testCount: 0,
                    loaded: false,
                    el: _this3.el,
                    src: src,
                    x: (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos).x,
                    y: (_temporalAssertDefined(pos, 'pos', _temporalUndefined) && pos).y
                });
                _this3.show();
            });

            this.el.addEventListener('click', function () {
                _this3.show();
            });
        },
        unbind: function unbind() {
            var _this4 = this;

            window.removeEventListener('scroll', function () {
                _this4.show();
            }, false);
        }

    });
};