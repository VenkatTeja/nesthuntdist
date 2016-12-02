'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './builder.routes';

export class BuilderComponent {
  /*@ngInject*/
  constructor($http, $location, Auth) {
    this.$http = $http;
    this.user = Auth.getCurrentUserSync();
    this.id = $location.url().split('/builder/')[1].split('#')[0];
  }

  manageBuilder(builder){
    this.$http.put('/api/users/builder',{data:builder}).success(function(response) {
      console.log(response);
    })
    .catch(function(err){
      console.log(err);
    })
  }
}

export default angular.module('nestHuntApp.builder', [uiRouter])
  .config(routes)
  .component('builder', {
    template: require('./builder.html'),
    controller: BuilderComponent,
    controllerAs: 'builder',
    authenticate: 'user'
  })
  .name;
