'use strict';
angular.module('cimonitorApp')
  .factory('goService', ['$location', function($location) {
    return function(path) {
      $location.path(path);
    };
  }])
;

angular.module('cimonitorApp')
  .factory('projectsModel', ['_', function(_) {
    var cleanAll = function() {
      model.all.length = 0; //clear model
    };
    var updateAll = function() {
      cleanAll();
      var values = _.values(model.byUrl);
      _.each(values, function(u) {
        _.each(_.values(u), function(p) {
          model.all.push(p);
        });
      });
    };
    var verifyStatusChanges = function(old, news) {
      if (angular.isUndefined(old)) {
        return ;
      }
      //TODO create directive
      var failEl = document.getElementById('Audiofailure');
      for (var p in old) {
        if (!angular.isUndefined(news[p])) {
          if (!old[p].isFailure && news[p].isFailure) {
            failEl.play(); //Play failure audio
            return;
          }
        }
      }
    };
    var first = function(obj) {
        for (var a in obj){ return obj[a]; }
    };
    var setProjectsStatus = function(url, projects) {
      verifyStatusChanges(model.byUrl[url], projects);
      model.byUrl[url] = projects;
      updateAll();
      var prj = first(projects);
      if (angular.isUndefined(prj)) {
        model.lastUpdate = 'No project returned';
      } else {
        model.lastUpdate = prj.lastUpdate;
      }
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
    };
    var reset = function() {
      model.byUrl = {};
      cleanAll();
    };

    var model = {
      all: [],
      lastUpdate: '',
      error: false,
      byUrl: {},
      loading: false,
      setUrlLoading: setUrlLoading,
      setProjectsStatus: setProjectsStatus,
      displayError: displayError,
      reset: reset
    };
    return model;
  }])
;

angular.module('cimonitorApp')
  .factory('processProjectsService', ['_', 'moment', function(_, moment) {
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
    var buildPredicate = function(search) {
      if(search.length > 0) {
        return function(p) {
          return _.contains(search, p.name);
        };
      } else { // no filter
        return function() { return true; };
      }

    };
    var processProjects = function(jsonData, predicate){
      if (undefinedOrNull(jsonData) || undefinedOrNull(jsonData.Projects) || undefinedOrNull(jsonData.Projects.Project)){
        return null;
      } else {
        var vals =  _.chain(jsonData.Projects.Project)
          .map(normalizeKeys)
          .filter(predicate)
          .map(function(p) {
            return {
              project: p,
              name: p.name,
              isRecent: moment(p.lastBuildTime).add(3, 'minutes').isAfter(moment()),
              lastUpdate: moment().format('MMM, Do HH:mm:ss'),
              show: true,
              loading: false,
              isRunning: p.activity === 'Building',
              isSuccess: p.lastBuildStatus === 'Success',
              isWarning: p.lastBuildStatus === 'Warning',
              isFailure: (p.lastBuildStatus === 'Failure') || (p.lastBuildStatus === 'Exception') || (p.lastBuildStatus === 'Error')
              //$$hashKey: p.name+p.lastBuildTime
            };
        })
        .indexBy('name')
        .value();
        return vals;
      }
    };
    return function(search) {
      var predicate = buildPredicate(search);
      return function(jsonData) {
        return processProjects(jsonData, predicate);
      };
    };
  }])
;

angular.module('cimonitorApp')
  .factory('monitorFetcherService', ['$http', 'x2js', 'processProjectsService', 'projectsModel', 'monitorConfig', '$interval',
  function($http, x2js, processProjectsService, projectsModel, monitorConfig, $interval) {

    var updateSource = function(source) {
      var processProjects = processProjectsService(source.projects);
      var onSuccess = function(data) {
        var jsonData = x2js.xml_str2json(data); // jshint ignore:line
        var results = processProjects(jsonData);
        if (results !== null) {
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
      return $http.get(source.url)
        .success(onSuccess)
        .error(onError);
    };
    var refreshPromise = null;
    var stop = function() {
      if (refreshPromise !== null) {
        console.debug('canceling promise');
        $interval.cancel(refreshPromise);
      }
      refreshPromise = null;
      projectsModel.reset();
    };
    var start = function() {
      var sources = monitorConfig.config.sources;
      var refreshInterval = monitorConfig.config.refreshInterval*1000;
      var refreshFn = function() {
        for (var i in sources) {
          updateSource(sources[i]);
        }
      };
      refreshPromise = $interval(refreshFn, refreshInterval);
      refreshFn();
    };
    var ret = {
      start: start,
      stop: stop
    };

    return ret;
  }])
;

angular.module('cimonitorApp')
  .filter('trustUrl', ['$sce', function ($sce) {
    return function(url) {
      return $sce.trustAsResourceUrl(url);
    };
  }
  ]);

angular.module('cimonitorApp')
  .factory('monitorConfig', ['$localStorage', function($localStorage){
    var addSource = function(){
      obj.config.sources.push({url: '', projects: []});
    };
    var portOldConfig = function(config) {
      if (angular.isUndefined(config.img)) {
        config.img = {
          success: 'images/success_build.png',
          failure: 'images/failure_build.png'
        };
      }
      if (angular.isUndefined(config.audio)) {
        config.audio = {
          success: 'audio/success.mp3',
          failure: 'audio/failure.wav'
        };
      }
      if (!angular.isUndefined(config.audioFailure)) {
        config.audio.failure = config.audioFailure;
        delete config.audioFailure;
      }
      if (!angular.isUndefined(config.audioSuccess)) {
        config.audio.success = config.audioSuccess;
        delete config.audioSuccess;
      }
    };
    var defaultConfig = {
      monitorConfig: {
        refreshInterval: 20,
        audio: {
          success: 'audio/success.mp3',
          failure: 'audio/failure.wav'
        },
        img: {
          success: 'images/success_build.png',
          failure: 'images/failure_build.png'
        },
        sources: [{
          url: 'demo/cctray_sample.xml',
          projects: []
        }]
      }
    };
    var setStorageTo = function(config) {
      obj.config = $localStorage.$reset(config).monitorConfig;
    };
    var resetStorage = function() {
      setStorageTo(defaultConfig);
    };
    var upload = function(str) {
      setStorageTo(angular.fromJson(str));
    };
    var download = function() {
      return angular.toJson({monitorConfig: obj.config}, true);
    };
    var obj = {
      config: $localStorage.$default(defaultConfig).monitorConfig,
      addSource: addSource,
      download: download,
      upload: upload,
      reset: resetStorage
    };
    portOldConfig(obj.config);
    return obj;
  }]);

/**
 * @ngdoc function
 * @name ciMonitorApp.controller:MonitorCtrl
 * @description
 * # MonitorCtrl
 * Controller of the ciMonitorApp
 */
angular.module('cimonitorApp')
  .controller('MonitorCtrl', ['$scope', 'monitorConfig', 'monitorFetcherService', 'goService', 'projectsModel',
    function ($scope, monitorConfig, monitorFetcherService, goService, projectsModel) {
      $scope.projects = projectsModel;
      $scope.config = monitorConfig;
      monitorFetcherService.start();
      $scope.go = goService;
      $scope.$on('$locationChangeStart', function() {
        monitorFetcherService.stop();
      });
      //$scope.$watch('projects.all', function(newValue, oldValue) {
      //if (newValue === oldValue) { return; } // AKA first run
      //console.debug($scope.updated++);
      //});
    }]);