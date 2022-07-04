function addClass(el, className) {
  el.classList.add(className);
}

function removeClass(el, className) {
  if (Object.prototype.toString.call(className) === "[object Array]") {
    for (var i = 0; i < className.length; i++) {
      el.classList.remove(className[i]);
    }
  }
  el.classList.remove(className);
}

function getElementTop(el) {
  var top = el.offsetTop;
  var parent = el.offsetParent;
  while (true) {
    top += parent.offsetTop;
    parent = parent.offsetParent;
    if (parent === null) return top;
  }
}
