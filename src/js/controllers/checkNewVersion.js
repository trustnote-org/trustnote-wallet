'use strict';

angular.module('copayApp.controllers').controller('checkNewVersion', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout) {
	var self = this;
	var wallet_defined_by_keys = require('trustnote-common/wallet_defined_by_keys.js');
	var myWitnesses = require('trustnote-common/my_witnesses');


	var network = require('trustnote-common/network');
	var Bitcore = require('bitcore-lib');
	var Mnemonic = require("bitcore-mnemonic");
	var crypto = require("crypto");
	var objectHash = require('trustnote-common/object_hash.js');
	var ecdsaSig = require('trustnote-common/signature.js');


	//network.sendVersion();





});

