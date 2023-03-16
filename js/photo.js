
function resize_photo() {
    var w = window.innerWidth
    || document.documentElement.clientWidth
    || document.body.clientWidth;

    var h = window.innerHeight
    || document.documentElement.clientHeight
    || document.body.clientHeight;

    var content = document.getElementById("content");
    var rect = content.getBoundingClientRect();
    var max_width = rect.right - rect.left;
    var max_height = h - rect.top - 20;
    var avail_ratio = max_height / max_width;

    var pdiv = document.getElementById("main-photo");
    var width = pdiv.naturalWidth;
    var height = pdiv.naturalHeight;
    var ratio = height / width;

    if (ratio <= avail_ratio) {
        pdiv.setAttribute("width", max_width);
        pdiv.setAttribute("height", max_width * ratio);
    } else {
        pdiv.setAttribute("height", max_height);
        pdiv.setAttribute("width", max_height / ratio);

    }
}

$(function() {
    resize_photo();
});

$(window).resize(resize_photo);

$(document).keydown(function(event) {
    if (event.keyCode === 39) {
      alert("right arrow key");
    } else if (event.keyCode === 37) {
        alert("left arrow key");
    }
});
