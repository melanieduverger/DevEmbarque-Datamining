dataminingApp.controller('accueilCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi', 'Datalog',
	function ($scope, $routeParams, GoogleMapApi, Datalog) {

        var ctx = document.getElementById("myChart");
        var myLineChart;
		$scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
        $scope.options = {scrollwheel: true};
        $scope.polylines = [];

    var path = [];

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

		$scope.temp = { min: 10, max: 30 };
		$scope.humidite = { min: 20, max: 60 };

        $scope.updateTemperatureHumidity = function() {
            listeKeys = []; //création des combinaisons possibles température/humidité
            for(var i= $scope.temp.min; i <= $scope.temp.max; i++) {
                for(var j = $scope.humidite.min; j <= $scope.humidite.max; j++) {
                    listeKeys.push([i, j]);
                }
            }
            listeKeys = JSON.stringify(listeKeys)

             if (path.length > 0) path = [];


            Datalog.getByTemperatureAndHumidity( {listeKeys: listeKeys}, function(ob) {



                console.log("data received !");

                var d = _.orderBy(ob, ['doc.id'], ['asc']);

                console.log("data order by !");

                    /*var data2 = [];
                    for (var i=0; i<ob.length; i++) {
                        data2.push([ob[i].value.lat, ob[i].value.long]);
                    }

                    console.log(data2);


                    var result = ml.kmeans.cluster({
                        data : data2,
                        k : 4,
                        epochs: 100,
                        init_using_data : true, // this is default
                        distance : {type : "euclidean"}
                    });

                    console.log("clusters : ", result.clusters);

                    for (var i=0; i< result.clusters.length; i++) {
                        if (result.clusters[i].length > 100) {


                            for (var j=0; j<result.clusters[i].length; j++) {
                                 path.push({ latitude: data2[result.clusters[i][j]][0], longitude: data2[result.clusters[i][j]][1] });
                            }
                        }
                    }*/


                    var lastlat = 0, lastlong = 0;

                    for(var i =0; i<(d.length) ; i++){
                      var p = { latitude: d[i].value.lat, longitude: d[i].value.long};

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
                    console.log("path rempli !");


                    var datasetChartT = [];
                    var datasetChartH = [];
                    var labelsChart = [];
                    for (var i=0; i<d.length; i++) {
                        if (datasetChartT.length == 0 || (d[i].doc.Temperature != datasetChartT[datasetChartT.length-1]) && d[i].doc.DateHeure*1000 >  labelsChart[labelsChart.length-1].getTime() + 2*60*1000) {
                            datasetChartT.push(d[i].doc.Temperature );
                            datasetChartH.push(d[i].doc.Humidite );
                            labelsChart.push(new Date(d[i].doc.DateHeure*1000));
                        }

                    }

                    var dataChart = {
                        labels: labelsChart,
                        datasets: [
                            {
                                label: "Évolution de la température",
                                fill: false,
                                lineTension: 0.5,
                                borderColor: "rgba(75,192,192,1)",
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderDashOffset: 0.0,
                                borderJoinStyle: 'miter',
                                pointBorderColor: "rgba(75,192,192,1)",
                                pointBackgroundColor: "#fff",
                                pointBorderWidth: 1,
                                pointHoverRadius: 5,
                                pointHoverBackgroundColor: "rgba(75,192,192,1)",
                                pointHoverBorderColor: "rgba(220,220,220,1)",
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 10,
                                data: datasetChartT,
                            },
                            {
                                label: "Évolution du taux d'humidité",
                                fill: false,
                                lineTension: 0.9,
                                borderColor: "rgba(125,92,192,1)",
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderDashOffset: 0.0,
                                borderJoinStyle: 'miter',
                                pointBorderColor: "rgba(125,92,192,1)",
                                pointBackgroundColor: "#fff",
                                pointBorderWidth: 1,
                                pointHoverRadius: 5,
                                pointHoverBackgroundColor: "rgba(125,92,192,1)",
                                pointHoverBorderColor: "rgba(220,220,220,1)",
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 10,
                                data: datasetChartH,
                            }

                        ]
                    };

                    if (myLineChart) myLineChart.destroy();

                    myLineChart = new Chart(ctx, {
                        type: 'line',
                        data: dataChart,
                        options: {
                            scales: {
                                xAxes: [{
                                    type: 'time',
                                    time: {
                                        displayFormats: {
                                            quarter: 'h:mm:ss ll MMM YYYY'
                                        }
                                    }
                                }]
                            }
                        }
                    });




            });
        }
	}
]);

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = '' + d.getFullYear(),
        hour = '' + d.getHours(),
        minuts = '' + d.getMinutes();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    if (hour.length < 2) hour = '0' + hour;
    if (minuts.length < 2) minuts = '0' + minuts;

    return hour + ":" + minuts + " " + day + "/" + month + "/" + year;
}
