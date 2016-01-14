module.exports = function(obj) {
  return {
    init: {
      error: obj.error,
      loading: obj.loading
    },
    img: new Set(),
    loading: `data:img/jpg;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA8CAMAAAANIilAAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyJpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoV2luZG93cykiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6QTM0MENBOUZCQTZEMTFFNTk1M0NDMkJFMjczRTE2RDkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6QTM0MENBQTBCQTZEMTFFNTk1M0NDMkJFMjczRTE2RDkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpBMzQwQ0E5REJBNkQxMUU1OTUzQ0MyQkUyNzNFMTZEOSIgc3RSZWY6ZG9jdW1lbnRJRD0ieG1wLmRpZDpBMzQwQ0E5RUJBNkQxMUU1OTUzQ0MyQkUyNzNFMTZEOSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/PpIdSmcAAAAGUExURf///wAAAFXC034AAAAdSURBVHja7MExAQAAAMKg9U9tBn+gAAAA4DMBBgAOTAAB+x36jAAAAABJRU5ErkJggg==`,
    show() {
      let self = this
      let winH = window.screen.availWidth
      let top = document.documentElement.scrollTop || document.body.scrollTop;
      for (let item of self.img) {
        //img in viewport and unload and less than 5 attempts
        if (item.y < (top + winH) && !item.loaded && item.tryed < 5) {
          item.tryed++
          this.loadImageAsync(item.el, item.src).then(function(url) {
            item.loaded = true
            item.el.setAttribute('src', item.src)
          }, function(error) {
            item.el.setAttribute('src', self.init.error)
          })
        }
      }
    },
    loadImageAsync(el, url) {
      el.setAttribute('src', this.init.loading)
      return new Promise(function(resolve, reject) {
        var image = new Image();

        image.onload = function() {
          resolve(url);
        };

        image.onerror = function() {
          reject(new Error('Could not load image at ' + url));
        };

        image.src = url;
      });
    },
    getPst(el) {
      let ua = navigator.userAgent.toLowerCase();
      let isOpera = (ua.indexOf('opera') != -1);
      let isIE = (ua.indexOf('msie') != -1 && !isOpera); // not opera spoof  
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
      } else
      if (document.getBoxObjectFor) // gecko  
      {
        box = document.getBoxObjectFor(el);
        let borderLeft = (el.style.borderLeftWidth) ? parseInt(el.style.borderLeftWidth) : 0;
        let borderTop = (el.style.borderTopWidth) ? parseInt(el.style.borderTopWidth) : 0;
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
        if (ua.indexOf('opera') != -1 ||
          (ua.indexOf('safari') != -1 && el.style.position == 'absolute')) {
          pos[0] -= document.body.offsetLeft;
          pos[1] -= document.body.offsetTop;
        }
      }
      if (el.parentNode) {
        parent = el.parentNode;
      } else {
        parent = null;
      }
      while (parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') { // account for any scrolled ancestors  
        pos[0] -= parent.scrollLeft;
        pos[1] -= parent.scrollTop;
        if (parent.parentNode) {
          parent = parent.parentNode;
        } else {
          parent = null
        }
      }
      return {
        x: pos[0],
        y: pos[1]
      };
    },
    bind: function(src) {
      let self = this
      window.onscroll = function() {
        self.show()
      }
    },
    update: function(src) {
      let self = this
      this.el.setAttribute('src', self.loading)
      this.vm.$nextTick(function() {
        let pos = self.getPst(self.el);
        self.img.add({
          tryed: 0,
          loaded:false,
          el: self.el,
          src: src,
          x: pos.x,
          y: pos.y
        })
        self.show()
      })

      this.el.addEventListener('click', function() {
        self.show()
      })
    },
    unbind: function() {
      window.onscroll = null;
    }
  }
}
