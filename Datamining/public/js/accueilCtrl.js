dataminingApp.controller('accueilCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi',
	function ($scope, $routeParams, GoogleMapApi) {

		$scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
    $scope.options = {scrollwheel: true};

    $scope.marker = {
      id: 0,
      coords: {
        latitude: 47.845114,
        longitude: 1.960584
      },
    };

        $scope.marker2 = {
      id: 1,
      coords: {
        latitude: 47.825114,
        longitude: 1.960584
      }
    };

    // uiGmapGoogleMapApi is a promise.
    // The "then" callback function provides the google.maps object.
    GoogleMapApi.then(function(maps) {

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