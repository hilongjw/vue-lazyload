Vue.directive('view', {
  view: {
    list: [],
    show: false,
    current: 0,
    init: false
  },
  init: function() {
    let box = document.createElement('div')
    box.innerHTML = `<div id="__PREVIEW" class='cov-imageviewer'>
                      <div class='cov-imageviewer-mask'></div>
                        <div class='cov-imageviewer-header'>
                          <div></div>
                          <img id="__PREVIEW__IMG" src="dist/2.png">
                        </div>
                      </div>`
    document.body.appendChild(box)
  },
  show: function(id) {
    var preimg = document.getElementById('__PREVIEW__IMG')
    preimg.setAttribute('src', this.view.list[id])
    preimg.addEventListener('touchmove', function(event) {
      var img = document.getElementById('__PREVIEW__IMG');
      var touches = event.changedTouches;
      if (touches.length === 2) {
        event.preventDefault()
        event.cancelBubble = true
        var p1 = touches[0]
        var p2 = touches[1]
        var x = p1.pageX - p2.pageX
        var y = p1.pageY - p2.pageY
        self.scaleEnd = Math.sqrt(x * x + y * y)
        self._scaleValue = (self.scaleValue * (self.scaleEnd / self.scaleStart))
        //self.state.innerText = self._scaleValue;
        img.style.webkitTransform = "scale(" + self._scaleValue + "," + self._scaleValue + ") "; // + " translate(" + self.dragX || 0 + "px," + self.dragY || 0 + "px)";
      } else if (!self.isMultiTouch && touches.length === 1 && self.scaleValue != 1) {
        event.preventDefault();
        event.cancelBubble = true
        self.dragEnd = touches[0]
        self._dragX = self.dragX + (self.dragEnd.pageX - self.dragStart.pageX);
        self._dragY = self.dragY + (self.dragEnd.pageY - self.dragStart.pageY);
        img.style.marginLeft = self._dragX + 'px'
        img.style.marginTop = self._dragY + 'px'
        //img.style.transform = "translate(" + self._dragX + "px," + self._dragY + "px) " + " scale(" + self.scaleValue || 1 + "," + self.scaleValue || 1 + ")";
      }
    }, false);
  },
  bind: function() {
    if (!this.view.init) {
      this.init()
      this.view.init = true
    }
  },
  update: function(src) {
    var self = this
    this.el.setAttribute('src', src)
    this.view.list.push(src)
    var id = self.view.list.length
    this.el.addEventListener('click', function() {
      self.show((id - 1))
      document.getElementById('__PREVIEW').setAttribute('style', 'display:block')

      document.getElementById('__PREVIEW').addEventListener('click', function() {
        document.getElementById('__PREVIEW').setAttribute('style', '')
      }, false)
    }, false)
  },
  unbind: function() {
    this.view = null
  }
})