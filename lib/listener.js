import { loadImageAsync, ObjectKeys } from './util';

var imageCache = {};

// el: {
//     state,
//     src,
//     error,
//     loading
// }

var ReactiveListener = function () {
  function ReactiveListener(_ref) {
    var el = _ref.el,
        src = _ref.src,
        error = _ref.error,
        loading = _ref.loading,
        bindType = _ref.bindType,
        $parent = _ref.$parent,
        options = _ref.options,
        elRenderer = _ref.elRenderer;
    babelHelpers.classCallCheck(this, ReactiveListener);

    this.el = el;
    this.src = src;
    this.error = error;
    this.loading = loading;
    this.bindType = bindType;
    this.attempt = 0;

    this.naturalHeight = 0;
    this.naturalWidth = 0;

    this.options = options;

    this.rect = null;

    this.$parent = $parent;
    this.elRenderer = elRenderer;

    this.performanceData = {
      init: Date.now(),
      loadStart: 0,
      loadEnd: 0
    };

    this.filter();
    this.initState();
    this.render('loading', false);
  }

  /*
   * init listener state
   * @return
   */


  babelHelpers.createClass(ReactiveListener, [{
    key: 'initState',
    value: function initState() {
      this.el.dataset.src = this.src;
      this.state = {
        error: false,
        loaded: false,
        rendered: false
      };
    }

    /*
     * record performance
     * @return
     */

  }, {
    key: 'record',
    value: function record(event) {
      this.performanceData[event] = Date.now();
    }

    /*
     * update image listener data
     * @param  {String} image uri
     * @param  {String} loading image uri
     * @param  {String} error image uri
     * @return
     */

  }, {
    key: 'update',
    value: function update(_ref2) {
      var src = _ref2.src,
          loading = _ref2.loading,
          error = _ref2.error;

      var oldSrc = this.src;
      this.src = src;
      this.loading = loading;
      this.error = error;
      this.filter();
      if (oldSrc !== this.src) {
        this.attempt = 0;
        this.initState();
      }
    }

    /*
     * get el node rect
     * @return
     */

  }, {
    key: 'getRect',
    value: function getRect() {
      this.rect = this.el.getBoundingClientRect();
    }

    /*
     *  check el is in view
     * @return {Boolean} el is in view
     */

  }, {
    key: 'checkInView',
    value: function checkInView() {
      this.getRect();
      return this.rect.top < window.innerHeight * this.options.preLoad && this.rect.bottom > this.options.preLoadTop && this.rect.left < window.innerWidth * this.options.preLoad && this.rect.right > 0;
    }

    /*
     * listener filter
     */

  }, {
    key: 'filter',
    value: function filter() {
      var _this = this;

      ObjectKeys(this.options.filter).map(function (key) {
        _this.options.filter[key](_this, _this.options);
      });
    }

    /*
     * render loading first
     * @params cb:Function
     * @return
     */

  }, {
    key: 'renderLoading',
    value: function renderLoading(cb) {
      var _this2 = this;

      loadImageAsync({
        src: this.loading
      }, function (data) {
        _this2.render('loading', false);
        cb();
      }, function () {
        // handler `loading image` load failed
        cb();
        if (!_this2.options.silent) console.warn('VueLazyload log: load failed with loading image(' + _this2.loading + ')');
      });
    }

    /*
     * try load image and  render it
     * @return
     */

  }, {
    key: 'load',
    value: function load(onFinish) {
      var _this3 = this;

      if (this.attempt > this.options.attempt - 1 && this.state.error) {
        if (!this.options.silent) console.log('VueLazyload log: ' + this.src + ' tried too more than ' + this.options.attempt + ' times');
        onFinish();
        return;
      }

      if (this.state.loaded || imageCache[this.src]) {
        this.state.loaded = true;
        onFinish();
        return this.render('loaded', true);
      }

      this.renderLoading(function () {
        _this3.attempt++;

        _this3.record('loadStart');

        loadImageAsync({
          src: _this3.src
        }, function (data) {
          _this3.naturalHeight = data.naturalHeight;
          _this3.naturalWidth = data.naturalWidth;
          _this3.state.loaded = true;
          _this3.state.error = false;
          _this3.record('loadEnd');
          _this3.render('loaded', false);
          imageCache[_this3.src] = 1;
          onFinish();
        }, function (err) {
          console.error(err);
          _this3.state.error = true;
          _this3.state.loaded = false;
          _this3.render('error', false);
        });
      });
    }

    /*
     * render image
     * @param  {String} state to render // ['loading', 'src', 'error']
     * @param  {String} is form cache
     * @return
     */

  }, {
    key: 'render',
    value: function render(state, cache) {
      this.elRenderer(this, state, cache);
    }

    /*
     * output performance data
     * @return {Object} performance data
     */

  }, {
    key: 'performance',
    value: function performance() {
      var state = 'loading';
      var time = 0;

      if (this.state.loaded) {
        state = 'loaded';
        time = (this.performanceData.loadEnd - this.performanceData.loadStart) / 1000;
      }

      if (this.state.error) state = 'error';

      return {
        src: this.src,
        state: state,
        time: time
      };
    }

    /*
     * destroy
     * @return
     */

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

export default ReactiveListener;