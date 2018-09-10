'use strict';
angular.module('trustnoteApp.services')
  .factory('bitcore', function bitcoreFactory(bwcService) {
    var bitcore = bwcService.getBitcore();
    return bitcore;
  });
