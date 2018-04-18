'use strict';

angular.module('copayApp.controllers').controller('topbarController', function($scope, $rootScope, go, profileService) {

    this.onQrCodeScanned = function(data) {
        go.handleUri(data);
        //$rootScope.$emit('dataScanned', data);
    };

    this.openSendScreen = function() {
        go.send();
    };

    this.onBeforeScan = function() {
    };

    this.goHome = function() {
        go.walletHome();
    };

// 更改代码
// 	this.goWallet = function() {
// 		if(profileService.tempWalletId != $scope.index.walletId) {
// 			profileService.setAndStoreFocus(profileService.tempWalletId, false, function() {
// 			});
// 		}
// 		go.wallet();
// 	};
	this.goWallet = function() {
		if((typeof(profileService.tempWalletId) != "undefined") && (profileService.tempWalletId != $scope.index.walletId)) {
			profileService.setAndStoreFocus(profileService.tempWalletId, false, function() {
				delete profileService.tempWalletId;
			});
		}
		go.wallet();
	};
});
