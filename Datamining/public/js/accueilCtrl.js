dataminingApp.controller('accueilCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi', 'Datalog',
	function ($scope, $routeParams, GoogleMapApi, Datalog) {

        var ctx = document.getElementById("myChart");
        var myLineChart;
        var ctx2 = document.getElementById("myChart2");
        var myLineChart2;
		$scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
        $scope.options = {scrollwheel: true};
        $scope.polylines = [];

        $scope.path = [];

        GoogleMapApi.then(function(maps) {
          $scope.polylines = [
                {
                    id: 1,
                    path:  $scope.path,
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


        $scope.changeTemperature = function() {
            Datalog.getByTemperature( { startTemp: $scope.temp.min, endTemp: $scope.temp.max }, function(ob) {
                console.log("data travels received !");
                //données regroupées par trajet
                var dataGroupByJourney = _.groupBy(ob, function(d) { return d.value.substr(0,2) });

                $scope.dataTempTravels = [];
                for (var key in dataGroupByJourney){
                    $scope.dataTempTravels.push({
                        id: key,
                        from: ARRAY_TRAVEL_ASSOCIATION[key].from,
                        to: ARRAY_TRAVEL_ASSOCIATION[key].to
                    });
                }
            });

        };

        $scope.changeHumidity = function() {
            Datalog.getByHumidity( { startHumidity: $scope.humidite.min, endHumidity: $scope.humidite.max }, function(ob) {


            });

        };

        $scope.getDetailsTravel = function(idTravel) {
            if ($scope.path.length > 0) $scope.path = []; //On vide la carte si elle a déja été utilisée

            Datalog.getById( { startId: idTravel, endId: idTravel+"9999999" }, function(ob) {
                console.log("data details received !");

                var lastlat = 0, lastlong = 0;

                for(var i =0; i<(ob.length) ; i++){
                  var p = { latitude: ob[i].value.lat, longitude: ob[i].value.long};

                  if (p.latitude<-180 || p.latitude > 180 || p.longitude<-180 || p.longitude > 180  )
                    continue;
                  if (lastlat != 0 || lastlong != 0)
                  {
                      if (lastlat.toString().substr(0, 5) == p.latitude.toString().substr(0, 5) && lastlong.toString().substr(0, 6) == p.longitude.toString().substr(0, 6))

                      //if (lastlat == p.latitude && lastlong == p.longitude)
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
                $scope.path.push(p);
            }
                console.log("path rempli !");


                $scope.polylines[$scope.polylines.length-1].visible = false;


                $scope.polylines.push(
                {
                    id: 2,
                    path:  $scope.path,
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
                });


            });
        }


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

                    var datasetGyroX = [];
                    var datasetGyroY = [];
                    var datasetGyroZ = [];
                    var labelsChart2 = [];
                    for (var i=0; i<d.length; i++) {
                        if (datasetChartT.length == 0 || (d[i].doc.Temperature != datasetChartT[datasetChartT.length-1]) && d[i].doc.DateHeure*1000 >  labelsChart[labelsChart.length-1].getTime() + 2*60*1000) {
                            datasetChartT.push(d[i].doc.Temperature );
                            datasetChartH.push(d[i].doc.Humidite );
                            labelsChart.push(new Date(d[i].doc.DateHeure*1000));
                        }


                        if (datasetGyroX.length == 0
                            || (d[i].doc.Gyro_roll > datasetGyroX[datasetGyroX.length-1] + 100 || d[i].doc.Gyro_roll < datasetGyroX[datasetGyroX.length-1] - 100)
                            || (d[i].doc.Gyro_pitch > datasetGyroY[datasetGyroY.length-1] + 100 || d[i].doc.Gyro_pitch < datasetGyroY[datasetGyroY.length-1] - 100)
                            || (d[i].doc.Gyro_yaw > datasetGyroZ[datasetGyroZ.length-1] + 100 || d[i].doc.Gyro_yaw < datasetGyroZ[datasetGyroZ.length-1] - 100)
                        ) {
                            datasetGyroX.push(d[i].doc.Gyro_roll);
                            datasetGyroY.push(d[i].doc.Gyro_pitch);
                            datasetGyroZ.push(d[i].doc.Gyro_yaw);
                            labelsChart2.push(new Date(d[i].doc.DateHeure*1000));
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


                    var dataChart2 = {
                        labels: labelsChart2,
                        datasets: [
                            {
                                label: "X",
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
                                data: datasetGyroX,
                            },
                            {
                                label: "Y",
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
                                data: datasetGyroY,
                            },
                            {
                                label: "Z",
                                fill: false,
                                lineTension: 0.9,
                                borderColor: "rgba(125,92,92,1)",
                                borderCapStyle: 'butt',
                                borderDash: [],
                                borderDashOffset: 0.0,
                                borderJoinStyle: 'miter',
                                pointBorderColor: "rgba(125,92,92,1)",
                                pointBackgroundColor: "#fff",
                                pointBorderWidth: 1,
                                pointHoverRadius: 5,
                                pointHoverBackgroundColor: "rgba(125,92,92,1)",
                                pointHoverBorderColor: "rgba(220,220,220,1)",
                                pointHoverBorderWidth: 2,
                                pointRadius: 1,
                                pointHitRadius: 10,
                                data: datasetGyroZ,
                            }

                        ]
                    };

                    if (myLineChart) myLineChart.destroy();
                    if (myLineChart2) myLineChart2.destroy();

                    myLineChart = new Chart(ctx, {
                        type: 'line',
                        data: dataChart2,
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


                    myLineChart2 = new Chart(ctx2, {
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
