'use strict';

angular.module('copayApp.controllers').controller('createController', function ($scope, $rootScope, $location, $timeout, $log, lodash, go, profileService, configService, isCordova, gettext, isMobile, derivationPathHelper, correspondentListService) {

	var self = this;

	var defaults = configService.getDefaults();
	this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
	$scope.account = 1;

	var defaults = configService.getDefaults();
	$scope.derivationPath = derivationPathHelper.default;

	// ng-repeat defined number of times instead of repeating over array?
	this.getNumber = function (num) {
		return new Array(num);
	}

	var updateRCSelect = function (n) {
		$scope.totalCosigners = n;
		self.RCValues = lodash.range(1, n + 1);
		if ($scope.requiredCosigners > n || !$scope.requiredCosigners)
			$scope.requiredCosigners = parseInt(n / 2 + 1);
	};

	var updateSeedSourceSelect = function (n) {
		self.seedOptions = [{
			id: 'new',
			label: gettext('New Random Seed')
		}, {
			id: 'set',
			label: gettext('Specify Seed...')
		}];
		$scope.seedSource = self.seedOptions[0];
	};

	// 创建一个包含从 start 到 end，但不包含 end 本身范围数字的数组
	this.TCValues = lodash.range(2, defaults.limits.totalCosigners + 1);
	$scope.totalCosigners = defaults.wallet.totalCosigners;
	this.cosigners = [];//Array($scope.totalCosigners);
	for (var i = 0; i < $scope.totalCosigners - 1; i++)
		this.cosigners.push({});
	correspondentListService.list(function (err, ab) {
		self.candidate_cosigners = ab;
		$scope.$digest();
	});

	/*
	 $scope.$watch(function(){return $scope.totalCosigners;}, function(newVal, oldVal){
	 console.log("watch "+oldVal+" "+newVal);
	 if (newVal > oldVal)
	 for (var i=oldVal; i<newVal-1; i++)
	 self.cosigners.push({});
	 else
	 self.cosigners.length = newVal-1;
	 }, true);*/

	this.setTotalCosigners = function (tc) {
		var oldLen = self.cosigners.length;
		var newLen = tc - 1;
		if (newLen > oldLen)
			for (var i = oldLen; i < newLen; i++)
				self.cosigners.push({});
		else if (newLen < oldLen)
			self.cosigners.length = newLen;

		updateRCSelect(tc);
		updateSeedSourceSelect(tc);
		self.seedSourceId = $scope.seedSource.id;
	};

	this.setMultisig = function () {
		this.setTotalCosigners(3);
		$scope.requiredCosigners = 2;
	};

	this.onCorrespondentSelected = function (device_address) {
		console.log(device_address);
		if (device_address === "new")
			go.path('correspondentDevices.addCorrespondentDevice');
	};


	this.setSeedSource = function (src) {
		self.seedSourceId = $scope.seedSource.id;

		$timeout(function () {
			$rootScope.$apply();
		});
	};

	function setError(error) {
		self.error = gettext(error);
	}

	this.create = function (form) {
		if (form && form.$invalid) {
			this.error = gettext('Please enter the required fields');
			return;
		}
		if (self.cosigners.length !== $scope.totalCosigners - 1)
			return setError("invalid number of cosigners");

		var opts = {
			m: $scope.requiredCosigners,
			n: $scope.totalCosigners,
			name: form.walletName.$modelValue,
			networkName: 'livenet',
			cosigners: []
		};
		if ($scope.totalCosigners > 1) {
			opts.cosigners = lodash.uniq(self.cosigners.map(function (cosigner) {
				return cosigner.device_address;
			}));
			if (opts.cosigners.length !== $scope.totalCosigners - 1)
				return setError("Please select different co-signers");
			for (var i = 0; i < opts.cosigners.length; i++)
				if (!opts.cosigners[i] || opts.cosigners[i].length !== 33)
					return setError("Please fill all co-signers");
		}
		/*
		 var setSeed = self.seedSourceId == 'set';
		 if (setSeed) {

		 var words = form.privateKey.$modelValue || '';
		 if (words.indexOf(' ') == -1 && words.indexOf('prv') == 1 && words.length > 108)
		 opts.extendedPrivateKey = words;
		 else
		 opts.mnemonic = words;

		 opts.passphrase = form.passphrase.$modelValue;

		 var pathData = derivationPathHelper.parse($scope.derivationPath);
		 if (!pathData) {
		 this.error = gettext('Invalid derivation path');
		 return;
		 }

		 opts.account = pathData.account;
		 opts.networkName = pathData.networkName;
		 opts.derivationStrategy = pathData.derivationStrategy;

		 }
		 else
		 opts.passphrase = form.createPassphrase.$modelValue;

		 if (setSeed && !opts.mnemonic && !opts.extendedPrivateKey) {
		 this.error = gettext('Please enter the wallet seed');
		 return;
		 }
		 */

		self._create(opts);
	};


	this._create = function (opts) {
		self.loading = true;
		$timeout(function () {
			profileService.createWallet(opts, function (err, walletId) {
				self.loading = false;
				if (err) {
					$log.warn(err);
					self.error = err;
					$timeout(function () {
						$rootScope.$apply();
					});
					return;
				}

				//if (opts.mnemonic || opts.externalSource || opts.extendedPrivateKey) {
				if (opts.externalSource) {
					if (opts.n == 1) {
						$rootScope.$emit('Local/WalletImported', walletId);
					}
				}
				/*if (opts.n > 1)
				 $rootScope.$emit('Local/ShowAlert', "Please approve wallet creation on other devices", 'fi-key', function(){
				 go.walletHome();
				 });*/
			});
		}, 100);
	}

	this.formFocus = function (what) {
		if (!this.isWindowsPhoneApp)
			return;

		if (what && what == 'my-name') {
			this.hideWalletName = true;
			this.hideTabs = true;
		} else if (what && what == 'wallet-name') {
			this.hideTabs = true;
		} else {
			this.hideWalletName = false;
			this.hideTabs = false;
		}
		$timeout(function () {
			$rootScope.$digest();
		}, 1);
	};

	$scope.$on("$destroy", function () {
		$rootScope.hideWalletNavigation = false;
	});

	updateSeedSourceSelect(1);
	self.setSeedSource('new');





	self.finishHot = 0;

// 创建新钱包中---： 处理二维码 ： 观察钱包扫描冷钱包 /***************************************************/
	var crypto = require("crypto");
	this.BeforeScan = function() {};
	this.handleQrcode = function parseUri(str, callbacks) {

		var re = new RegExp('TTT:(.+)$', 'i');
		var arrMatches = str.match(re);
		if (!arrMatches){
			self.isErr = 1;
			return;
		}
		str = arrMatches[1];

		try{
			var obj_from_coldWallet = JSON.parse(str);
		}catch(e){
			//console.log(e);
			self.isErr = 1;
			return;
		}
		if (obj_from_coldWallet.type) {
			switch (obj_from_coldWallet.type) {
				case "c1" :
					self.tempValue = obj_from_coldWallet.v;
					self.tempPubKey = obj_from_coldWallet.pub;
					self.tempAccount = obj_from_coldWallet.n;
					self.qrCodeColdwallet1 = "xpub:" + self.tempPubKey;

					// 用传值过来的xpub 派生出walletId
					self.wallet_Id = crypto.createHash("sha256").update(self.tempPubKey.toString(), "utf8").digest("base64");
					self.obj_to_sign = {
						"type": "h1",
						"id": self.wallet_Id,
						"v": self.tempValue
					};
					// 需要展示的信息（ 二维码 ）
					self.qrCodeColdwallet2 = "TTT:" + JSON.stringify(self.obj_to_sign);
					self.isErr = 0;
					$scope.index.askColdwalletQrcode = false;
					break;

				case "c2" :
					if (self.tempValue == obj_from_coldWallet.v) {
						var opts = {
							m: 1,
							n: 1,
							name: "TTT(*)",
							xPubKey: self.tempPubKey,
							account: self.tempAccount,
							network: 'livenet',
							cosigners: []
						};
						var coldDeviceAddr = obj_from_coldWallet.addr;
						$timeout(function () {
							profileService.createColdWallet(opts, coldDeviceAddr, function (err, walletId) {
								if (err) {
									$log.warn(err);
									self.error = err;
									$timeout(function () {
										$rootScope.$apply();
									});
									return;
								}
								if (opts.externalSource) {
									if (opts.n == 1) {
										$rootScope.$emit('Local/WalletImported', walletId);
									}
								}
							});
						}, 100);
					}else {
						// 错误！！！
						self.isErr = 1;
					}
					break;

				default:
					self.isErr = 1;
			}
		}

	};

	// 点击开始导入   判断所扫描的认证码是否有效 以确定按键能否点击
	self.askColdwalletQrcode = function () {
		if(self.isErr != 0){
			return;
		}
		$scope.index.askColdwalletQrcode = true;
		self.finishHot = 1;
	};
});
