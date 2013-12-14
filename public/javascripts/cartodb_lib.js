var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.880517,-87.644061],
  defaultZoom:     12,
  locationScope:   "chicago",
  currentPinpoint: null,
  searchRadius:    805,
  layerUrl: 'http://clearstreets.cartodb.com/api/v2/viz/939c3a24-6455-11e3-bc2d-3f9cbfc31a0d/viz.json',
  tableName: 'clearstreets_live_2013_12_13',

  initialize: function(){
    geocoder = new google.maps.Geocoder();

    // initiate leaflet map
    if (!CartoDbLib.map) {
      CartoDbLib.map = new L.Map('map_canvas', { 
        center: CartoDbLib.map_centroid,
        zoom: CartoDbLib.defaultZoom
      });
    }

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

    var sql = "SELECT * FROM " + CartoDbLib.tableName;

    // change the query for the first layer
    var subLayerOptions = {
      sql: sql,
      interactivity: 'cartodb_id, id, date_stamp'
    }

    // console.log(sql);

    CartoDbLib.info = L.control({position: 'bottomright'});

    CartoDbLib.info.onAdd = function (map) {
        this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
        this.update();
        return this._div;
    };

    // method that we will use to update the control based on feature properties passed
    CartoDbLib.info.update = function (props) {
      var date_formatted = '';
      if (props)
        date_formatted = new moment(props.date_stamp).format("h:mm:ss a M/D/YYYY");

      this._div.innerHTML = '<h4>Plow info</h4>' +  (props ?
            'Plowed at <b/>' + date_formatted + '</b> by Plow ' + props.id : 'Hover over a plow path');
    };

    CartoDbLib.info.addTo(CartoDbLib.map);

    CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, CartoDbLib.layerUrl)
      .addTo(CartoDbLib.map)
      .on('done', function(layer) {
        layer.getSubLayer(0)
        .set(subLayerOptions)
        .on('featureOver', function(e, latlng, pos, data, subLayerIndex) {
          CartoDbLib.info.update(data);
        });
      }).on('error', function() {
        //log the error
    }); 

    CartoDbLib.doSearch();
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search_address").val();
    CartoDbLib.searchRadius = $("#search_radius").val();

    //-----custom filters-------
    //-------end of custom filters--------
    
    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;
  
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
          $.address.parameter('radius', encodeURIComponent(CartoDbLib.searchRadius));
          CartoDbLib.map.setView(new L.LatLng( CartoDbLib.currentPinpoint[0], CartoDbLib.currentPinpoint[1] ), 16)
          
          CartoDbLib.centerMark = new L.Marker(CartoDbLib.currentPinpoint, { icon: (new L.Icon({
            iconUrl: '/images/blue-pushpin.png',
            iconSize: [32, 32],
            iconAnchor: [10, 32]
          }))}).addTo(CartoDbLib.map);

          // CartoDbLib.drawCircle(CartoDbLib.currentPinpoint);
        } 
        else {
          alert("We could not find your address: " + status);
        }
      });
    }
    else { //search without geocoding callback
      CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)
    }
  },

  clearSearch: function(){
    if (CartoDbLib.dataLayer)
      CartoDbLib.map.removeLayer( CartoDbLib.dataLayer );
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.circle)
      CartoDbLib.map.removeLayer( CartoDbLib.circle );

    CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)
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