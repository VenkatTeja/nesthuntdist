'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './profile.routes';

export class ProfileComponent {
  /*@ngInject*/
  constructor($http, $location, Auth) {
    this.$http = $http;
    this.user = Auth.getCurrentUserSync();
    this.id = $location.url().split('/profile/')[1].split('#')[0];
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

export default angular.module('nesthuntApp.profile', [uiRouter])
  .config(routes)
  .component('profile', {
    template: require('./profile.html'),
    controller: ProfileComponent,
    controllerAs: 'profile',
    authenticate: 'user'
  })
  .name;
