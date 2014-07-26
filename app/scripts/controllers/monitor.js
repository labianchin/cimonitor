'use strict';

angular.module('cimonitorApp')
  .factory('monitorUrl', function($routeParams) {
    var params = {app: $routeParams.app};
    return {
      url: function(){ 
        return 'demo/cctray_sample.xml';
        //return 'ec';
      },
      params: function(){
        return params;
      },
      config: function() {
        return { params: params };
      }
    };
  });

'use strict';
angular.module('cimonitorApp')
  .factory('buildFetcherService', function($http, monitorUrl, x2js, _, moment) {
    var normalizeKeys = function(p) {
      for (var f in p) {
        if (p.hasOwnProperty(f)) {
          var v = p[f];
          var k = f.slice(1);
          delete p[f];
          p[k] = v;
        }
      }
      return p;
    };

    var obj = {
      all: [],
      lastUpdate: '',
      error: false
    };
    var onSuccess = function(data) {
      //TODO check if Projects are defined
      var jsonData = x2js.xml_str2json(data);
      var allProjects = jsonData.Projects.Project;
      obj.all = _.map(allProjects, normalizeKeys);
      obj.lastUpdate = moment().format('MMM, Do HH:mm:ss');
      obj.error = false;
    };
    var onError = function(data, status) {
      obj.error = true;
      obj.errorMessage = 'Failed to load build status';
      console.log('Error loading build status, got status ' + status + ' and data ' + data);
    };

    obj.update = function() {
      return $http.get(monitorUrl.url(), monitorUrl.config())
        .success(onSuccess)
        .error(onError);
    };

    return obj;
  });

'use strict';
angular.module('cimonitorApp')
  .factory('spinningService', function(){
    var obj = {loading: false};
    obj.spin = function(promise) {
      obj.loading = true;
      var end = function() {
        obj.loading = false;
      };
      promise.then(end, end);
    }
    return obj;
  });
'use strict';
/**
 * @ngdoc function
 * @name ciMonitorApp.controller:MonitorCtrl
 * @description
 * # MonitorCtrl
 * Controller of the ciMonitorApp
 */
angular.module('cimonitorApp')
  .controller('MonitorCtrl', function ($scope, $interval, spinningService, buildFetcherService) {
    $scope.builds = buildFetcherService;
    $scope.spinning = spinningService;

    var getBuilds = function () {
      spinningService.spin(buildFetcherService.update());
    };

    getBuilds();

    var timeoutValue = 20000;
    $interval(getBuilds, timeoutValue);
  });
