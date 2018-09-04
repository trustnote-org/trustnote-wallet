'use strict';

angular.module('copayApp.controllers').controller('versionController', function () {
	var conf = require('trustnote-common/conf.js');

	this.version = window.version;
	this.commitHash = window.commitHash;

	// wallet type
	this.type = (conf.bLight ? 'light' : '');
});
