'use strict';

describe('Controller: ExportCtrl', function () {

  // load the controller's module
  beforeEach(module('cimonitorApp'));

  var ExportCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ExportCtrl = $controller('ExportCtrl', {
      $scope: scope
    });
  }));

  it('should have something in the scope', function () {
    // no real value with this test
    expect(scope.export).not.toBeUndefined();
  });
});
