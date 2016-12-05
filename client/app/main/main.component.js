import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';
var global = {};
export class MainController {

  
  /*@ngInject*/
  constructor($http, $scope, socket, NgMap) {
    global = this;
    this.$http = $http;
    this.socket = socket;
    this.coordinates = '';
    this.message = 'You can not hide. :)';

    this.types = "['establishment']";
    

    NgMap.getMap().then(map => {
      this.map = map;
      this.coordinates = this.map.getCenter().lat()+','+this.map.getCenter().lng();
    });

    this.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyAkRdm99u8ZxzbilGEK7FHOxfwd4uvg0II";
  }

  $onInit() {
    this.$http.get('/api/projects')
      .then(response => {
        this.projects = response.data;
        // this.socket.syncUpdates('thing', this.awesomeThings);
      });
  }

  getCenter (){
    console.log('You are at');
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

  addThing() {
    if(this.newThing) {
      this.$http.post('/api/things', {
        name: this.newThing
      });
      this.newThing = '';
    }
  }

  deleteThing(thing) {
    this.$http.delete('/api/things/' + thing._id);
  }
}

export default angular.module('nestHuntApp.main', [uiRouter])
  .config(routing)
  .component('main', {
    template: require('./main.html'),
    controller: MainController
  })
  .name;
