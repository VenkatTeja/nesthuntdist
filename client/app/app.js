// 'use strict';

import angular from 'angular';
import ngAnimate from 'angular-animate';
import ngCookies from 'angular-cookies';
import ngResource from 'angular-resource';
import ngSanitize from 'angular-sanitize';
import 'angular-socket-io';

import uiRouter from 'angular-ui-router';
import uiBootstrap from 'angular-ui-bootstrap';
import ngMaterial from 'angular-material';
import ngMap from 'ngmap';
import ngFileUpload from 'ng-file-upload';
import ngImageGallery from 'ng-image-gallery';
// import ngImgCrop from 'ng-img-crop-full-extended';
import ngMessages from 'angular-messages';
// import ngValidationMatch from 'angular-validation-match';


import {
  routeConfig
} from './app.config';

import _Auth from '../components/auth/auth.module';
import account from './account';
import admin from './admin';
// import uploadFile from '../components/directives/uploadFile.js';
import navbar from '../components/navbar/navbar.component';
import footer from '../components/footer/footer.component';
import main from './main/main.component';
import profile from './profile/profile.component';
import project from './project/project.component';
import constants from './app.constants';
import util from '../components/util/util.module';
import socket from '../components/socket/socket.service';

import './app.css';

angular.module('nestHuntApp', [ngCookies, ngResource, ngSanitize, 'btford.socket-io', uiRouter,
    uiBootstrap, ngMaterial, ngMessages, ngMap, ngFileUpload, 'thatisuday.ng-image-gallery', _Auth, account, admin, profile, navbar, footer, main, project, constants, socket, util
  ])
  .config(routeConfig)
  .run(function($rootScope, $location, Auth) {
    'ngInject';
    // Redirect to login if route requires auth and you're not logged in

    $rootScope.$on('$stateChangeStart', function(event, next) {
      Auth.isLoggedIn(function(loggedIn) {
        if(next.authenticate && !loggedIn) {
          $location.path('/login');
        }
      });
    });
  })
  .directive('uploadFile',["Upload", "$timeout", function(Upload, $timeout) {
    return {
        restrict: 'EA',
      scope: { heading:'@', callFns:'@', key:'@'},      
      templateUrl:'/components/htmlTemplates/uploadFile.html',
      replace: true,
        link(scope, element, attrs) {
        scope.uploadPic = function(file) {
            console.log('sssss');
        file.upload = Upload.upload({
          url: '/api/projects/uploadfile',
          data: {key:scope.key, file: file},
        });

        file.upload.then(function (response) {
            scope.progress = "Upload Successful";
        }, function (response) {
          if (response.status > 0)
            scope.errorMsg = response.status + ': ' + response.data;
        }, function (evt) {
          // Math.min is to fix IE which reports 200% sometimes
          scope.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total))+'%';
          if(scope.progress=='100%')
            scope.progress = "Saving";
        });
        }
    }
  };
}])
//
.controller('viewProject',["$scope", "$mdDialog", "project", "$q", "$timeout",function($scope, $mdDialog, project, $q, $timeout){
  $scope.images = [];
  $scope.project = project;

  var isImage = function(src){
  var deferred = $q.defer();
  var image = new Image();
    image.onerror = function() {
        deferred.resolve(false);
    };
    image.onload = function() {
        deferred.resolve(true);
    };
    image.src = src;
    return deferred.promise;
  };
  var checkImageAndReplace = function(givenUrl, defaultUrl, cb){
    var src = givenUrl;
      isImage(givenUrl, $q).then(response=>{
        if(!response)
          src = defaultUrl;
        return cb(src);
      })
  };

  var images = [];
  project.imagePresent = [];

  for(var i=0;i<4;++i){
    if(!project.imagePresent[i])
    $scope.images.push({title:project.name,url:project.images[i]});
  }
  var collectImages = function(i, project){
    checkImageAndReplace(project.images[i], false, function(src){
      if(!src)
        $scope.images.splice(i,1);
      if(i<3)
        collectImages(i+1,project);
    })
  }

  collectImages(0,project);
  // $timeout(function(){
  // },1111)
  

  $scope.cancel = function(){
    $mdDialog.cancel();
  }
  
}]);

angular.element(document)
  .ready(() => {
    angular.bootstrap(document, ['nestHuntApp'], {
      strictDi: true
    });
  });

