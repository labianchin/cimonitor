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
  .factory('projectsModel', function($http, monitorUrl, x3js, _, moment) {
    var updateAll = function(){
      var values = _.values(model.byUrl);
      obj.all = _.flatten(values, true);
    };
    var setProjectStatus = function(url, builds){
      builds.byUrl[url] = builds;
      updateAll();
    };

    var model = {
      all: [],
      lastUpdate: '',
      error: false,
      byUrl: {},
      setProjectStatus: setProjectStatus
    };
    return model;
  });

'use strict';
angular.module('cimonitorApp')
  .factory('processProjectsService', function(_, moment) {
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
    var undefinedOrNull = function(val) {
      return angular.isUndefined(val) || val === null;
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
        return null;
      } else {
        var normalized = _.map(jsonData.Projects.Project, normalizeKeys);
        var filtered = filterProjects(normalized, search);
        var enhanced =_.map(filtered, function(p) {
          p.isRecent = moment(p.lastBuildTime).add(10, 'minutes').isAfter(moment());
          return p;
        });
        console.log(enhanced);
        return enhanced;
      }
    };
    return processProjects
  });

'use strict';
angular.module('cimonitorApp')
  .factory('buildFetcherService', function($http, $timeout, monitorUrl, x2js, _, moment, processProjectsService) {

    var obj = {
      all: [],
      lastUpdate: '',
      error: false
    };
    var makeError = function(msg) {
      obj.error = true;
      obj.errorMessage = msg;
    };
    var onSuccess = function(data) {
      var jsonData = x2js.xml_str2json(data);
      var results = processProjectsService(jsonData, []);
      if (results != null) {
        /* Wraps to call $angular.$apply */
        $timeout(function(){
          obj.lastUpdate = moment().format('MMM, Do HH:mm:ss');
          obj.error = false;
          obj.all = results;
          //if (typeof ret.callRefresh !== "undefined" && ret.callRefresh !== null) { callRefresh(); }
        }, 100);
      } else {
        makeError('Invalid response');
      }
    };
    var onError = function(data, status, headers, config) {
      makeError('Failed to fetch report for "' + config.url + '" got status ' + status);
      console.log('Error fetching report, got status ' + status + ' and data ' + data);
    };

    var update = function(source) {
      return $http.get(monitorUrl.url(source), monitorUrl.config())
        .success(onSuccess)
        .error(onError);
    };
    var ret = {obj: obj, update: update, callRefresh: null};

    return ret;
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
    var addSource = function(){
      config.presets.push({});
      console.debug(config);
    };
    var refreshPromise = null;
    var reconfig = function() {
      console.log("config changed!!");
      console.debug(config);
      if (refreshPromise != null) {
        $interval.cancel(refreshPromise);
        console.log('canceling promise');
      }
      var getBuilds = function () {
        spinningService.spin(buildFetcherService.update(config.presets[0]));
      };
      getBuilds();
      refreshPromise = $interval(getBuilds, config.presets[0].refreshRate*1000);
    };
    var defaultSource = {
        url: 'demo/cctray_sample.xml',
        projects: 'nothing here',
        refreshRate: 20
    };
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
    $scope.builds = buildFetcherService.obj;
    buildFetcherService.callRefresh = function(){ $scope.apply(); console.log('refreshed');};
    $scope.spinning = spinningService;
    $scope.config = monitorConfig;
    monitorConfig.reconfig();
    $scope.go = goService;
    $scope.updated = 1;
    $scope.$watch('builds.all', function(newValue, oldValue) {
      if (newValue === oldValue) { return; } // AKA first run
      console.debug($scope.updated++);
    });
  });
