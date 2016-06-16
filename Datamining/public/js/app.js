'use strict';

/* App Module */

var dataminingApp = angular.module('dataminingApp', ['ngRoute', 'uiGmapgoogle-maps', 'ui-rangeSlider']);


dataminingApp.config(['$routeProvider',
	function($routeProvider, $locationProvider, uiGmapGoogleMapApiProvider) {
		$routeProvider.
			when('/public/accueil', {
			    templateUrl: 'public/partials/accueil.html',
				controller: 'accueilCtrl'
			}).

            otherwise({
                redirectTo: '/public/accueil'
            });

	}
]);

dataminingApp.config(function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
        key: 'AIzaSyCFjgSBIOCc0eE8kk_hM2GeyK6_oiAeMHw',
        v: '3.20', //defaults to latest 3.X anyhow
        libraries: 'weather,geometry,visualization'
    });
});

