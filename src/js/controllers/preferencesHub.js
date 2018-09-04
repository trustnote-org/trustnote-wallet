'use strict';

angular.module('copayApp.controllers').controller('preferencesHubController',
	function($scope, $timeout, configService, go){
		var config = configService.getSync();
		var initHubEdit = false;
		this.hub = config.hub;
		this.arrHub = configService.hub;

		this.save = function() {
			var self = this;
			var device = require('trustnote-common/device.js');
			var lightWallet = require('trustnote-common/light_wallet.js');
			self.hub = self.hub.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');

			var opts = {hub: self.hub};

			configService.set(opts, function(err) {
				if (err) {
					$scope.$emit('Local/DeviceError', err);
					return;
				}

				$timeout(function () {
					device.setDeviceHub(self.hub);
					lightWallet.setLightVendorHost(self.hub);
				}, 800);

				$timeout(function(){
					go.path('preferencesGlobal');
				}, 50);
			});
		};

		var unwatchEditHub = $scope.$watch(angular.bind(this, function(){
			return this.hub;
		}), function(){
			if (initHubEdit) {

			}
			else {
				initHubEdit = true;
			}
		});


		$scope.$on('$destroy', function(){
			unwatchEditHub();
		});
	});
