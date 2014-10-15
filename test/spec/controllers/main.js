'use strict';

describe('Controller: MainCtrl', function () {

  // load the controller's module
  beforeEach(module('cimonitorApp'));

  var MainCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MainCtrl = $controller('MainCtrl', {
      $scope: scope
    });
  }));

  it('should have something in the scope', function () {
    // no real value with this test
    expect(scope.go).not.toBeUndefined();
    expect(scope.config).not.toBeUndefined();
  });
});
