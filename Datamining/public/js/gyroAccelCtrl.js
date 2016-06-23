dataminingApp.controller('gyroAccelCtrl', ['$scope', '$routeParams', 'uiGmapGoogleMapApi', 'Datalog',
    function ($scope, $routeParams, GoogleMapApi, Datalog) {

        var ctxGyro = document.getElementById("chartGyro");
        var myLineChartGyro;
        var ctxAccel = document.getElementById("chartAccel");
        var myLineChartAccel;

        $scope.map = {center: {latitude: 47.845114, longitude: 1.940584 }, zoom: 14 };
        $scope.options = {scrollwheel: true};
        $scope.polylines = [];
        $scope.circles = [];
        var idCircle = 1;
        $scope.path = [];
        $scope.markersGyroTab = [];
        $scope.idMarkerGyro = 1;
        $scope.markersAccelTab = [];
        $scope.idMarkerAccel = 1;

        var data = [];

        $scope.isTravel = false;

        GoogleMapApi.then(function(maps) {
          $scope.polylines = [
                {
                    id: 1,
                    path:  $scope.path,
                    stroke: { color: '#6060FB', weight: 30 },
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


        $scope.listeTravels = [];
        $scope.selectedTravel = 0;
        for (var key in ARRAY_TRAVEL_ASSOCIATION) {
            $scope.listeTravels.push({
                id: key,
                from: ARRAY_TRAVEL_ASSOCIATION[key].from,
                to: ARRAY_TRAVEL_ASSOCIATION[key].to,
            });
        }

        $scope.changeTravel = function() {
            $scope.getDetailsTravel($scope.selectedTravel);
        };

        $scope.getDetailsTravel = function(idTravel) {
            $scope.isTravel = false;
            if ($scope.path.length > 0) $scope.path = []; //On vide la carte si elle a déja été utilisée
            if ($scope.circles.length > 0) $scope.circles = [];


            Datalog.getById( { startId: idTravel, endId: idTravel+"9999999" }, function(ob) {
                console.log("data details received !");

                data = ob;

                //Travel Infos
                $scope.travelInfos = {
                    startTime: formatDate(new Date(ob[0].value.timestamp)),
                    endTime: formatDate(new Date(ob[ob.length-1].value.timestamp)),
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

                    var d = moment.duration(tempsPasseSecondes, 'milliseconds');
                    var hours = Math.floor(d.asHours());
                    var mins = Math.floor(d.asMinutes()) - hours * 60;
                    var tempPasse = hour + ":" + mins;

                    var dataStop = {
                        dateDebutStop: dateDebutStop,
                        dateFinStop: dateFinStop,
                        tempPasse: tempPasse
                    };


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

                //Charts
                displayCharts(ob);

                $scope.isTravel = true;


            });
        }


        var displayCharts = function(data) {

            var datasetGyroX = [];
            var datasetGyroY = [];
            var datasetGyroZ = [];
            var labelsChartGyro = [];

            var datasetAccelX = [];
            var datasetAccelY = [];
            var datasetAccelZ = [];
            var labelsChartAccel = [];

            var seuilGyro = 100;
            if (_.maxBy(data, function(d) { return d.value.gyro_roll }).value.gyro_roll < 300)
                seuilGyro = 80;

            var seuilAccel = 100;
            if (_.maxBy(data, function(d) { return d.value.accel_x }).value.accel_x < 100)
                seuilAccel = 10;

            for (var i=0; i<data.length; i++) {
                if (datasetGyroX.length == 0
                    || (data[i].value.gyro_roll > datasetGyroX[datasetGyroX.length-1] + seuilGyro || data[i].value.gyro_roll < datasetGyroX[datasetGyroX.length-1] - seuilGyro)
                    || (data[i].value.gyro_pitch > datasetGyroY[datasetGyroY.length-1] + seuilGyro || data[i].value.gyro_pitch < datasetGyroY[datasetGyroY.length-1] - seuilGyro)
                    || (data[i].value.gyro_yaw > datasetGyroZ[datasetGyroZ.length-1] + seuilGyro || data[i].value.gyro_yaw < datasetGyroZ[datasetGyroZ.length-1] - seuilGyro)
                ) {
                    datasetGyroX.push(data[i].value.gyro_roll);
                    datasetGyroY.push(data[i].value.gyro_pitch);
                    datasetGyroZ.push(data[i].value.gyro_yaw);
                    labelsChartGyro.push(new Date(data[i].value.timestamp));
                }

                if (datasetAccelX.length == 0
                    || (data[i].value.accel_x > datasetAccelX[datasetAccelX.length-1] + seuilAccel || data[i].value.accel_x < datasetAccelX[datasetAccelX.length-1] - seuilAccel)
                    || (data[i].value.accel_y > datasetAccelY[datasetAccelY.length-1] + seuilAccel || data[i].value.accel_y < datasetAccelY[datasetAccelY.length-1] - seuilAccel)
                    || (data[i].value.accel_z > datasetAccelZ[datasetAccelZ.length-1] + seuilAccel || data[i].value.accel_z < datasetAccelZ[datasetAccelZ.length-1] - seuilAccel)
                ) {
                    datasetAccelX.push(data[i].value.accel_x);
                    datasetAccelY.push(data[i].value.accel_y);
                    datasetAccelZ.push(data[i].value.accel_z);
                    labelsChartAccel.push(new Date(data[i].value.timestamp));
                }
            }

            var dataChartGyro = {
                labels: labelsChartGyro,
                datasets: [
                    {
                        label: "Gyroscope roll",
                        fill: false,
                        lineTension: 0.5,
                        borderColor: "rgba(75,192,192,1)",
                        pointBorderColor: "rgba(75,192,192,1)",
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
                        label: "Gyroscope pitch",
                        fill: false,
                        lineTension: 0.9,
                        borderColor: "rgba(125,92,192,1)",
                        pointBorderColor: "rgba(125,92,192,1)",
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
                        label: "Gyroscope yaw",
                        fill: false,
                        lineTension: 0.9,
                        borderColor: "rgba(125,92,92,1)",
                        pointBorderColor: "rgba(125,92,92,1)",
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

            var dataChartAccel = {
                labels: labelsChartAccel,
                datasets: [
                    {
                        label: "Accélération X",
                        fill: false,
                        lineTension: 0.5,
                        borderColor: "rgba(75,192,192,1)",
                        pointBorderColor: "rgba(75,192,192,1)",
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: "rgba(75,192,192,1)",
                        pointHoverBorderColor: "rgba(220,220,220,1)",
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        data: datasetAccelX,
                    },
                    {
                        label: "Accélération Y",
                        fill: false,
                        lineTension: 0.9,
                        borderColor: "rgba(125,92,192,1)",
                        pointBorderColor: "rgba(125,92,192,1)",
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: "rgba(125,92,192,1)",
                        pointHoverBorderColor: "rgba(220,220,220,1)",
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        data: datasetAccelY,
                    },
                    {
                        label: "Accélération Z",
                        fill: false,
                        lineTension: 0.9,
                        borderColor: "rgba(125,92,92,1)",
                        pointBorderColor: "rgba(125,92,92,1)",
                        pointBorderWidth: 1,
                        pointHoverRadius: 5,
                        pointHoverBackgroundColor: "rgba(125,92,92,1)",
                        pointHoverBorderColor: "rgba(220,220,220,1)",
                        pointHoverBorderWidth: 2,
                        pointRadius: 1,
                        pointHitRadius: 10,
                        data: datasetAccelZ,
                    }

                ]
            };



            if (myLineChartGyro) myLineChartGyro.destroy();
            if (myLineChartAccel) myLineChartAccel.destroy();

            myLineChartGyro = new Chart(ctxGyro, {
                type: 'line',
                data: dataChartGyro,
                options: {
                    scales: {
                        xAxes: [{
                            type: 'time',
                            time: { displayFormats: { quarter: 'h:mm:ss ll MMM YYYY' } }
                        }]
                    }
                }
            });

            myLineChartAccel = new Chart(ctxAccel, {
                type: 'line',
                data: dataChartAccel,
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


        $scope.displayGyro = function() {

            $scope.markersGyroTab = [];
            $scope.markersAccelTab = [];

            if (!$scope.seuilpitch) $scope.seuilpitch = -40000;
            if (!$scope.seuilroll) $scope.seuilroll = -40000;
            if (!$scope.seuilyaw) $scope.seuilyaw = -40000;

            var dataSeuilDepasse = _.filter(data, function(o) {
                return o.value.gyro_pitch >= $scope.seuilpitch
                    && o.value.gyro_roll >= $scope.seuilroll
                    && o.value.gyro_yaw >= $scope.seuilyaw
                 }
            );

            $scope.markersGyroTab = dataSeuilDepasse.map(function(data) {
                $scope.idMarkerGyro++;
                return { id: $scope.idMarkerGyro, latitude: data.value.lat, longitude: data.value.long, icon: "public/images/circle_red.png" };
            });

        };

        $scope.displayAccel = function() {

            $scope.markersGyroTab = [];
            $scope.markersAccelTab = [];

            if (!$scope.seuilx) $scope.seuilx = -40000;
            if (!$scope.seuily) $scope.seuily = -40000;
            if (!$scope.seuilz) $scope.seuilz = -40000;

            var dataSeuilDepasse = _.filter(data, function(o) {
                return o.value.accel_x >= $scope.seuilx
                    && o.value.accel_y >= $scope.seuily
                    && o.value.accel_z >= $scope.seuilz
                 }
            );

            $scope.markersAccelTab = dataSeuilDepasse.map(function(data) {
                $scope.idMarkerAccel++;
                return { id: $scope.idMarkerAccel, latitude: data.value.lat, longitude: data.value.long, icon: "public/images/circle_blue.png" };
            });


        };

    }
]);


