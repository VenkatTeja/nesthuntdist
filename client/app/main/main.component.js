import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';
var global = {};
export class MainController {

  
  /*@ngInject*/
  constructor($http, $scope, socket, NgMap, $state, Auth) {
    this.$http = $http;
    this.socket = socket;
    this.$state = $state;
    this.Auth = Auth;
    // Map
    global = this;
    this.coordinates = '';
    this.types = "['establishment']";
    NgMap.getMap().then(map => {
      this.map = map;
      this.coordinates = this.map.getCenter().lat()+','+this.map.getCenter().lng();
    });
    this.googleMapsUrl = 'https://maps.google.com/maps/api/js?key=AIzaSyAkRdm99u8ZxzbilGEK7FHOxfwd4uvg0II';
  }

  $onInit() {
    this.$http.get('/api/projects')
      .then(response => {
        this.projects = response.data;
        // this.socket.syncUpdates('thing', this.awesomeThings);
      });
  }

  getCurrentLocation(event){
    global.coordinates= event.latLng.lat()+','+event.latLng.lng();
    console.log('location', global.coordinates);
    this.coordinates = global.coordinates;
  }
  placeChanged() {
    this.place = this.getPlace();
    global.coordinates= this.place.geometry.location.lat()+','+this.place.geometry.location.lng();
    console.log('location', global.coordinates);
    global.map.setCenter(this.place.geometry.location);
    this.coordinates = global.coordinates;
  }

  register(form, user) {
    console.log(user);
    if(form.$valid) {
      
      return this.Auth.createUser({
        name: user.name,
        email: user.email,
        password: user.password,
        role: 'buyer',
        phone: user.phone,
        income: user.income,
        currentEmi: user.currentEmi
      }).then((user) => {
          // Account created, redirect to home
          this.$state.reload();
        })
        .catch(err => {
          err = err.data;
          this.errors = {};
          // Update validity of form fields that match the mongoose errors
          angular.forEach(err.errors, (error, field) => {
            form[field].$setValidity('mongoose', false);
            this.errors[field] = error.message;
          });
        });
    }
  }
}

export default angular.module('nestHuntApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    template: require('./main.html'),
    controller: MainController
  })
  .name;
