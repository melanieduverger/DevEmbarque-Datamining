dataminingApp.factory('Datalog', [ '$resource', function($resource) {

    var Methods = {
        'getAll': {
            'method':'GET',
            'url':'http://'+ DATABASE_IP +':' + DATABASE_PORT + '/' + DATABASE_NAME + '/_all_docs',
            'params': {
                'include_docs':true
            },
            'isArray':true,
            'transformResponse':function(data) {
                var returnOb = angular.fromJson(data);
                return returnOb.rows;
            }
        },

        'getByTemperature': {
            'method':'GET',
            'url': 'http://'+ DATABASE_IP +':' + DATABASE_PORT + '/' + DATABASE_NAME + '/_design/queries/_view/getByTemperature?startkey=:startTemp&endkey=:endTemp',
            'params': {
                'include_docs':true
            },
            'isArray':true,
            'transformResponse':function(data) {
                var returnOb = angular.fromJson(data);
                return returnOb.rows;
            }
        },

        'getByHumidity': {
            'method':'GET',
            'url': 'http://'+ DATABASE_IP +':' + DATABASE_PORT + '/' + DATABASE_NAME + '/_design/queries/_view/getByHumidity?startkey=:startHumidity&endkey=:endHumidity',
            'params': {
                'include_docs':true
            },
            'isArray':true,
            'transformResponse':function(data) {
                var returnOb = angular.fromJson(data);
                return returnOb.rows;
            }
        },

        'getByTemperatureAndHumidity': {
            'method':'GET',
            'url': 'http://'+ DATABASE_IP +':' + DATABASE_PORT + '/' + DATABASE_NAME + '/_design/queries/_view/getByTemperatureAndHumidity?keys=:listeKeys',
            'params': {
                'include_docs':true
            },
            'isArray':true,
            'transformResponse':function(data) {
                var returnOb = angular.fromJson(data);
                return returnOb.rows;
            }
        }
    };

    var Datalog = $resource('http://'+ DATABASE_IP +':' + DATABASE_PORT + '/' + DATABASE_NAME + '/:id',{'id':'@id'},Methods);

    return Datalog;
}]);