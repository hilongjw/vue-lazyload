import { assign, find, remove, ArrayFrom } from './util';

var LazyContainerMananger = function () {
  function LazyContainerMananger(_ref) {
    var lazy = _ref.lazy;
    babelHelpers.classCallCheck(this, LazyContainerMananger);

    this.lazy = lazy;
    lazy.lazyContainerMananger = this;
    this._queue = [];
  }

  babelHelpers.createClass(LazyContainerMananger, [{
    key: 'bind',
    value: function bind(el, binding, vnode) {
      var container = new LazyContainer({ el: el, binding: binding, vnode: vnode, lazy: this.lazy });
      this._queue.push(container);
    }
  }, {
    key: 'update',
    value: function update(el, binding, vnode) {
      var container = find(this._queue, function (item) {
        return item.el === el;
      });
      if (!container) return;
      container.update({ el: el, binding: binding, vnode: vnode });
    }
  }, {
    key: 'unbind',
    value: function unbind(el, binding, vnode) {
      var container = find(this._queue, function (item) {
        return item.el === el;
      });
      if (!container) return;
      container.clear();
      remove(this._queue, container);
    }
  }]);
  return LazyContainerMananger;
}();

export default LazyContainerMananger;


var defaultOptions = {
  selector: 'img'
};

var LazyContainer = function () {
  function LazyContainer(_ref2) {
    var el = _ref2.el,
        binding = _ref2.binding,
        vnode = _ref2.vnode,
        lazy = _ref2.lazy;
    babelHelpers.classCallCheck(this, LazyContainer);

    this.el = null;
    this.vnode = vnode;
    this.binding = binding;
    this.options = {};
    this.lazy = lazy;

    this._queue = [];
    this.update({ el: el, binding: binding });
  }

  babelHelpers.createClass(LazyContainer, [{
    key: 'update',
    value: function update(_ref3) {
      var _this = this;

      var el = _ref3.el,
          binding = _ref3.binding;

      this.el = el;
      this.options = assign({}, defaultOptions, binding.value);
      var imgs = this.getImgs();
      imgs.forEach(function (el) {
        _this.lazy.add(el, Object.assign({}, _this.binding, {
          value: {
            src: el.getAttribute('data-src')
          }
        }), _this.vnode);
      });
    }
  }, {
    key: 'getImgs',
    value: function getImgs() {
      return ArrayFrom(this.el.querySelectorAll(this.options.selector));
    }
  }, {
    key: 'clear',
    value: function clear() {
      var _this2 = this;

      var imgs = this.getImgs();
      imgs.forEach(function (el) {
        return _this2.lazy.remove(el);
      });

      this.vnode = null;
      this.binding = null;
      this.lazy = null;
    }
  }]);
  return LazyContainer;
}();