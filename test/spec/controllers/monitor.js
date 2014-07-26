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

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
