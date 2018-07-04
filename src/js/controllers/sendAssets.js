'use strict';

angular.module('copayApp.controllers').controller('sendAssets', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout) {
	var self = this;
	var indexScope = $scope.index;
	var https = require('https');

	self.error = false;
	self.ableClick = true; // 默认按钮可点击
	self.showSending = 0; // 默认不显示 sending
	self.onloading = true; // 初始化 显示
	self.txid = go.objSendAsset; // go 中传递过来的 txid

	self.sendMsgDir = function () {
		var content = self.txid;
		var options = {
			hostname: 'itoken.top',
			port: 443,
			path: '/webwallet/getoutputs?txid='+content,
			method: 'GET',
			timeout: 6000,
			headers: {
				'referer': 'trustnote.org'
			}
		};
		var req = https.request(options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (data) {
				data = JSON.parse(data);
				if(res.statusCode == 200 && data.errCode == 0){
					self.assetsType = data.data.assetName; // 发送资产类型 symbol
					self.message = data.data.message;
					self.outputs = data.data.outputs; // 发送outputs 数组
					self.asset = data.data.asset;  // 资产 例如：base
	 				self.Showasset = self.asset.length > 10 ? self.asset.substr(0,10) + '...' + self.asset.substr(self.asset.length - 10) : self.asset;
					self.onloading = false;
					$timeout(function () {
						$scope.$apply()
					}, 10);
				}else{
					self.onloading = false;
					self.setError(data.errMsg); // 报出  返回的错误
				}
			});
		});
		req.on('error', function (e) {
			console.log("http error");
			self.setError(gettextCatalog.getString('httpErr'));
		});
		req.end();
	};
	self.sendMsgDir();




	/*var data = {
		"errCode": 0,
		"errMsg": "success",
		//     kPI5sZc1e7vG/nik67qDP4N8sjAnnhYRsUTUB/YvsTY=     CC
		//      OHD5P3MEUU3FYODZXH6KUP6IH2UGDKM3     QCCB6ECZBXNREX5H6QGBAKKTOTMXDAMS
		"data": {
			"assetName": "ASSET",
			"asset": "kPI5sZc1e7vG/nik67qDP4N8sjAnnhYRsUTUB/YvsTY=",
			"message": "hello",
			"outputs": [
				{
					"address": "QCCB6ECZBXNREX5H6QGBAKKTOTMXDAMS",
					"amount": 1
				}
				// ,
				// {
				// 	"address": "kdkdkdkdkkdkdkkkdkdkkdk",
				// 	"amount": 10
				// }
				// ,
				// {
				// 	"address": "kdkdkdkdkkdkdkkkdkdkkdk",
				// 	"amount": 10
				// }
			]
		}
	};
	self.assetsType = data.data.assetName; // 发送资产类型 symbol
	self.message = data.data.message;
	self.outputs = data.data.outputs; // 发送outputs 数组
	self.asset = data.data.asset;  // 资产 例如：base
	self.Showasset = self.asset.length > 10? self.asset.substr(0,10) + '...' + self.asset.substr(self.asset.length - 10) : self.asset;
	self.onloading = false;
	self.ableClick = 1;*/






	self.closeSend = function () {
		if(self.ableClick == false){
			return;
		}
		go.path('walletHome');
	};
// 点击发送
	self.sendAssets = function () {
		if(self.ableClick == false){
			return;
		}
		self.isAssetExist = false;
		for(var index in $scope.index.arrBalances) {
			if($scope.index.arrBalances[index].asset === self.asset) {
				self.isAssetExist = true;
				break;
			}
		}
		if(!self.isAssetExist) {
			return self.setError(gettextCatalog.getString('asset does not exist'));
		}

		var fc = profileService.focusedClient;
		if (fc.isPrivKeyEncrypted()) {
			profileService.checkPassClose = false;
			profileService.passWrongUnlockFC(null, function (err) {
				if (err == 'cancel') {  // 点击取消
					self.showSending = 0;
					profileService.checkPassClose = true;
				} else if (err) {  // 密码输入错误
					return;
				}
				else {
					return self.sendAssets();
				}
			});
			return;
		}

		self.showSending = 1;

		self.ableClick = false;
		self.thirdOutputs = [];
		$timeout(function () {
			var address;
			var amount;
			var asset = self.asset;
			if(self.outputs.length == 1){          // 只有一个地址
				address = self.outputs[0].address;
				amount = self.outputs[0].amount;
				self.thirdOutputs = null;
				self.baseOutputs = null;
				if(self.asset != 'base'){
					self.thirdOutputs = [];
					var temamount = amount;
					var temaddr = address;
					amount = 0;
					address = null;
					self.thirdOutputs[0] = {
						"address": temaddr,
						"amount": temamount
					};
				}
			}
			if(self.outputs.length > 1){          // 多个地址
				self.temArr = [];
				for(var i = 0; i < self.outputs.length; i++){
					self.temArr.push({
						"address": self.outputs[i].address,
						"amount": self.outputs[i].amount
					})
				}
				if(self.asset == 'base'){
					self.thirdOutputs = null;
					self.baseOutputs = self.temArr;
				}
				if(self.asset != 'base'){
					amount = 0;
					address = null;
					self.thirdOutputs = self.temArr;
				}
			}
			composeAndSend(address);



			function composeAndSend(address){
				profileService.bKeepUnlocked = true;
				var arrSigningDeviceAddresses = [];
				var merkle_proof = '';
				var assocDeviceAddressesByPaymentAddress = {};
				var recipient_device_address = assocDeviceAddressesByPaymentAddress[address];


				var opts = {
					// shared_address: indexScope.shared_address,
					merkle_proof: merkle_proof,
					asset: asset,
					to_address: address,
					amount: amount * self.outputs.length,
					send_all: self.bSendAll,
					arrSigningDeviceAddresses: arrSigningDeviceAddresses,
					recipient_device_address: recipient_device_address,
					candyOutput: self.baseOutputs,   // MN 资产发送 (多笔转出)
					asset_outputs:self.thirdOutputs   // 第三方 资产发送 (多笔转出)
				};
				var eventListeners = eventBus.listenerCount('apiTowalletHome');

				self.reCallApiToWalletHome = function (account, is_change, address_index, text_to_sign, cb) {
					var coin = (profileService.focusedClient.credentials.network == 'livenet' ? "0" : "1");
					var path = "m/44'/" + coin + "'/" + account + "'/" + is_change + "/" + address_index;

					var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
					var privateKey = xPrivKey.derive(path).privateKey;
					var privKeyBuf = privateKey.bn.toBuffer({ size: 32 });
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
						"v": Math.floor(Math.random() * 9000 + 1000)
					};
					self.text_to_sign_qr = 'TTT:' + JSON.stringify(obj);
					$timeout(function () {
						profileService.tempNum2 = obj.v;
						$scope.$apply();
					}, 10);
					eventBus.once('apiTowalletHome', self.callApiToWalletHome);

					var finishListener = eventBus.listenerCount('finishScaned');
					if (finishListener > 0) {
						eventBus.removeAllListeners('finishScaned');
					}
					eventBus.once('finishScaned', function (signature) {
						cb(signature);
					});
				};

				if (eventListeners > 0) {
					eventBus.removeAllListeners('apiTowalletHome');
					if (fc.observed)
						eventBus.once('apiTowalletHome', self.callApiToWalletHome);
					else
						eventBus.once('apiTowalletHome', self.reCallApiToWalletHome);
				}
				else {
					if (fc.observed)
						eventBus.once('apiTowalletHome', self.callApiToWalletHome);
					else
						eventBus.once('apiTowalletHome', self.reCallApiToWalletHome);
				}


				fc.sendMultiPayment(opts, function (err, unit) {  // 添加 unit 返回数据 当前交易单元
					profileService.bKeepUnlocked = false;
					if (err) {
						if (typeof err === 'object') {
							err = JSON.stringify(err);
							eventBus.emit('nonfatal_error', "error object from sendMultiPayment: " + err, new Error());
						}
						else if (err.match(/device address/))
							err = "This is a private asset, please send it only by clicking links from chat";

						else if (err.match(/no funded/))
							err = gettextCatalog.getString('Not enough spendable funds');

						else if (err.match(/connection closed/))
							err = gettextCatalog.getString('[internal] connection closed');
						else if (err.match(/one of the cosigners refused to sign/))
							err = gettextCatalog.getString('one of the cosigners refused to sign');
						else if (err.match(/funds from/))
							err = err.substring(err.indexOf("from") + 4, err.indexOf("for")) + gettextCatalog.getString(err.substr(0, err.indexOf("from"))) + gettextCatalog.getString(". It needs atleast ") + parseInt(err.substring(err.indexOf("for") + 3, err.length)) / 1000000 + "MN";
						else if (err == "close") {
							err = "suspend transaction.";
						}
						self.showSending = 0;
						self.ableClick = true;
						return self.setError(err);
					} else {
						var objDataToWeb = {
							'txid':self.txid,
							'unit':unit
						};

						var options = {
							hostname: 'itoken.top',
							port: 443,
							path: '/webwallet/updateoutputs',
							method: 'POST',
							timeout: 6000,
							headers: {
								'Content-Type': 'application/json',
								'referer': 'trustnote.org'
							}
						};
						var req = https.request(options, function (res) {
							res.setEncoding('utf8');
							res.on('data', function (data) {
								data = JSON.parse(data);
								if (res.statusCode == 200 && data.errCode == 0) {
									$rootScope.$emit("NewOutgoingTx");
									$timeout(function () {
										go.path('walletHome');
									}, 1000)
								}else{
									self.ableClick = true;
									self.setError(data.errMsg);

								}
							});
						});

						req.on('error', function (e) {
							console.log("http error");
							self.ableClick = true;
							self.setError(gettextCatalog.getString('httpErr'));
						});
						req.write(JSON.stringify(objDataToWeb));
						req.end();
					}

				});
			}
		}, 100);
	};

	// 返回数据错误
	self.setError = function (err) {
		self.error = err;
	};
});


