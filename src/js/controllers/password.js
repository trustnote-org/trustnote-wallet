'use strict';

angular.module('copayApp.controllers').controller('passwordController',
	function ($rootScope, $scope, $timeout, profileService, notification, go, gettext) {

		var self = this;

		var pass1;
		self.checkPassClose = profileService.checkPassClose;
		self.isVerification = false;

		var fc = profileService.focusedClient;
		self.bHasMnemonic = (fc.credentials && fc.credentials.mnemonic);

		//document.getElementById("passwordInput").focus();

		self.close = function (cb) {
			profileService.checkPassClose = true;
			return cb(gettext('No password given'));
		};

		self.set = function (isSetup, cb) {
			self.error = false;

			if (isSetup && !self.isVerification) {
				document.getElementById("passwordInput").focus();
				self.isVerification = true;
				pass1 = self.password;
				self.password = null;
				$timeout(function () {
					$rootScope.$apply();
				})
				return;
			}
			if (isSetup) {
				if (pass1 != self.password) {
					self.error = gettext('Passwords do not match');
					self.isVerification = false;
					self.password = null;
					pass1 = null;

					return;
				}
			}
			return cb(null, self.password);
		};

// 添加代码弹出二维码页面
		self.showQrcode = function () {
			self.askqr = true;
		};

		$rootScope.$on('Local/WalletImported', function (event, walletId) {
			self.needsBackup = false;
			storageService.setBackupFlag(walletId, function () {
				$log.debug('Backup done stored');
				addressService.expireAddress(walletId, function (err) {
					$timeout(function () {
						self.txHistory = self.completeHistory = [];
						self.startScan(walletId);
					}, 500);
				});
			});
		});
// 添加代码弹出二维码页面 -- 结束
	});