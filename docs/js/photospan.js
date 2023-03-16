function screen_width() {
    return window.innerWidth
        || document.documentElement.clientWidth
        || document.body.clientWidth;
}

function photo_widths() {
    var lengths = [];
    var photos = $('.photospan').children();
    for (var i = 0; i < photos.length; i++) {
        lengths.push($(photos[i]).width());
    }
    return lengths;
}

function centre(photo) {
    console.log('photo is ' + photo.data);
    photo = photo.data;
    var widths = photo_widths();
    var centre_point = 0;
    for (var i = 0; i < photo; i++) {
        console.log(widths[i]);
        centre_point += widths[i];
    }
    console.log('widths: ' + widths);
    console.log('computed centre point: ' + centre_point);
    centre_point += widths[photo] / 2;
    var ml = screen_width() / 2 - centre_point;
    console.log('computed ml: ' + ml);
    var total = 0;
    $.each(photo_widths(),function() {
        total += this;
     });
    if (ml > 0) {
        ml = 0;
    } else if (ml < screen_width() - total) {
        ml = screen_width() - total;
    }
    $('.photospan').animate({'margin-left': ml + 'px'}, 300);
    var active = $('.photospan').data('active-photo');
    var active_photo = $('.photospan').children()[active];
    $(active_photo).css('opacity', 0.7);
    var active_photo = $('.photospan').children()[photo];
    $(active_photo).css('opacity', 1.0);
    $('.photospan').data('active-photo', photo);

}

function shift(right) {
    console.log('move right?' + right);
    if ($('.photospan').is(':animated')) {
        console.log('moving');
        return;
    }
    var active = $('.photospan').data('active-photo');
    console.log('active is ' + active);
    var active_photo = $('.photospan').children()[active];
    var nphotos = $('.photospan').children().length;
    var nextactive = right ? active - 1 : active + 1;
    if (nextactive === -1) {
        nextactive = nphotos - 1;
    } else if (nextactive === nphotos) {
        nextactive = 0;
    }
    centre({data: nextactive});
}

function render(urls) {
    var height = 430;

    var container = $('.photospan-container');
    var photosdiv = $('.photospan');
    photosdiv.css({'overflow': 'hidden',
                   'width': '20000px'});
    photosdiv.data('activePhoto', 0);
    for (var i = 0; i < urls.length; i++) {
        var img = $('<img/>', {
            src: urls[i],
            height: height,
            class: 'spanphoto'
        });
        img.css('float', 'left');
        if (i > 0) {
            img.css('opacity', 0.7);
        }
        img.appendTo(photosdiv);
        img.click(i, centre);
    }
}

$(document).ready(function() {
    var images = $('.photospan').children('img');
    var urls = images.map(function() {return $(this).attr('src');}).get();
    $('.photospan > img').remove();
    console.log(urls);
    render(urls);
});

$(document).keydown(function(event) {
    if (event.keyCode === 39) {
        shift(false);
    } else if (event.keyCode === 37) {
        shift(true);
    }
});
