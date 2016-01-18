'use strict';

exports.install = function (Vue, options) {
  /* set the vue directive */
  Vue.directive('lazy', {
    init: {
      error: options.error,
      loading: options.loading,
      hasbind: false
    },
    img: new Set(),
    /* set the img show with it state */
    show() {
      let self = this;
      let winH = window.screen.availWidth;
      let top = document.documentElement.scrollTop || document.body.scrollTop;
      for (let item of self.img) {
        //img in viewport and unload and less than 5 attempts
        if (item.y < top + winH && !item.loaded && item.tryed < 5) {
          item.tryed++;
          this.loadImageAsync(item.el, item.src).then(function (url) {
            item.loaded = true;
            item.el.setAttribute('src', item.src);
          }, function (error) {
            item.el.setAttribute('src', self.init.error);
          });
        }
      }
    },
    /**
     * get the img load state
     * @param  {object} image's dom
     * @param  {string} image url
     * @return {Promise} image load
     */
    loadImageAsync(el, url) {
      el.setAttribute('src', this.init.loading);
      return new Promise(function (resolve, reject) {
        var image = new Image();
        image.src = url;

        image.onload = function () {
          resolve(url);
        };

        image.onerror = function () {
          reject(new Error('Could not load image at ' + url));
        };
      });
    },
    /**
     * get the dom coordinates
     * @param  {object} images
     * @return {object} coordinates
     */
    getPst(el) {
      let ua = navigator.userAgent.toLowerCase();
      let isOpera = ua.indexOf('opera') != -1;
      let isIE = ua.indexOf('msie') != -1 && !isOpera; // not opera spoof 
      if (el.parentNode === null || el.style.display == 'none') {
        return false;
      }
      let parent = null;
      let pos = [];
      let box;
      if (el.getBoundingClientRect) // IE 
        {
          box = el.getBoundingClientRect();
          let scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
          let scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
          return {
            x: box.left + scrollLeft,
            y: box.top + scrollTop
          };
        } else if (document.getBoxObjectFor) // gecko 
        {
          box = document.getBoxObjectFor(el);
          let borderLeft = el.style.borderLeftWidth ? parseInt(el.style.borderLeftWidth) : 0;
          let borderTop = el.style.borderTopWidth ? parseInt(el.style.borderTopWidth) : 0;
          pos = [box.x - borderLeft, box.y - borderTop];
        } else // safari & opera 
        {
          pos = [el.offsetLeft, el.offsetTop];
          parent = el.offsetParent;
          if (parent != el) {
            while (parent) {
              pos[0] += parent.offsetLeft;
              pos[1] += parent.offsetTop;
              parent = parent.offsetParent;
            }
          }
          if (ua.indexOf('opera') != -1 || ua.indexOf('safari') != -1 && el.style.position == 'absolute') {
            pos[0] -= document.body.offsetLeft;
            pos[1] -= document.body.offsetTop;
          }
        }
      if (el.parentNode) {
        parent = el.parentNode;
      } else {
        parent = null;
      }
      while (parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') {
        // account for any scrolled ancestors 
        pos[0] -= parent.scrollLeft;
        pos[1] -= parent.scrollTop;
        if (parent.parentNode) {
          parent = parent.parentNode;
        } else {
          parent = null;
        }
      }
      return {
        x: pos[0],
        y: pos[1]
      };
    },
    bind: function (src) {
      let self = this;
      if (!this.init.hasbind) {
        this.init.hasbind = true;
        window.addEventListener('scroll', function () {
          self.show();
        }, false);
      }
    },
    update: function (src) {
      let self = this;
      this.el.setAttribute('src', self.loading);
      this.vm.$nextTick(function () {
        let pos = self.getPst(self.el);
        self.img.add({
          tryed: 0,
          loaded: false,
          el: self.el,
          src: src,
          x: pos.x,
          y: pos.y
        });
        self.show();
      });

      this.el.addEventListener('click', function () {
        self.show();
      });
    },
    unbind: function () {
      window.removeEventListener('scroll', function () {
        this.show();
      }, false);
    }
  });
};
