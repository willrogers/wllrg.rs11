  /* This now requires an API key backed by a credit card. */
  function initialize() {
    var mapOptions = {
      center: { lat: 51.574, lng: -1.313},
      zoom: 14
    };
    var map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);
  }
  google.maps.event.addDomListener(window, 'load', initialize);
