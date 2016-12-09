'use strict';

import angular from 'angular';

/**
 * Uploads file to Cellar through server
 */
angular.module('nestHuntApp')
  .directive('uploadFile', function(Upload, $timeout) {
    return {
      	restrict: 'EA',
	    scope: { heading:'@', callFns:'@', key:'@'},	    
    	templateUrl:'/components/htmlTemplates/uploadFile.html',
	    replace: true,
      	link(scope, element, attrs) {
      		console.log('dddddddddddddddddddddd');
        	scope.uploadPic = function(file) {
		    file.upload = Upload.upload({
		      url: '/api/projects/uploadfile',
		      data: {key:key, file: file},
		    });

		    file.upload.then(function (response) {
		      $timeout(function () {
		        file.result = response.data;
		      });
		    }, function (response) {
		      if (response.status > 0)
		        scope.errorMsg = response.status + ': ' + response.data;
		    }, function (evt) {
		      // Math.min is to fix IE which reports 200% sometimes
		      file.progress = Math.min(100, parseInt(100.0 * evt.loaded / evt.total));
		    });
		    }
		}
	};
});