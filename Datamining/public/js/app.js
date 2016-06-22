'use strict';

/* App Module */

var dataminingApp = angular.module('dataminingApp', ['ngRoute', 'uiGmapgoogle-maps', 'ui-rangeSlider', 'ngResource']);


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


//var DATABASE_IP = "192.168.127.137";
var DATABASE_PORT = "5984";

var DATABASE_IP = "10.145.128.79";
//var DATABASE_PORT = "5986"; //nginx

//var DATABASE_IP = "192.168.71.162";



//var DATABASE_NAME = "datalog";
var DATABASE_NAME = "datalogtest";


var ARRAY_TRAVEL_ASSOCIATION = {
    24: { from: "Orléans", to: "Aix-en-Provence" },
    25: { from: "Orléans", to: "Strasbourg" },
    26: { from: "Pau", to: "Saint Nazaire" },
    29: { from: "Pau", to: "Rouen" }
};

