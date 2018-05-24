'use strict';
var Mnemonic = require("bitcore-mnemonic");
var Bitcore = require("bitcore-lib");
var objectHash = require('trustnote-common/object_hash.js');
var breadcrumbs = require('trustnote-common/breadcrumbs.js');
var constants = require('trustnote-common/constants.js');
var eventBus = require('trustnote-common/event_bus.js');

angular.module('copayApp.controllers').controller('airDrop', function ($scope, $rootScope, go, profileService,$timeout,gettext, gettextCatalog,isCordova,configService,storageService,nodeWebkit,uxLanguage) {
	var self = this;
	var indexScope = $scope.index;
	var config = configService.getSync();
	var configWallet = config.wallet;
	var walletSettings = configWallet.settings;
	var crypto = require("crypto");
	var db = require('trustnote-common/db.js');

	self.unitValue = walletSettings.unitValue;
	self.bbUnitValue = walletSettings.bbUnitValue;

	self.candyTokenArr = [];
	self.candyOutputArr = [];
	self.candyHistoryList = [];
	self.candyAmount = '';
	self.redPacketCount = '';
	self.candyTotalCount = 0;
	self.bSendAll = false;
	self.showSeedList = false;
	self.showSeedFlag = '';
	self.curentHistorySeed = [];
	self.seeds = '';
	self.mnemonic = new Mnemonic('fury car kingdom design boat please trust enrich empower era paper erase');
	self.token = '';

	self.T_count_placeholder = gettextCatalog.getString('Enter number');

	self.amountWarring = false;
	self.countWarring = false;
	self.amountWarringMsg = '';
	self.countWarringMsg = '';
	self.submitAble = true;
	self.submitAction = false;
	self.submitText = gettextCatalog.getString('Generate');
	self.language = 'zh_CN';

	if(uxLanguage.getCurrentLanguage() == 'en'){
		self.language = 'en';
	}else {
		self.language = 'zh_CN';
	}

	self.getCandyTokens = function (num) {
		for(var i = 0 ; i < num ; i++){
			self.candyTokenArr[i] = crypto.randomBytes(32).toString('base64').substr(0,16);

		}
	};

	self.seedCopy = function (){
		if(self.showSeedFlag == 'new'){
			self.seeds = (self.candyTokenArr).join('  ');
		}else if(self.showSeedFlag == 'old'){
			self.seeds = (self.curentHistorySeed).join('  ');
		}
		if (isCordova) {
			window.cordova.plugins.clipboard.copy(self.seeds);
			$timeout(function() {
				self.showCopied = 1;
				$scope.$apply()
			}, 10);
			$timeout(function () {
				self.showCopied = 0;
			}, 3000)
		}else if (nodeWebkit.isDefined()) {
			nodeWebkit.writeToClipboard(self.seeds);
			$timeout(function() {
				self.showCopied = 1;
				$scope.$apply()
			}, 10);
			$timeout(function () {
				self.showCopied = 0;
			}, 1500)
		}
	}

	self.checkNumber = function (msg) {
		if(msg == 'amount'){
			if(self.candyAmount <= 0){
				self.amountWarring = true;
				self.amountWarringMsg = gettextCatalog.getString('Invalid amount');
			}else if(typeof(self.candyAmount) != 'number'){
				self.amountWarring = true;
				self.amountWarringMsg = gettextCatalog.getString('Invalid amount');
			}else if(self.candyAmount > 200){
				self.amountWarring = true;
				self.amountWarringMsg = gettextCatalog.getString('Single T Code should less than 200');
			}else{
				self.amountWarring = false;
			}

		}else if(msg == 'count'){
			if(self.redPacketCount < 1){
				self.countWarring = true;
				self.countWarringMsg = gettextCatalog.getString('You are naughty. Please send 1 at least ');
			}else if(typeof(self.candyAmount) != 'number'){
				self.amountWarring = true;
				self.amountWarringMsg = gettextCatalog.getString('Invalid amount');
			}else if(self.redPacketCount > 100){
				self.countWarring = true;
				self.countWarringMsg = gettextCatalog.getString('Maximum T Code number 100');
			}else {
				self.countWarring = false;
			}
		}
	}

	self.submitForm = function () {
		if((self.redPacketCount * (self.candyAmount*1000000+40)+548) > $scope.index.arrMainWalletBalances[$scope.index.assetIndex].stable){
			self.submitAble = false;
			$timeout(function () {
				self.submitAble = true;
			},2000);
			return false;
		}
		self.submitAction = true;
		self.candyOutputArr = [];
		self.showSeedFlag = 'new';
		var xPrivKey = '';
		var wallet_xPubKey = '';
		var candyAddress = '';
		var form = $scope.sendCandyForm;
		var amount = form.candyAmount.$modelValue;  // MN 个数
		var redPacketCount = form.redPacketCount.$modelValue;

		self.getCandyTokens(redPacketCount);

		if ($scope.index.arrBalances.length === 0)
			return console.log('send payment: no balances yet');

		var fc = profileService.focusedClient;
		var unitValue = self.unitValue;
		var bbUnitValue = self.bbUnitValue;

		if (!form)
			return console.log('form is gone');
		if (form.$invalid) {
			this.error = gettext('Unable to send transaction proposal');
			return;
		}
		// ***** 判断 当前设备 是否有密码加密 *****
		if (fc.isPrivKeyEncrypted()) {
			profileService.unlockFC(null, function (err) {
				if (err){
					return self.setSendError(gettextCatalog.getString(err.message));
				}
				return self.submitForm();
			});
			return;
		}

		var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
		var address;
		if(redPacketCount==1){
			// xPrivKey = self.xPrivKey(self.candySeedArr[0]);
			xPrivKey = self.mnemonic.toHDPrivateKey(self.candyTokenArr[0]);
			wallet_xPubKey = self.walletPubKey(xPrivKey, 0);
			address = self.walletAddress(wallet_xPubKey, 0, 0);
		}
		var assocDeviceAddressesByPaymentAddress = {};
		var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];

		var merkle_proof = '';
		if (form.merkle_proof && form.merkle_proof.$modelValue)
			merkle_proof = form.merkle_proof.$modelValue.trim();
		if (asset === "base")
			amount *= unitValue;
		if (asset === constants.BLACKBYTES_ASSET)
			amount *= bbUnitValue;
		amount = Math.round(amount);
		if(redPacketCount > 1){
			for(var i = 0 ; i < self.candyTokenArr.length ; i++){
				// xPrivKey = self.xPrivKey(self.candySeedArr[i]);
				xPrivKey = self.mnemonic.toHDPrivateKey(self.candyTokenArr[i]);
				wallet_xPubKey = self.walletPubKey(xPrivKey, 0);
				candyAddress = self.walletAddress(wallet_xPubKey, 0, 0);
				console.log(candyAddress);
				self.candyOutputArr.push({
					"address": candyAddress,
					"amount": amount
				})
			}
		}

		var current_payment_key = '' + asset + address + amount;
		if (current_payment_key === self.current_payment_key)
			return $rootScope.$emit('Local/ShowErrorAlert', "This payment is already under way");
		self.current_payment_key = current_payment_key;

		indexScope.setOngoingProcess(gettext('sending'), true);

		$timeout(function () {
			profileService.requestTouchid(function (err) {
				if (err) {
					profileService.lockFC();
					indexScope.setOngoingProcess(gettext('sending'), false);
					self.error = err;
					$timeout(function () {
						delete self.current_payment_key;
						$scope.$digest();
					}, 1);
					return;
				}

				composeAndSend(address);

				// compose and send
				function composeAndSend(to_address) {
					var arrSigningDeviceAddresses = []; // empty list means that all signatures are required (such as 2-of-2)

					if (fc.credentials.m < fc.credentials.n)
						$scope.index.copayers.forEach(function (copayer) {
							if (copayer.me || copayer.signs)
								arrSigningDeviceAddresses.push(copayer.device_address);
						});
					else if (indexScope.shared_address)
						arrSigningDeviceAddresses = indexScope.copayers.map(function (copayer) {
							return copayer.device_address;
						});

					breadcrumbs.add('sending payment in ' + asset);
					profileService.bKeepUnlocked = true;

					var opts = {
						shared_address: indexScope.shared_address,
						merkle_proof: merkle_proof,
						asset: asset,
						to_address: to_address,
						amount: amount * redPacketCount,
						send_all: self.bSendAll,
						arrSigningDeviceAddresses: arrSigningDeviceAddresses,
						recipient_device_address: recipient_device_address,
						candyOutput:self.candyOutputArr
					};
					self.sendtoaddress = opts.to_address;
					//self.sendamount = opts.amount/1000000 + "MN";

					var eventListeners = eventBus.listenerCount('apiTowalletHome');

					self.reCallApiToWalletHome = function (account, is_change, address_index, text_to_sign, cb) {
						var coin = (profileService.focusedClient.credentials.network == 'livenet' ? "0" : "1");
						var path = "m/44'/" + coin + "'/" + account + "'/" + is_change + "/" + address_index;

						var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
						var privateKey = xPrivKey.derive(path).privateKey;
						var privKeyBuf = privateKey.bn.toBuffer({size: 32});
						var signature = ecdsaSig.sign(text_to_sign, privKeyBuf);
						cb(signature);
						eventBus.once('apiTowalletHome', self.reCallApiToWalletHome);
					};

					self.callApiToWalletHome = function (account, is_change, address_index, text_to_sign, cb) {
						var coin = (profileService.focusedClient.credentials.network == 'livenet' ? "0" : "1");
						var path = "m/44'/" + coin + "'/" + account + "'/" + is_change + "/" + address_index;

						var obj = {
							"type": "h2",
							"sign": text_to_sign.toString("base64"),
							"path": path,
							"addr": opts.to_address,
							"amount": opts.amount,
							"v": Math.floor(Math.random()*9000+1000)
						};
						self.text_to_sign_qr = 'TTT:' + JSON.stringify(obj);
						$timeout(function() {
							profileService.tempNum2 = obj.v;
							$scope.$apply();
						}, 10);
						eventBus.once('apiTowalletHome', self.callApiToWalletHome);

						var finishListener = eventBus.listenerCount('finishScaned');
						if(finishListener > 0) {
							eventBus.removeAllListeners('finishScaned');
						}
						eventBus.once('finishScaned', function (signature) {
							cb(signature);
						});
					};

					if(eventListeners > 0) {
						eventBus.removeAllListeners('apiTowalletHome');
						if(fc.observed)
							eventBus.once('apiTowalletHome', self.callApiToWalletHome);
						else
							eventBus.once('apiTowalletHome', self.reCallApiToWalletHome);
					}
					else {
						if(fc.observed)
							eventBus.once('apiTowalletHome', self.callApiToWalletHome);
						else
							eventBus.once('apiTowalletHome', self.reCallApiToWalletHome);
					}

					fc.sendMultiPayment(opts, function (err) {
						indexScope.setOngoingProcess(gettext('sending'), false);  // if multisig, it might take very long before the callback is called
						breadcrumbs.add('done payment in ' + asset + ', err=' + err);
						delete self.current_payment_key;
						profileService.bKeepUnlocked = false;

						if (err) {
							if (typeof err === 'object') {
								err = JSON.stringify(err);
								eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
							}
							else if (err.match(/device address/))
								err = "This is a private asset, please send it only by clicking links from chat";

							else if (err.match(/no funded/))
								err = gettextCatalog.getString('Not enough spendable funds') ;

							else if (err.match(/connection closed/))
								err = gettextCatalog.getString('[internal] connection closed') ;
							else if (err.match(/one of the cosigners refused to sign/))
								err = gettextCatalog.getString('one of the cosigners refused to sign') ;
							else if (err.match(/funds from/))
								err = err.substring(err.indexOf("from")+4, err.indexOf("for")) + gettextCatalog.getString(err.substr(0,err.indexOf("from"))) + gettextCatalog.getString(". It needs atleast ")  + parseInt(err.substring(err.indexOf("for")+3, err.length))/1000000 + "MN";
							else if(err == "close") {
								err = "suspend transaction.";
							}
							return self.setSendError(err);
						}else {
							self.showSeedList = true;
							self.candyHistoryList.unshift({
								amount:(amount * redPacketCount/1000000),
								time: CurentTime(),
								seeds:self.candyTokenArr
							});

							var arrValues = [];
							var walletId = profileService.focusedClient.credentials.walletId;
							var creation_date = CurentTime();
							for(var i = 0; i < self.candyTokenArr.length; i++) {
								arrValues.push("('"+walletId+"','"+self.candyTokenArr[0]+"','"+self.candyTokenArr[i]+"',"+amount+","+0+",'"+creation_date+"')");
							}
							var strValues = arrValues.join(",");
							//console.log(strValues);

							db.query("INSERT INTO tcode (wallet,num,code,amount,is_spent,creation_date) values" + strValues, function () {
								$timeout(function () {
									self.gened = 1;
								},10);
								$timeout(function () {
									self.submitAction = false;
									self.gened = 0;
								},3000);


								$rootScope.$emit("NewOutgoingTx");
							});


						}

					});
				}
			});
		}, 100);
	};

	//根据助记词生成根私钥
	self.xPrivKey = function (mnemonic) {
		try {
			var xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
			return xPrivKey.toString();
		} catch (error) {
			return 0;
		}
	}
	//钱包公钥
	self.walletPubKey = function (xPrivKey, num) {
		try {
			var wallet_xPubKey = Bitcore.HDPublicKey(xPrivKey.derive("m/44'/0'/" + num + "'"));
			return wallet_xPubKey.toString();
		} catch (error) {
			return 0;
		}
	}
	//生成钱包的地址
	self.walletAddress = function (wallet_xPubKey, change, num) {
		try {
			wallet_xPubKey = Bitcore.HDPublicKey.fromString(wallet_xPubKey);
			var wallet_xPubKey_base64 = wallet_xPubKey.derive("m/" + change + "/" + num).publicKey.toBuffer().toString("base64");
			var address = objectHash.getChash160(["sig", {
				"pubkey": wallet_xPubKey_base64
			}]);
			return address;
		} catch (error) {
			return 0;
		}
	}
	// 发送交易 失败
	self.setSendError = function (err) {
		var fc = profileService.focusedClient;
		var prefix = fc.credentials.m > 1 ? gettextCatalog.getString('Could not create payment proposal') : gettextCatalog.getString('Could not send payment');

		self.error = prefix + ": " + err;
		console.log(this.error);

		$timeout(function () {
			$scope.$digest();
		}, 1);
	};
	self.resetError = function () {
		self.error = null;
	};
	//获取当前时间
	function CurentTime(){
		var now = new Date();

		var year = now.getFullYear();       //年
		var month = now.getMonth() + 1;     //月
		var day = now.getDate();            //日

		var hh = now.getHours();            //时
		var mm = now.getMinutes();          //分
		var ss = now.getSeconds();

		var clock = year + "-";

		if(month < 10)
			clock += "0";

		clock += month + "-";

		if(day < 10)
			clock += "0";

		clock += day + " ";

		if(hh < 10)
			clock += "0";

		clock += hh + ":";
		if (mm < 10) clock += '0';
		clock += mm + ":";
		if(ss < 10) clock += '0';
		clock += ss;
		return clock;
	}

	// 历史记录发红包列表 ####### ####### ####### ####### ####### ####### ####### ####### ####### ####### #######
	self.getHistoryList = function () {
		var fcWalletId = profileService.focusedClient.credentials.walletId;
		db.query("SELECT wallet,num,sum(amount) as amount,creation_date from tcode where wallet='"+fcWalletId+"' GROUP BY num ORDER BY creation_date DESC;", function (rows) {
			self.recordsList = rows;
			$timeout(function () {
				$scope.$apply();
			}, 100);
		});
	};
	self.getHistoryList();

	// 点击进入相应 T 口令的详细信息
	self.clicked = function (num) {
		var txId = self.recordsList[num].num;
		db.query("SELECT wallet,num,amount,code,creation_date from tcode where num='"+txId+"' ORDER BY creation_date DESC;", function (rows) {
			self.detileList = rows;
			$timeout(function () {
				$scope.$apply();
			}, 100);
		});
	};
	// 点击复制 T 口令
	self.copyall = function () {
		var temArr = [];
		for(var i = 0; i < self.detileList.length; i++){
			temArr.push(self.detileList[i].code);
		}
		self.copyedToBoard = temArr.join('   ');
		if (isCordova) {
			window.cordova.plugins.clipboard.copy(self.copyedToBoard);
			$timeout(function() {
				self.showCopied = 1;
				$scope.$apply()
			}, 10);
			$timeout(function () {
				self.showCopied = 0;
			}, 1500)
		}else if (nodeWebkit.isDefined()) {
			nodeWebkit.writeToClipboard(self.copyedToBoard);
			$timeout(function() {
				self.showCopied = 1;
				$scope.$apply()
			}, 10);
			$timeout(function () {
				self.showCopied = 0;
			}, 1500)
		}
	}

});
