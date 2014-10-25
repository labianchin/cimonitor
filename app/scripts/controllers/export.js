'use strict';

angular.module('cimonitorApp')
  .factory('monitorExport', ['monitorConfig', 'goService', function(monitorConfig, goService){
    var prepare = function() {
      obj.exportString = monitorConfig.download();
    };
    var load = function() {
      monitorConfig.upload(obj.exportString);
      goService('/');
    };
    var obj = {
      exportString: '',
      prepare: prepare,
      load: load
    };
    return obj;
  }]);
/**
 * @ngdoc function
 * @name cimonitorApp.controller:ExportCtrl
 * @description
 * # ExportCtrl
 * Controller of the cimonitorApp
 */
angular.module('cimonitorApp')
  .controller('ExportCtrl', ['$scope', 'monitorExport', function ($scope, monitorExport) {
    $scope.export = monitorExport;
    monitorExport.prepare();
  }]);
