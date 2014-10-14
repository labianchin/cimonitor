'use strict';

/**
 * @ngdoc overview
 * @name cimonitorApp
 * @description
 * # cimonitorApp
 *
 * Main module of the application.
 */
angular
  .module('cimonitorApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'underscore',
    'angularMoment',
    'cb.x2js',
    'ngStorage',
    'ngIdle'
  ])
  .config(['$routeProvider',
  function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/monitor', {
          controller: 'MonitorCtrl',
          templateUrl: 'views/monitor.html',
          pageKey: 'monitor'
        })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/export', {
        templateUrl: 'views/export.html',
        controller: 'ExportCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  }
  ])
  .config( [
      '$idleProvider', '$keepaliveProvider',
      function( $idleProvider, $keepaliveProvider ) {
        $idleProvider.idleDuration(60); // 1 minutes idle
        $idleProvider.warningDuration(60); // in seconds
        $keepaliveProvider.interval(30); // in seconds
      }
  ])
  .run(['$rootScope', '$idle',
      function($rootScope, $idle) {
        $idle.watch();
        $rootScope.$on('$idleTimeout', function() {
          console.log('idle');
          location.reload();
        });
      }
  ])
  .config( [
      '$compileProvider',
      function( $compileProvider )
      {   
          $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
          // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
      }
  ]);
