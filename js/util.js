function addClass(el, className) {
        var _ = el.className.split(' ');
        var index = _.indexOf(className);
        if (index >= 0) return className;
        _.push(className);
        el.className = _.join(' ');
    }

function removeClass(el, className) {
    var _ = el.className.split(' ');
    var index = _.indexOf(className);
    if (index < 0) return className;
    _.splice(index, 1);
    el.className = _.join(' ');
}