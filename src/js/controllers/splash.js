'use strict';

angular.module('copayApp.controllers').controller('splashController', function ($scope, $timeout, $log, configService, profileService, storageService, go, isCordova) {
		var self = this;
		this.saveDeviceName = function () {
			console.log('saveDeviceName: ' + self.deviceName);
			// require js
			var device = require('trustnote-common/device.js');
			device.setDeviceName(self.deviceName);
			var opts = {deviceName: self.deviceName};

			// 更改代码 向内存中写入状态1
			storageService.hashaschoosen(1, function (err) {});

			configService.set(opts, function (err) {
				$timeout(function () {
					if (err)
						self.$emit('Local/DeviceError', err);
					self.bDeviceNameSet = true;
				});
			});
		};

		// 获取设备的名字  截取前20个 字符
		configService.get(function (err, config) {
			// if (err)
			// 	throw Error("failed to read config");
			var thistempName = config.deviceName || "TrustNote";
			if(thistempName.length >= 20){
				thistempName = thistempName.substr(0,20);
			}
			self.deviceName = thistempName;
		});
		this.step = isCordova ? 'device_name' : 'wallet_type';
		this.wallet_type = 'light';

		this.setWalletType = function () {
			var bLight = (self.wallet_type === 'light');
			if (!bLight) {
				self.step = 'device_name';
				return;
			}
			var fs = require('fs' + '');
			var desktopApp = require('trustnote-common/desktop_app.js');
			var appDataDir = desktopApp.getAppDataDir();
			var userConfFile = appDataDir + '/conf.json';
			fs.writeFile(userConfFile, JSON.stringify({bLight: bLight}, null, '\t'), 'utf8', function (err) {
				if (err)
					throw Error('failed to write conf.json: ' + err);
				var conf = require('trustnote-common/conf.js');
				if (!conf.bLight)
					throw Error("Failed to switch to light, please restart the app");
				self.step = 'device_name';
				$timeout(function () {
					$scope.$apply();
				});
			});
		};

		this.create = function (noWallet) {
			$scope.index.splashClick = true;
			if (self.creatingProfile)
				return console.log('already creating profile');
			self.creatingProfile = true;
			//	saveDeviceName();
			$timeout(function () {
				profileService.create({noWallet: noWallet}, function (err) {
					if (err) {
						self.creatingProfile = false;
						$log.warn(err);
						self.error = err;
						$scope.$apply();
						/*$timeout(function() {
						 self.create(noWallet);
						 }, 3000);*/
					}
					go.path('backupWaring');
				});
			}, 100);
		};

		// 初始化进入钱包
		this.init = function () {
			storageService.getDisclaimerFlag(function (err, val) {
				if (!val) {
					go.path('preferencesGlobal.preferencesAbout.disclaimer');
				}

				if (profileService.profile) {
					go.walletHome();
				}
			});
		};
	});
