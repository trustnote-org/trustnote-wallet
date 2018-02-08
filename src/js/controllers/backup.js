'use strict';

angular.module('copayApp.controllers').controller('wordsController',
	function ($rootScope, $scope, $timeout, profileService, go, gettext, confirmDialog, notification, $log, isCordova) {

		var msg = gettext('Are you sure you want to delete the backup words?');
		var successMsg = gettext('Backup words deleted');
		var self = this;
		self.show = false;
		var fc = profileService.focusedClient;

// 更改代码 iOS客户端 不显示全备份
		if(typeof (window.cordova) == 'undefined'){
			this.isIOS = false;
		}else {
			this.isIOS = window.cordova.platformId;
		}



// 更改代码
        self.step = 'show_waring';
        self.delseed = false;

        self.gono = function () {
            self.step = 'show_jietu';
        }

		self.showword = function () {
            self.step = 'show_word';
        }

        self.showinput = function () {
            self.step = 'show_input';
        }

        self.del = function () {
            self.delseed = !self.delseed;
        }




        self.dis = function () {
            return self.value == fc.getMnemonic()? false:true
        }

        self.value = "";








		if (!isCordova) {
			var desktopApp = require('trustnote-common/desktop_app.js' + '');
			self.appDataDir = desktopApp.getAppDataDir();
		}
		self.isCordova = isCordova;


		if (fc.isPrivKeyEncrypted()) self.credentialsEncrypted = true;
		else {
			setWords(fc.getMnemonic());
		}

		if (fc.credentials && !fc.credentials.mnemonicEncrypted && !fc.credentials.mnemonic) {
			self.deleted = true;
		}

		self.toggle = function () {
			self.error = "";
			if (!self.credentialsEncrypted) {
				if (!self.show)
					$rootScope.$emit('Local/BackupDone');
				self.show = !self.show;
			}

			if (self.credentialsEncrypted)
				self.passwordRequest();

			$timeout(function () {
				$scope.$apply();
			}, 1);
		};


		// 删除口令
		self.delete = function () {
			confirmDialog.show(msg, function (ok) {
				if (ok) {
					fc.clearMnemonic();
					profileService.clearMnemonic(function () {
						self.deleted = true;
						notification.success(successMsg);
						go.walletHome();
					});
				}
			});
		};



        // 删除口令 修改后
        self.delteConfirm = function () {
            fc.clearMnemonic();
            profileService.clearMnemonic(function () {
                self.deleted = true;
                notification.success(successMsg);
                go.walletHome();
            });

        };



		$scope.$on('$destroy', function () {
			profileService.lockFC();
		});



		function setWords(words) {
			if (words) {
				self.mnemonicWords = words.split(/[\u3000\s]+/);
				self.mnemonicHasPassphrase = fc.mnemonicHasPassphrase();
				self.useIdeograms = words.indexOf("\u3000") >= 0;
                // alert(self.mnemonicWords );
                // alert(typeof (self.mnemonicWords));
                // alert(JSON.stringify(self.mnemonicWords));
			}
		};
        // strvalue = self.mnemonicWords.join(" ");
        // alert(fc.getMnemonic());




		self.passwordRequest = function () {
			try {
				setWords(fc.getMnemonic());
			} catch (e) {
				if (e.message && e.message.match(/encrypted/) && fc.isPrivKeyEncrypted()) {
					self.credentialsEncrypted = true;

					$timeout(function () {
						$scope.$apply();
					}, 1);

					profileService.unlockFC(null, function (err) {
						if (err) {
							self.error = gettext('Could not decrypt') + ': ' + err.message;
							$log.warn('Error decrypting credentials:', self.error); //TODO
							return;
						}
						if (!self.show && self.credentialsEncrypted)
							self.show = !self.show;
						self.credentialsEncrypted = false;
						setWords(fc.getMnemonic());
						$rootScope.$emit('Local/BackupDone');
					});
				}
			}
		}
	});
