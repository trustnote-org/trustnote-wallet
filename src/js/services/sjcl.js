
'use strict';
angular.module('trustnoteApp.services')
  .factory('sjcl', function bitcoreFactory(bwcService) {
    var sjcl = bwcService.getSJCL();
    return sjcl;
  });
