import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';
var global = {};
export class MainController {

  
  /*@ngInject*/
  constructor($http, $scope, socket, NgMap, $state, Auth, $timeout, $mdDialog) {
    this.$http = $http;
    this.socket = socket;
    this.$state = $state;
    this.Auth = Auth;
    this.$mdDialog = $mdDialog;
    Auth.getCurrentUser(user =>{
      this.filter = {'cost':user.loanEstimate/100000, distance:10};
      console.log(user);
      this.getCurrentUser = user;
      
    });
    this.$timeout = $timeout;


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
    this.$http.get('/api/projects')
      .then(response => {
        this.projects = response.data;
        // this.socket.syncUpdates('thing', this.awesomeThings);
      });
  }

  getCenter(vm){
    vm.$timeout(function(){
      vm.coordinates = vm.map.getCenter().lat()+','+vm.map.getCenter().lng();
    },1000)
  }
  // Due to Drap marker
  getCurrentLocation(event, vm){
    vm.coordinates = event.latLng.lat()+','+event.latLng.lng();
  }

  // Due to Input text
  placeChanged() {
    this.place = this.getPlace();
    global.map.setCenter(this.place.geometry.location);
    global.coordinates = this.place.geometry.location.lat()+','+this.place.geometry.location.lng();
    this.coordinates = global.coordinates;
  }

  markerFilter(project){
    var show = false;
    for(var i=0;i<project.type.categories.length;++i){
      if(project.type.categories[i].totalPrice<(global.filter.cost*100000)){
        show = true;
      }
    }
    return show;
  }
  
  showProject(event, project){

    console.log(project);
    global.$mdDialog.show({
      controller: 'viewProject',
      templateUrl: 'viewProject.html',
      parent: angular.element(document.body),
      clickOutsideToClose:true,
      fullscreen: true, // Only for -xs, -sm breakpoints.
      resolve: {
        project: function(){
             return project;
         }
      }
    })
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

