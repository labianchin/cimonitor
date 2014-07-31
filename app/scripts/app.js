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
    'ngStorage'
  ])
  .config(function ($routeProvider) {
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
      .otherwise({
        redirectTo: '/'
      });
  })
  .config( [
      '$compileProvider',
      function( $compileProvider )
      {   
          $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|data):/);
          // Angular before v1.2 uses $compileProvider.urlSanitizationWhitelist(...)
      }
  ]);
