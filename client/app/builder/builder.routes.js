'use strict';

export default function($stateProvider) {
  'ngInject';
  $stateProvider
    .state('builder', {
      url: '/builder/:id',
      template: '<builder></builder>'
    });
}
