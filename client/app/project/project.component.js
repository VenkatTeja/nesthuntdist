'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './project.routes';

var global = {};
export class ProjectComponent {
  /*@ngInject*/
  constructor($http, Auth, $location, $state, NgMap) {

    this.id = $location.url().split('/project/')[1].split('#')[0];

    this.project = {};
    this.project.location={};
    this.project.type = {rps:{}, size: [], upt: [], type:1};
    this.project.status = 1;
    this.project.approvals = {};

    this.$http = $http;
    this.$state = $state;

    // Upload Steps
    this.steps = [{name:'Project Location', number:1},
                    {name:'Project Details', number:2},
                    {name:'Project Type', number:3},
                    {name:'Clearances', number:4},
                    {name: 'Images/Offers', number:5}];
    this.uploadStep = 1;

    // Map
    global = this;
    this.coordinates = '';
    this.types = "['establishment']";
    NgMap.getMap().then(map => {
      this.map = map;
    });
    this.googleMapsUrl = 'https://maps.google.com/maps/api/js?key=AIzaSyAkRdm99u8ZxzbilGEK7FHOxfwd4uvg0II';
  

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

  nextStep (step){
    this.uploadStep += step;

  }
  setSize(num){
    this.project.type.size = new Array(num);
  }

  getCenter(vm, map){
    vm.coordinates = map.getCenter().lat()+','+map.getCenter().lng(); 
    vm.$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+map.getCenter().lat()+','+map.getCenter().lng()+'&sensor=true').then(response =>{
      vm.project.location.name = response.data.results[0].formatted_address;
    })
  }
  getCurrentLocation(event, vm){
    console.log(event, vm);
    vm.$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+event.latLng.lat()+','+event.latLng.lng()+'&sensor=true').then(response =>{
      vm.project.location.name = response.data.results[0].formatted_address;
    })
    vm.coordinates= event.latLng.lat()+','+event.latLng.lng();
  }
  placeChanged() {
    this.place = this.getPlace();
    global.coordinates= this.place.geometry.location.lat()+','+this.place.geometry.location.lng();
    console.log('location', global.coordinates);
    global.map.setCenter(this.place.geometry.location);
    this.coordinates = global.coordinates;
  }

  manageProject(project){
    console.log(global.coordinates);
    project.location = {lat:global.coordinates.split(',')[0], lng: global.coordinates.split(',')[1]}
    
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
