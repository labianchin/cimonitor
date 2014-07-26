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
    'cb.x2js'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/monitor/:app', {
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
  });
