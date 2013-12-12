var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.8781136, -87.66677856445312],
  defaultZoom:     13,
  locationScope:   "chicago",
  currentPinpoint: null,
  searchRadius:    805,
  layerUrl: 'http://clearstreets.cartodb.com/api/v2/viz/5540780a-62a5-11e3-92ab-c7be36a2d904/viz.json',

  initialize: function(){
    geocoder = new google.maps.Geocoder();

    // initiate leaflet map
    CartoDbLib.map = new L.Map('map_canvas', { 
      center: CartoDbLib.map_centroid,
      zoom: CartoDbLib.defaultZoom
    })

    L.tileLayer('http://{s}.tile.cloudmade.com/{key}/{styleId}/256/{z}/{x}/{y}.png', {
      attribution: 'Mapbox <a href="http://mapbox.com/about/maps" target="_blank">Terms &amp; Feedback</a>',
      key: 'BC9A493B41014CAABB98F0471D759707',
      styleId: 22677
    }).addTo(CartoDbLib.map);

    //reset filters
    $("#search_address").val(CartoDbLib.convertToPlainString($.address.parameter('address')));
    var loadRadius = CartoDbLib.convertToPlainString($.address.parameter('radius'));
    if (loadRadius != "") $("#search_radius").val(loadRadius);
    else $("#search_radius").val(CartoDbLib.searchRadius);

    CartoDbLib.doSearch();
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search_address").val();
    CartoDbLib.searchRadius = $("#search_radius").val();

    var whereClause = "";
    
    //-----custom filters-------
    //-------end of custom filters--------

    var sql = "SELECT * FROM clearstreets_live ";
    
    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;
  
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(CartoDbLib.searchRadius));
          CartoDbLib.map.setView(new L.LatLng( CartoDbLib.currentPinpoint[0], CartoDbLib.currentPinpoint[1] ), 14)
          
          CartoDbLib.centerMark = new L.Marker(CartoDbLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: '/images/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
          }))}).addTo(CartoDbLib.map);

          sql += "WHERE ST_Intersects( the_geom, ST_Buffer( ST_SetSRID('POINT(" + CartoDbLib.currentPinpoint[0] + " " + CartoDbLib.currentPinpoint[1] + ")'::geometry , 4326) , " + CartoDbLib.getRadDeg(CartoDbLib.searchRadius) + "))";
          CartoDbLib.drawCircle(CartoDbLib.currentPinpoint);
          CartoDbLib.submitSearch(sql);
        } 
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      CartoDbLib.submitSearch(sql);
    }
  },

  submitSearch: function(sql){
    // change the query for the first layer
    var subLayerOptions = {
      sql: sql
    }

    console.log(sql);

    CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, CartoDbLib.layerUrl)
      .addTo(CartoDbLib.map)
      .on('done', function(layer) {
        layer.getSubLayer(0).set(subLayerOptions);
      }).on('error', function() {
        //log the error
      }); 
  },

  clearSearch: function(){
    if (CartoDbLib.dataLayer)
      CartoDbLib.map.removeLayer( CartoDbLib.dataLayer );
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.circle)
      CartoDbLib.map.removeLayer( CartoDbLib.circle );
  },

  drawCircle: function(centroid){
    CartoDbLib.circle = L.circle(centroid, CartoDbLib.searchRadius, {
        color: '4b58a6',
        fillColor: '#4b58a6',
        fillOpacity: 0.2
    }).addTo(CartoDbLib.map);
  },

  findMe: function() {
    // Try W3C Geolocation (Preferred)
    var foundLocation;
    
    if(navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        foundLocation = new google.maps.LatLng(position.coords.latitude,position.coords.longitude);
        CartoDbLib.addrFromLatLng(foundLocation);
      }, null);
    }
    else {
      alert("Sorry, we could not find your location.");
    }
  },
  
  addrFromLatLng: function(latLngPoint) {
    geocoder.geocode({'latLng': latLngPoint}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[1]) {
          $('#search_address').val(results[1].formatted_address);
          $('.hint').focus();
          CartoDbLib.doSearch();
        }
      } else {
        alert("Geocoder failed due to: " + status);
      }
    });
  },

  getRadDeg: function(dist) {
    var 
    deg  = 180,
    brng = deg * Math.PI / 180,
    dist = dist/6371000,
    lat1 = CartoDbLib.map_centroid[0] * Math.PI / 180,
    lon1 = CartoDbLib.map_centroid[1] * Math.PI / 180;

    var lat2 = Math.asin(Math.sin(lat1) * Math.cos(dist) + 
               Math.cos(lat1) * Math.sin(dist) * Math.cos(brng));

    var lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(lat1), Math.cos(dist) - 
               Math.sin(lat1) * Math.sin(lat2));

    if (isNaN(lat2) || isNaN(lon2)) return null;

    return CartoDbLib.map_centroid[0] - (lat2 * 180 / Math.PI);
  },

  //converts a slug or query string in to readable text
  convertToPlainString: function(text) {
    if (text == undefined) return '';
    return decodeURIComponent(text);
  }
}