'use strict';

angular.module('trustnoteApp.controllers').controller('versionController', function () {
	var conf = require('trustnote-pow-common/config/conf.js');

	this.version = window.version;
	this.commitHash = window.commitHash;

	// wallet type
	this.type = (conf.bLight ? 'light-' : '') + "pow-alpha";
});
