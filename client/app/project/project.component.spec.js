'use strict';

describe('Component: ProjectComponent', function() {
  // load the controller's module
  beforeEach(module('nestHuntApp.project'));

  var ProjectComponent;

  // Initialize the controller and a mock scope
  beforeEach(inject(function($componentController) {
    ProjectComponent = $componentController('project', {});
  }));

  it('should ...', function() {
    expect(1).to.equal(1);
  });
});
