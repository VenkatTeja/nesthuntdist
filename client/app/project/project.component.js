'use strict';
const angular = require('angular');

const uiRouter = require('angular-ui-router');

import routes from './project.routes';

var global = {};
export class ProjectComponent {
  /*@ngInject*/
  constructor($http, Auth, $location, $state, NgMap, $timeout, Upload) {

    this.id = $location.url().split('/project/')[1].split('#')[0];

    this.project = {};
    this.project.location={};
    this.project.type = {rps:{}, categories: [{num:0,size:0,villaType:1}], upt: [], type:1};
    this.project.status = 1;
    this.project.approvals = {};
    this.project.offers = {};
    this.$http = $http;
    this.$state = $state;
    this.$timeout = $timeout;
    this.Upload = Upload;
    this.user = Auth.getCurrentUserSync;

    // Upload Steps
    this.steps = [{name:'Project Location', number:1},
                    {name:'Project Details', number:2},
                    {name:'Project Type', number:3},
                    {name:'Clearances', number:4}];
    this.uploadStep = 1;

    // Map
    global = this;
    this.types = "['establishment']";
    NgMap.getMap().then(map => {
      this.map = map;
    });
    this.googleMapsUrl = 'https://maps.google.com/maps/api/js?key=AIzaSyAkRdm99u8ZxzbilGEK7FHOxfwd4uvg0II';
  

  }

  $onInit() {
    this.$http.get('/api/projects/myProjects/'+this.id)
      .then(response => {
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

  getCenter(vm){
    vm.$timeout(function(){
      vm.project.location.lat = vm.map.getCenter().lat();
      vm.project.location.lng = vm.map.getCenter().lng(); 
      vm.coordinates = vm.project.location.lat+','+vm.project.location.lng;
      vm.$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+vm.map.getCenter().lat()+','+vm.map.getCenter().lng()+'&sensor=true').then(response =>{
        vm.project.location.name = response.data.results[0].formatted_address;
      })
    },5000)
  }
  // Due to Drap marker
  getCurrentLocation(event, vm){
    vm.$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+event.latLng.lat()+','+event.latLng.lng()+'&sensor=true').then(response =>{
      vm.project.location.name = response.data.results[0].formatted_address;
    })
    vm.project.location.lat = event.latLng.lat();
    vm.project.location.lng = event.latLng.lng();
    vm.coordinates = vm.project.location.lat+','+vm.project.location.lng;
  }

  // Due to Input text
  placeChanged() {
    this.place = this.getPlace();
    global.project.location.lat = this.place.geometry.location.lat();
    global.project.location.lng = this.place.geometry.location.lng();
    global.map.setCenter(this.place.geometry.location);
    global.coordinates = global.project.location.lat+','+global.project.location.lng;
    this.project = global.project;
    this.coordinates = global.coordinates;
  }

  manageProject(project){
    
    this.$http.post('/api/projects',{data:project})
    .then(response =>{
      this.project._id = response.data._id;
      this.uploadStep++;
      this.steps.push({name:"Images & Offers", number:5});
    })
    .catch(function(err){
      console.log(err);
    })
  }

  editProject(project){
    
    this.$http.patch('/api/projects/'+project._id,{data:project})
    .then(response =>{
      this.project._id = response.data._id;
      this.uploadStep++;
      this.steps.push({name:"Images & Offers", number:5});
    })
    .catch(function(err){
      console.log(err);
    })
  }

  editThis(project){
    this.project = project;
    this.steps.push({name:"Images & Offers", number:5});  
  }
  getCoordinates(location){
    console.log(location.lat + ',' + location.lng);
    return location.lat + ',' + location.lng;
  }

  // uploadPic(file, key) {
  //   file.upload = this.Upload.upload({
  //     url: '/api/projects/uploadPic',
  //     data: {key: key, file: file},
  //   });

  //   file.upload.then(function (response) {
  //     this.$timeout(function () {
  //       console.log(response.data);
  //       file.result = response.data;
  //     });
  //   }, function (response) {
  //     if (response.status > 0)
  //       this.errorMsg = response.status + ': ' + response.data;
  //   }, function (evt) {
  //     // Math.min is to fix IE which reports 200% sometimes
  //     file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
  //   });
  //   }
}

export default angular.module('nestHuntApp.project', [uiRouter])
  .config(routes)
  .component('project', {
    template: require('./project.html'),
    controller: ProjectComponent,
    controllerAs: 'projectCtrl'
  })
  .name;
