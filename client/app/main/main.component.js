import angular from 'angular';
import uiRouter from 'angular-ui-router';
import routing from './main.routes';

export class MainController {

  /*@ngInject*/
  constructor($http, $scope, socket, NgMap) {
    this.$http = $http;
    this.socket = socket;


    var vm = this;
    vm.message = 'You can not hide. :)';
    NgMap.getMap().then(function(map) {
      vm.map = map;
    });
    vm.callbackFunc = function(param) {
      console.log('I know where '+ param +' are. ' + vm.message);
      console.log('You are at' + vm.map.getCenter());
    };

    this.googleMapsUrl="https://maps.googleapis.com/maps/api/js?key=AIzaSyAkRdm99u8ZxzbilGEK7FHOxfwd4uvg0II";

    // $scope.$on('$destroy', function() {
    //   socket.unsyncUpdates('thing');
    // });
  }

  $onInit() {
    this.$http.get('/api/projects')
      .then(response => {
        this.projects = response.data;
        // this.socket.syncUpdates('thing', this.awesomeThings);
      });
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
