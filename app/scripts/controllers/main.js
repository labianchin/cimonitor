'use strict';

/**
 * @ngdoc function
 * @name cimonitorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the cimonitorApp
 */
angular.module('cimonitorApp')
  .controller('MainCtrl', function ($scope, monitorConfig, goService) {
    $scope.config = monitorConfig;
    $scope.go = goService;
  });
