'use strict';

angular.module('cimonitorApp')
  .factory('monitorUrl', function() {
    var params = {};//{app: $routeParams.app};
    return {
      url: function(source){
        return source.url;
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
  .factory('goService', ['$location', function($location) {
    return function(path) {
      $location.path(path);
    };
  }]);

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
    var undefinedOrNull = function(val) {
      return angular.isUndefined(val) || val === null;
    };
    var makeError = function(msg) {
      obj.error = true;
      obj.errorMessage = msg;
    };
    var filterProjects = function(all, search) {
      if(search.length > 0) {
        return _.filter(all, function(p){
          return _.contains(search, p.name);
        });
      } else { // no filter
        return all;
      }
    };
    var processProjects = function(jsonData, search){
      if (undefinedOrNull(jsonData) || undefinedOrNull(jsonData.Projects) || undefinedOrNull(jsonData.Projects.Project)){
        makeError('Invalid response');
        return null;
      } else {
        var normalized = _.map(jsonData.Projects.Project, normalizeKeys);
        var filtered = filterProjects(normalized, search);
        var enhanced =_.map(filtered, function(p) {
          p.isRecent = moment(p.lastBuildTime).add(10, 'minutes').isAfter(moment());
          return p;
        });
        return enhanced;
      }
    };
    var onSuccess = function(data) {
      var jsonData = x2js.xml_str2json(data);
      var results = processProjects(jsonData, []);
      if (results != null) {
        obj.all = results;
        obj.lastUpdate = moment().format('MMM, Do HH:mm:ss');
        obj.error = false;
      }
    };
    var onError = function(data, status) {
      makeError('Failed to load build status');
      console.log('Error loading build status, got status ' + status + ' and data ' + data);
    };

    obj.update = function(source) {
      return $http.get(monitorUrl.url(source), monitorUrl.config())
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
    var defaultSource = 
        {
        url: 'demo/cctray_sample.xml',
        projects: 'nothing here',
        refreshRate: 20
        };
    var addSource = function(){
      config.presets.push({});
      console.debug(config);
    };
    var reconfig = function() {
      console.log("config changed!!");
      console.debug(config);
      if (refreshPromise != null) {
        $interval.cancel(refreshPromise);
      }
      getBuilds();
      refreshPromise = $interval(getBuilds, config.presets[0].refreshRate*1000);
    };
    var getBuilds = function () {
      spinningService.spin(buildFetcherService.update(config.presets[0]));
    };
    var refreshPromise = null;
    var config = {
      presets: [defaultSource],
      reconfig: reconfig,
      addSource: addSource
    };
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
  .controller('MonitorCtrl', function ($scope, $interval, spinningService, buildFetcherService, monitorConfig, goService) {
    $scope.builds = buildFetcherService;
    $scope.spinning = spinningService;
    $scope.config = monitorConfig;
    monitorConfig.reconfig();
    $scope.go = goService;
  });
