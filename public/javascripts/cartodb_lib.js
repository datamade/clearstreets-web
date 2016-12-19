var CartoDbLib = CartoDbLib || {};
var CartoDbLib = {

  map_centroid:    [41.880517,-87.644061],
  defaultZoom:     12,
  locationScope:   "chicago",
  currentPinpoint: null,
  layerUrl: 'http://clearstreets.cartodb.com/api/v2/viz/28b1ab70-b293-11e5-8e57-0e5db1731f59/viz.json',
  //vizHackUrl: 'http://clearstreets.cartodb.com/api/v2/viz/589c99a4-673a-11e3-bc87-37a820bb3867/viz.json',
  tableName: 'clearstreets_dev',
  plowPoints: [],

  initialize: function(){
    geocoder = new google.maps.Geocoder();

    // initiate leaflet map
    if (!CartoDbLib.map) {
      CartoDbLib.map = new L.Map('map_canvas', { 
        center: CartoDbLib.map_centroid,
        zoom: CartoDbLib.defaultZoom,
        track_id: CartoDbLib.maptiks_tracking_code,
        scrollWheelZoom: false
      });

      L.tileLayer('https://{s}.tiles.mapbox.com/v3/datamade.hn83a654/{z}/{x}/{y}.png', {
        attribution: '<a href="http://www.mapbox.com/about/maps/" target="_blank">Terms &amp; Feedback</a>'
      }).addTo(CartoDbLib.map);

      CartoDbLib.info = L.control({position: 'bottomright'});

      CartoDbLib.info.onAdd = function (map) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };

      // method that we will use to update the control based on feature properties passed
      CartoDbLib.info.update = function (props) {
        var date_formatted = '';
        if (props) {
          // date_formatted = new moment(props.date_stamp).format("h:mm:ss a M/D/YYYY");
          console.log(props)
          date_formatted = new moment(props.date_stamp, "YYY-MM-DD h:mm:ss+00").subtract(5, 'hour').format("h:mm:ss a M/D/YYYY");
        }
        
        this._div.innerHTML = '<h4>Plow info</h4>' +  (props ?
              'Plowed at <b/>' + date_formatted + '</b> by Plow ' + props.id : 'Hover over a plow path');
      };

      CartoDbLib.info.addTo(CartoDbLib.map);
    }

    CartoDbLib.drawPlowPoints();

    //reset filters
    $("#search_address").val(CartoDbLib.convertToPlainString($.address.parameter('address')));

    var sql = "SELECT * FROM " + CartoDbLib.tableName + "";

    // change the query for the first layer
    var subLayerOptions = {
      sql: sql,
      interactivity: 'cartodb_id, id, date_stamp'
    }
 
    CartoDbLib.dataLayer = cartodb.createLayer(CartoDbLib.map, CartoDbLib.layerUrl, {refreshTime: 30000})
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
  },

  drawPlowPoints: function() {
    CartoDbLib.plowPoints = [];
    $.when( $.getJSON("http://status.clearstreets.org/snow-plow-data/") ).then(function( data, textStatus, jqXHR ) {

      var fleet_info = "";
      if (data['data_present'] == true) {
        $.each(data.assets, function( i, asset_type ) {

          var label_type = "info";
          if (asset_type['type'] == "SNOW 4X4")
            label_type = "success";
          fleet_info += "<span class='label label-" + label_type + "'>" + asset_type.count + " " + asset_type['type']  + '</span> ';

          $.each(asset_type.vehicles, function( j, v ) {
            // console.log(v)
            var point_color = "#2669AB";
            if (v.assetType == "SNOW 4X4")
              point_color = "#42A233";
            var marker = L.circleMarker([v.latitude, v.longitude], {radius: 3, color: point_color, fillOpacity: 1, fillColor: point_color});
            marker.bindPopup("<h4>" + v.assetName + "</h4>" + v.assetType + "");
            marker.addTo(CartoDbLib.map);
            CartoDbLib.plowPoints.push(marker);
          });
        });
        $('#fleet-status').html(fleet_info)
      }
    });
  },

  doSearch: function() {
    CartoDbLib.clearSearch();
    var address = $("#search_address").val();

    //-----custom filters-------
    //-------end of custom filters--------
    
    if (address != "") {
      if (address.toLowerCase().indexOf(CartoDbLib.locationScope) == -1)
        address = address + " " + CartoDbLib.locationScope;
  
      geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          CartoDbLib.currentPinpoint = [results[0].geometry.location.lat(), results[0].geometry.location.lng()];
          $.address.parameter('address', encodeURIComponent(address));
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

  refreshMap: function() {
    if (CartoDbLib.plowPoints) {
      for(var m=0;m<CartoDbLib.plowPoints.length;m++){
        CartoDbLib.map.removeLayer( CartoDbLib.plowPoints[m] );
      }
      CartoDbLib.plowPoints = [];
    }
    CartoDbLib.drawPlowPoints();
  },

  clearSearch: function(){
    if (CartoDbLib.dataLayer)
      CartoDbLib.map.removeLayer( CartoDbLib.dataLayer );
    if (CartoDbLib.plowPoints) {
      for(var m=0;m<CartoDbLib.plowPoints.length;m++){
        CartoDbLib.map.removeLayer( CartoDbLib.plowPoints[m] );
      }
      CartoDbLib.plowPoints = [];
    }
    if (CartoDbLib.centerMark)
      CartoDbLib.map.removeLayer( CartoDbLib.centerMark );
    if (CartoDbLib.circle)
      CartoDbLib.map.removeLayer( CartoDbLib.circle );

    CartoDbLib.map.setView(new L.LatLng( CartoDbLib.map_centroid[0], CartoDbLib.map_centroid[1] ), CartoDbLib.defaultZoom)
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