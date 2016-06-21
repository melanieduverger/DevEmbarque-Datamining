dataminingApp.controller('accueilCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi',
	function ($scope, $routeParams, GoogleMapApi) {

		$scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
    $scope.options = {scrollwheel: true};
    $scope.polylines = [];

    var rg = new RegExp(/\d{4,5}\.\d{5}[NOES]/g)

    var convertCoord = function(i){
      if (!i.match(rg))
        return null;
      var value = parseFloat(i.substring(0,i.length-1));
      var d = Math.floor(value / 100);
      var m = value - d * 100;

      return d + (m *60)/3600;
    }

    var createPolyline = function(i){
      var latitude = convertCoord(test2['DATA'][i].Latitude);
      var longitude = convertCoord(test2['DATA'][i].Longitude);
     
      var ret = {
        latitude: latitude,
        longitude: longitude
      };
      return ret;
    }

    var path = [];
    var lastlat = 0, lastlong = 0;
    for(var i =0; i<(test2['DATA'].length) ; i++){
      var p = createPolyline(i);
      if (isNaN(p.latitude) || isNaN(p.longitude))
        continue;
      if (p.latitude<-180 || p.latitude > 180 || p.longitude<-180 || p.longitude > 180  )
        continue;
      if (lastlat != 0 || lastlong != 0)
      {
          if (lastlat == p.latitude && lastlong == p.longitude)
          continue;
      }
      var toadd = true;
        if (i != 0 && Math.abs(p.latitude - lastlat) > 0.2)
          toadd = false;
        if (i != 0 && Math.abs(p.longitude - lastlong) > 0.2)
          toadd = false;
     
     if (!toadd)
        continue;
        lastlat = p.latitude;
        lastlong = p.longitude;
        path.push(p);
    }

    GoogleMapApi.then(function(maps) {
      $scope.polylines = [
            {
                id: 1,
                path:  path,
                stroke: { color: '#6060FB', weight: 1 },
                editable: false,
                draggable: false,
                geodesic: true,
                visible: true,
                icons: [{
                    icon: {
                        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
                    },
                    offset: '25px',
                    repeat: '50px'
                }]
            }
        ];
    });

		$scope.temp = {
			min: 10,
			max: 30
		};

		$scope.humidite = {
			min: 20,
			max: 60
		};
	}
]);