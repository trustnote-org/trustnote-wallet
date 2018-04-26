'use strict';

var eventBus = require('trustnote-common/event_bus.js');

angular.module('copayApp.services').factory('newVersion', function(){
	var root = {};
	root.showUpdate = 0;

	eventBus.on('new_version', function (ws, data) {
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