'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './builder.routes';

export class BuilderComponent {
  /*@ngInject*/
  constructor($http, $location, Auth) {
    this.$http = $http;

    this.id = $location.url().split('/builder/')[1].split('#')[0];
  }

  manageBuilder(){
    console.log(this.id);
  }
}

export default angular.module('nestHuntApp.builder', [uiRouter])
  .config(routes)
  .component('builder', {
    template: require('./builder.html'),
    controller: BuilderComponent,
    controllerAs: 'builder'
  })
  .name;
