
'use strict';
angular.module('cimonitorApp')
  .factory('goService', ['$location', function($location) {
    return function(path) {
      $location.path(path);
    };
  }]);

'use strict';
angular.module('cimonitorApp')
  .factory('projectsModel', function($http, _, moment) {
    var updateAll = function(){
      var values = _.values(model.byUrl);
      model.all = _.flatten(values, true);
      //for (var url in model.byUrl) {
        //for (var p in model.byUrl[url]) {
          //model.all.push(p);
        //}
      //}
    };
    var setProjectsStatus = function(url, projects) {
      model.byUrl[url] = projects;
      updateAll();
      model.lastUpdate = moment().format('MMM, Do HH:mm:ss');
      model.error = false;
      model.loading = false; // unset gloabl loading
    };
    var displayError = function(msg) {
      model.error = true;
      model.errorMessage = msg;
    };
    var setUrlLoading = function(url) {
      _.each(model.byUrl[url], function(p) { p.loading = true; });
      model.loading = true; //set gloabl loading
      //updateAll();
    };

    var model = {
      all: [],
      lastUpdate: '',
      error: false,
      byUrl: {},
      loading: false,
      setUrlLoading: setUrlLoading,
      setProjectsStatus: setProjectsStatus,
      displayError: displayError
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
          return {
            project: p,
            isRecent: moment(p.lastBuildTime).add(3, 'minutes').isAfter(moment()),
            show: true,
            loading: false,
            isRunning: p.activity === 'Building',
            isSuccess: p.lastBuildStatus === 'Success',
            isFailure: p.activity === 'Exception' || p.activity === 'Exception',
            $$hashKey: p.name+p.lastBuildTime
          };
          return p;
        });
        //console.log(enhanced);
        return enhanced;
      }
    };
    return processProjects;
  });

'use strict';
angular.module('cimonitorApp')
  .factory('buildFetcherService', function($http, x2js, processProjectsService, projectsModel, $interval) {

    var update = function(source) {
      var onSuccess = function(data) {
        var jsonData = x2js.xml_str2json(data);
        var results = processProjectsService(jsonData, []);
        if (results != null) {
          projectsModel.setProjectsStatus(source.url, results);
        } else {
          projectsModel.displayError('Invalid response');
        }
      };
      var onError = function(data, status, headers, config) {
        projectsModel.displayError('Failed to fetch report for "' + config.url + '" got status ' + status);
        console.log('Error fetching report, got status ' + status + ' and data ' + data);
      };
      projectsModel.setUrlLoading(source.url);
      var httpPromise = $http.get(source.url)
        .success(onSuccess)
        .error(onError);
      return httpPromise;
    };
    var callAndKeppTrack = function(fn, delay) {
      fn();
      refreshPromises.push( $interval(fn, delay*1000) );
    };
    var refreshPromises = []; //should be one for source
    var startAutoRefresh = function(sources) {
      stopAutoRefresh();
      for (var i in sources) {
        var source = sources[i];
        callAndKeppTrack(function() {
            update(source);
          }, source.refreshRate);
      }
    };
    var stopAutoRefresh = function() {
      for (var i in refreshPromises) {
        $interval.cancel(refreshPromises[i]);
        console.log('canceling promise');
      }
      refreshPromises = [];
    };
    var ret = {
      update: update,
      startAutoRefresh: startAutoRefresh
    };

    return ret;
  });

'use strict';
angular.module('cimonitorApp')
  .factory('monitorConfig', function($localStorage, buildFetcherService, goService){
    var addSource = function(){
      config.presets.push({});
    };
    var reconfig = function() {
      buildFetcherService.startAutoRefresh(config.presets);
    };
    var defaultSource = {
        url: 'demo/cctray_sample.xml',
        projects: 'nothing here',
        refreshRate: 20
    };
    var defaultStorage = {
        monitorSources: [defaultSource]
      };
    var setStorageTo = function(sources) {
      config.presets = $localStorage.$reset({monitorSources: sources}).monitorSources;
    };
    var resetStorage = function() {
      setStorageTo([defaultSource]);
    };
    var download = function() {
      var url = 'data:plain/text,' + angular.toJson(config.presets);
      window.location.href = url;
    };
    var upload = function(el, $scope) {
      var file = el.files[0];
      console.debug(file);
      var reader = new FileReader();
      reader.onload = function(e) {
        console.debug(e.target.result);
        var parsed = angular.fromJson(e.target.result);
        setStorageTo(parsed);
        console.debug(parsed);
      };
      reader.readAsText(file);
    };
    var config = {
      presets: $localStorage.$default(defaultStorage).monitorSources,
      reconfig: reconfig,
      addSource: addSource,
      download: download,
      upload: upload,
      reset: resetStorage
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
  .controller('MonitorCtrl', function ($scope, monitorConfig, goService, projectsModel) {
    $scope.projects = projectsModel;
    $scope.config = monitorConfig;
    monitorConfig.reconfig();
    $scope.go = goService;
    //$scope.$watch('projects.all', function(newValue, oldValue) {
      //if (newValue === oldValue) { return; } // AKA first run
      //console.debug($scope.updated++);
    //});
  });
