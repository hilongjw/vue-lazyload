 /* 
   根据id判断位置，返回X,Y轴的坐标 
  */
 function getElementPos(elementId) {
   var ua = navigator.userAgent.toLowerCase();
   var isOpera = (ua.indexOf('opera') != -1);
   var isIE = (ua.indexOf('msie') != -1 && !isOpera); // not opera spoof  
   var el = document.getElementById(elementId);
   if (el.parentNode === null || el.style.display == 'none') {
     return false;
   }
   var parent = null;
   var pos = [];
   var box;
   if (el.getBoundingClientRect) // IE  
   {
     box = el.getBoundingClientRect();
     var scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
     var scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft);
     return {
       x: box.left + scrollLeft,
       y: box.top + scrollTop
     };
   } else
   if (document.getBoxObjectFor) // gecko  
   {
     box = document.getBoxObjectFor(el);
     var borderLeft = (el.style.borderLeftWidth) ? parseInt(el.style.borderLeftWidth) : 0;
     var borderTop = (el.style.borderTopWidth) ? parseInt(el.style.borderTopWidth) : 0;
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
       parent = null;
     }
   }
   return {
     x: pos[0],
     y: pos[1]
   };
 }

 /* 
   函数功能： 
   兼容IE和FF返回目标对象包含边框的left、top、width、height值。其中left、top是相对于document.body的坐标。 
   需要参数1个： 
   [DOM]o=[DOM]要取值的对象。 
   */
 function getLTWH(id) {
   o = document.getElementById(id);
   if (o == null) {
     return;
   }

   function getCurrentStyle(style) {
     var number = parseInt(o.currentStyle[style]);
     return isNaN(number) ? 0 : number;
   }

   function getComputedStyle(style) {
     return parseInt(document.defaultView.getComputedStyle(o, null).getPropertyValue(style));
   }
   var oLTWH = {
     "left": o.offsetLeft,
     "top": o.offsetTop,
     "width": o.offsetWidth,
     "height": o.offsetHeight
   };
   while (true) {
     o = o.offsetParent;
     if (o == (document.body && null))
       break;
     oLTWH.left += o.offsetLeft;
     oLTWH.top += o.offsetTop;
     if (jQuery.browser.msie && jQuery.browser.version == "6.0") {
       oLTWH.left += getCurrentStyle("borderLeftWidth");
       oLTWH.top += getCurrentStyle("borderTopWidth");
     } else {
       oLTWH.left += getComputedStyle("border-left-width");
       oLTWH.top += getComputedStyle("border-top-width");
     }
   }
   return oLTWH;
 }

 function getltByWindow() {
   var windowWidth, windowHeight; // 窗口的高和宽  
   // 取得窗口的高和宽  
   if (self.innerHeight) {
     windowWidth = self.innerWidth;
     windowHeight = self.innerHeight;
   } else
   if (document.documentElement &&
     document.documentElement.clientHeight) {
     windowWidth = document.documentElement.clientWidth;
     windowHeight = document.documentElement.clientHeight;
   } else
   if (document.body) {
     windowWidth = document.body.clientWidth;
     windowHeight = document.body.clientHeight;
   }
   return {
     left: windowWidth,
     top: windowHeight
   }
 }
