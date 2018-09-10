'use strict';

var eventBus = require('trustnote-common/event_bus.js');

angular.module('trustnoteApp.services').factory('newVersion', function(storageService){
	var root = {};
	root.showUpdate = 0;

	eventBus.on('new_version', function (ws, data) {
		root.hasChoosen = 0;
		storageService.gethaschoosen(function (err, val) {
			root.hasChoosen  = val;
			if (root.hasChoosen != 2) {
				return;
			}
		});

		if (data.msg){
			if(typeof (data.msg) == 'string'){
				root.msg = JSON.parse(data.msg)
			}
			root.msg = data.msg;
		}

		if (root.showUpdate == 0) {
			root.showUpdate = 1;
		}
	});

	return root;
});