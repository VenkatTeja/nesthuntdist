'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './profile.routes';

export class ProfileComponent {
  /*@ngInject*/
  constructor($http, $location, Auth, $timeout) {
    this.$http = $http;
    this.$timeout = $timeout;
    this.user = Auth.getCurrentUserSync();
    this.id = $location.url().split('/profile/')[1].split('#')[0];
  }

  manageBuilder(builder){
    this.saving = true;
    this.$http.put('/api/users/builder',{data:builder})
    .then(response=> {
      this.savingStatus = "Saved";
      this.saving = false
      this.$timeout(()=>{
        this.savingStatus = '';
      },2000);
    })
    .catch(err=>{
      console.log(err);
      this.savingStatus = "Saved";
      this.saving = false
      this.$timeout(()=>{
        this.savingStatus = '';
      },2000);
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
