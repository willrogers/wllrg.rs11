
function scrollToAnchor(aid){
    var aTag = $("a[name="+ aid +"]");
    $('html,body').animate({scrollTop: aTag.offset().top},'slow');
}


$(function() {
    for (var i = 0; i < 100; i++){
        $p = $('<p>Different text.</p>');
        $('.content').append($p);
    if (i % 10 == 0) { 
            $a = $('<a name="anchor' + i + '">An anchor</a>');
            $('.content').append($a);
        }
    }
    $('.slowscroll').click(function(event) {
        //prevent the default action for the click event
        event.preventDefault();
        scrollToAnchor('feet');
    });
});

