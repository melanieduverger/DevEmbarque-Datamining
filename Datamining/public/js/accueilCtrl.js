dataminingApp.controller('accueilCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi', 'Datalog',
    function ($scope, $routeParams, GoogleMapApi, Datalog) {

        $('#myTable').on('click', '.clickable-row', function(event) {
          $(this).addClass('active').siblings().removeClass('active');
        });
        $('#myTable2').on('click', '.clickable-row', function(event) {
          $(this).addClass('active').siblings().removeClass('active');
        });

        $scope.tabHumidVide = true;
        $scope.tabTempVide = true;

        var ctx = document.getElementById("chart");
        var myLineChart;
		$scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
        $scope.options = {scrollwheel: true};
        $scope.polylines = [];

        $scope.circles = [];
        var idCircle = 1;

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
                if($scope.dataTempTravels.length > 0) $scope.tabTempVide = false;
                else $scope.tabTempVide = true;
            });

        };

        $scope.changeHumidity = function() {
            Datalog.getByHumidity( { startHumidity: $scope.humidite.min, endHumidity: $scope.humidite.max }, function(ob) {
                console.log("data travels received !");
                //données regroupées par trajet
                var dataGroupByJourney = _.groupBy(ob, function(d) { return d.value.substr(0,2) });

                $scope.dataHumidityTravels = [];
                for (var key in dataGroupByJourney){
                    $scope.dataHumidityTravels.push({
                        id: key,
                        from: ARRAY_TRAVEL_ASSOCIATION[key].from,
                        to: ARRAY_TRAVEL_ASSOCIATION[key].to
                    });
                }
                if($scope.dataHumidityTravels.length > 0) $scope.tabHumidVide = false;
                else $scope.tabHumidVide = true;
            });

        };

        $scope.getDetailsTravel = function(idTravel) {
            if ($scope.path.length > 0) $scope.path = []; //On vide la carte si elle a déja été utilisée
            if ($scope.circles.length > 0) $scope.circles = [];


            Datalog.getById( { startId: idTravel, endId: idTravel+"9999999" }, function(ob) {
                console.log("data details received !");

                //Travel Infos
                $scope.travelInfos = {
                    startTime: formatDate(new Date(ob[0].value.timestamp*1000)),
                    endTime: formatDate(new Date(ob[ob.length-1].value.timestamp*1000)),
                    minTemp : _.minBy(ob, function(o) { return o.value.temperature; }).value.temperature,
                    maxTemp: _.maxBy(ob, function(o) { return o.value.temperature; }).value.temperature,
                    meanTemp: _.meanBy(ob, function(o) { return o.value.temperature; }).toString().substr(0,5),
                    minHum : _.minBy(ob, function(o) { return o.value.humidity; }).value.humidity,
                    maxHum: _.maxBy(ob, function(o) { return o.value.humidity; }).value.humidity,
                    meanHum: _.meanBy(ob, function(o) { return o.value.humidity; }).toString().substr(0,5),
                }

                //Carte
                var lastlat = 0, lastlong = 0;
                var arrayLatLong = [];
                var lastindex = -1;
                var stopstartends =[];

                console.log("group");
                for (var i = 0 ; i < (ob.length) ; i++)
                {
                    var obj = ob[i];
                    if (lastlat == obj.value.lat && lastlong == obj.value.long)
                    {
                    }
                    else
                    {
                        if (obj.value.lat <-180 || obj.value.lat > 180 || obj.value.long <-180 || obj.value.long > 180  )
                            continue;
                        var toadd = true;
                        if (lastlat != 0 || lastlong != 0)
                        {
                            if (lastlat == obj.value.lat && lastlong == obj.value.long)
                                continue;
                            if (i != 0 && Math.abs(obj.value.lat - lastlat) > 0.05)
                                toadd = false;
                            if (i != 0 && Math.abs(obj.value.long - lastlong) > 0.05)
                                toadd = false;
                        }
                        if (toadd)
                        {
                            lastlat = obj.value.lat;
                            lastlong = obj.value.long;
                            arrayLatLong.push({latitude : obj.value.lat , longitude : obj.value.long, corresp : [obj]});
                        }
                        else
                        {
                            console.log("non ajouté");
                        }
                    }
                }
                lastlat = 0, lastlong = 0;

                var DIST_STOP =  0.025;
                var DIST_OUT = 0.07;
                console.log ("detection stop");
                for (var i = 0 ; i < arrayLatLong.length - 30 ; i+=50)
                {
                    var midlat = 0 , midlng = 0;
                    for (var j = 0 ; j < 30 ; j++)
                    {
                        midlat+=arrayLatLong[i+j].latitude;
                        midlng+=arrayLatLong[i+j].longitude;
                    }
                    midlat= midlat/30;
                    midlng= midlng/30;
                    var stopdetected = true;
                    console.log("index at " + i);
                    for (var j = 0 ; j < 30 ; j++)
                    {
                        var dist = distanceBetweenPoints({latitude : midlat,longitude : midlng}, arrayLatLong[i+j]);
                        if (dist > DIST_STOP) stopdetected = false;
                    }
                    if (stopdetected)
                    {
                        var startindex = -1, endindex = -1;
                        var delay = 3;
                        var buffer = 0;
                        var index = i;
                        var continuetest = true;
                        console.log("stop detected");
                        do {
                            var dist = distanceBetweenPoints({latitude : midlat,longitude : midlng}, arrayLatLong[index]);
                            if (dist < DIST_STOP){
                                if (delay > 0) {
                                    delay--;
                                } else {
                                    if (startindex < 0)
                                        startindex = index;
                                    if (startindex < 10)
                                        startindex = 0;
                                }
                                if (buffer > 0)
                                    buffer --;
                            }
                            else
                            {
                                if (dist > DIST_OUT)
                                {
                                        endindex = index - 3 - buffer;
                                        continuetest = false;
                                }
                                else if (buffer > 2)
                                {
                                    if (index - startindex > 6)
                                    {
                                        endindex = index - 6;
                                    }
                                    else
                                    {
                                        console.warn("ne devrait jamais arriver");
                                        endindex = index;
                                    }
                                    console.log(dist);
                                    continuetest = false;
                                }
                                else
                                {
                                    buffer++;
                                }
                            }
                            index++;
                        }while (continuetest && index < arrayLatLong.length);
                        if (endindex == -1) endindex = index-1;
                        continuetest = true;// récupération des valeurs avant le startindex
                        index = endindex;

                        var maxloop = 50;
                        do{
                            var dist = distanceBetweenPoints({latitude : midlat,longitude : midlng}, arrayLatLong[index]);
                            if (dist > DIST_STOP)
                            {
                                startindex = index +3;
                                continuetest = false;
                            }
                            index--;
                        }while(continuetest && index > 0 && maxloop-- > 0);
                        console.log("start at " + startindex + " end at " + endindex + " : " + index + " for " + arrayLatLong.length);
                        stopstartends.push({start:startindex,stop:endindex});
                        i = endindex;
                    }
                }
                for (var i = 0 ; i < arrayLatLong.length ; i++)
                {
                    var toadd = true;
                    for (var j = 0 ; j < stopstartends.length; j++)
                        if ( i < stopstartends[j].stop && i > stopstartends[j].start)
                            toadd = false;

                    if (i != 0
                        && arrayLatLong[i-1].latitude.toString().substr(0,5) == arrayLatLong[i].latitude.toString().substr(0,5)
                        && arrayLatLong[i-1].longitude.toString().substr(0,5) == arrayLatLong[i].longitude.toString().substr(0,5)
                    )
                        toadd = false;

                    if (toadd)
                      $scope.path.push({ latitude: arrayLatLong[i].latitude, longitude: arrayLatLong[i].longitude });
                }

                console.log("path rempli ! " + $scope.path.length);


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

                for (var i=0; i<stopstartends.length; i++) {

                    var dateDebutStop = arrayLatLong[stopstartends[i].start].corresp[0].value.timestamp;
                    var dateFinStop = arrayLatLong[stopstartends[i].stop].corresp[0].value.timestamp;
                    var tempsPasseSecondes = dateFinStop - dateDebutStop;


                    $scope.circles.push({
                        id: idCircle,
                        center: { latitude: arrayLatLong[stopstartends[i].start].latitude, longitude: arrayLatLong[stopstartends[i].start].longitude },
                        radius: 50,
                        stroke: { color: '#08B21F', weight: 2, opacity: 1 },
                        fill: { color: '#08B21F', opacity: 0.5 },
                        geodesic: true, // optional: defaults to false
                        clickable: true, // optional: defaults to true
                        visible: true, // optional: defaults to true
                        control: {}
                    });
                    idCircle++;
                }


                //Chart
                displayTemperatureHumidityChart(ob);
            });
        }

        var displayTemperatureHumidityChart = function(data) {

            var datasetChartT = [];
            var datasetChartH = [];
            var labelsChart = [];

            for (var i=0; i<data.length; i++) {
                if (datasetChartT.length == 0 || (data[i].value.temperature != datasetChartT[datasetChartT.length-1]) && data[i].value.timestamp*1000 >  labelsChart[labelsChart.length-1].getTime() + 2*60*1000) {
                    datasetChartT.push(data[i].value.temperature );
                    datasetChartH.push(data[i].value.humidity );
                    labelsChart.push(new Date(data[i].value.timestamp*1000));
                }
            }

            var dataChart = {
                labels: labelsChart,
                datasets: [
                    {
                        label: "Évolution de la température (°C)",
                        fill: false,
                        lineTension: 0.1,
                        borderColor: "rgba(75,192,192,1)",
                        pointBorderColor: "rgba(75,192,192,1)",
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
                        label: "Évolution du taux d'humidité (%)",
                        fill: false,
                        lineTension: 0.1,
                        borderColor: "rgba(125,92,192,1)",
                        pointBorderColor: "rgba(125,92,192,1)",
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
                            time: { displayFormats: { quarter: 'h:mm:ss ll MMM YYYY' } }
                        }]
                    }
                }
            });
        };


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

    return day + "/" + month + "/" + year + " à " + hour + ":" + minuts;
}


function distanceBetweenPoints(p1,p2) {
    var R=6371,
        dLat=(p2.latitude-p1.latitude)*Math.PI/180,
        dLon=(p2.longitude-p1.longitude)*Math.PI/180,
        a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(p1.latitude*Math.PI/180)*Math.cos(p2.latitude*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2),
        c=2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a)),
        d=R*c;
    return d;
}
