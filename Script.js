$( document ).ready(function() {
    $('#isScrollingenabled').change(function() {

        if (this.checked) {
            scroller.enable();
        } else {
            scroller.disable();
        }
    });


});