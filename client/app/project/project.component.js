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
    this.project.type = {rps:{}, lSize:{}, bSize:{}, budget:{}, type:1};
    this.project.status = 1;
    this.project.approvals = {};
    this.project.offers = [];
    this.offers = ["FullY Furnished", "Teak Wood Works", "Marble Flooring", "Modular Kitched", "Air Conditioning", "Security Camera", "RO Facility", "Free Car Parks", "2 Wheeler", "4 Wheeler", "TV,Mobiles", "Cupboards", "Solar Water Heater", "Kitchen Chimney", "Piped gas Connection", "Home Appliances", "Safety Grills"];
    this.$http = $http;
    this.$state = $state;
    this.$timeout = $timeout;
    this.Upload = Upload;
    this.user = Auth.getCurrentUserSync;
    this.NgMap = NgMap;
    // Upload Steps
    this.steps = [{name:'Project Details', number:1},
                    {name:'Project Location', number:2},
                    {name:'Project Type', number:3},
                    {name:'Clearances', number:4}];
    this.uploadStep = 1;

    // Map
    global = this;
    this.types = "['establishment']";

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

  setMap(){
    this.NgMap.getMap().then(map => {
      this.map = map;
      console.log(this.map.getCenter().lat());

      this.project.location.lat = this.map.getCenter().lat();
      this.project.location.lng = this.map.getCenter().lng(); 
      this.coordinates = this.project.location.lat+','+this.project.location.lng;
    })
    .catch(err=>{
      console.log(err);
    });
  }

  getCenter(vm){
    vm.$timeout(function(){
      // 
    },5000)
  }
  // Due to Drap marker
  getCurrentLocation(event, vm){
    // vm.$http.get('http://maps.googleapis.com/maps/api/geocode/json?latlng='+event.latLng.lat()+','+event.latLng.lng()+'&sensor=true').then(response =>{
    //   vm.project.location.name = response.data.results[0].formatted_address;
    // })
    console.log('d');
    vm.project.location.lat = event.latLng.lat();
    vm.project.location.lng = event.latLng.lng();
    vm.coordinates = vm.project.location.lat+','+vm.project.location.lng;
  }

  // Due to Input text
  placeChanged() {
    console.log('e');

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
    })
    .catch(function(err){
      console.log(err);
    })
  }

  editThis(project){
    this.project = project;
    this.coordinates = this.project.location.lat+','+this.project.location.lng;
    this.steps.push({name:"Images & Offers", number:5});  
  }

  getCoordinates(location){
    console.log(location.lat + ',' + location.lng);
    return location.lat + ',' + location.lng;
  }

  addOffer(index){
    this.project.offers.push(this.offers[index]);
  }
  removeOffer(index){
    this.project.offers.push(this.offers[index]);
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
