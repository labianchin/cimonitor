'use strict';

angular.module('cimonitorApp')
  .factory('monitorUrl', function() {
    var params = {};//{app: $routeParams.app};
    return {
      url: function(config){
        //return $routeParams.app;
        return config.url;
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

    obj.update = function(config) {
      return $http.get(monitorUrl.url(config), monitorUrl.config())
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
angular.module('cimonitorApp')
  .factory('monitorConfig', function($interval, spinningService, buildFetcherService){

    var config = {
      url: 'demo/cctray_sample.xml',
      projects: 'nothing here',
      refreshRate: 20,
      reconfig: null
    };
    config.reconfig = function() {
      console.log("config changed!!");
      console.debug(config);
      if (refreshPromise != null) {
        $interval.cancel(refreshPromise);
      }
      getBuilds();
      refreshPromise = $interval(getBuilds, config.refreshRate*1000);
    };
    var getBuilds = function () {
      spinningService.spin(buildFetcherService.update(config));
    };
    var refreshPromise = null;
    return config;
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
  .controller('MonitorCtrl', function ($scope, $interval, spinningService, buildFetcherService, monitorConfig) {
    $scope.builds = buildFetcherService;
    $scope.spinning = spinningService;
    $scope.config = monitorConfig;
    monitorConfig.reconfig();
  });
