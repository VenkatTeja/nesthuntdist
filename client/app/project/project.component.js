'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './project.routes';

export class ProjectComponent {
  /*@ngInject*/
  constructor($http, Auth, $location, $state) {

    this.id = $location.url().split('/project/')[1].split('#')[0];

    this.project = {};
    this.project.type = {rps:{}, size: [], upt: [], type:1};
    this.project.status = 1;
    this.project.approvals = {};

    this.$http = $http;
    this.$state = $state;

  }

  $onInit() {
    this.$http.get('/api/projects/myProjects/'+this.id)
      .then(response => {
      console.log(response.data);
      this.myProjects = response.data;
    })
    .catch(function(err){
      console.log(err);
    })
  }

  setSize(num){
    this.project.type.size = new Array(num);
  }

  manageProject(project){
    this.$http.post('/api/projects',{data:project})
    .then(response =>{
      this.$state.reload();
    })
    .catch(function(err){
      console.log(err);
    })
  }
}

export default angular.module('nestHuntApp.project', [uiRouter])
  .config(routes)
  .component('project', {
    template: require('./project.html'),
    controller: ProjectComponent,
    controllerAs: 'projectCtrl'
  })
  .name;
