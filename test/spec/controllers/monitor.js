'use strict';

describe('Controller: MonitorCtrl', function () {

  // load the controller's module
  beforeEach(module('cimonitorApp'));

  var MonitorCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MonitorCtrl = $controller('MonitorCtrl', {
      $scope: scope
    });
  }));

  it('should have something in the scope', function () {
    // no real value with this test
    console.log(scope);
    expect(scope.projects).not.toBeUndefined();
    expect(scope.config).not.toBeUndefined();
  });
});
