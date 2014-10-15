'use strict';

describe('Controller: MonitorctrlCtrl', function () {

  // load the controller's module
  beforeEach(module('cimonitorApp'));

  var MonitorctrlCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MonitorctrlCtrl = $controller('MonitorctrlCtrl', {
      $scope: scope
    });
  }));

  it('should have something in the scope', function () {
    // no real value with this test
    expect(scope.projects).not.toBeUndefined();
    expect(scope.config).not.toBeUndefined();
  });
});
