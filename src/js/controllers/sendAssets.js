'use strict';

angular.module('copayApp.controllers').controller('sendAssets', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout) {
	var self = this;
	var indexScope = $scope.index;
	var https = require('http');// *************************** 待修改

	self.objSendAsset = go.objSendAsset;

	/*self.sendMsgDir = function () {
		// var content = self.objSendAsset.sendAssetMsg;      // *************************** 待修改
		var content = '4050407046ef33a0149c8b6fe15d616feeac420145e97ebce4588398c5cf6e1b';

		var options = {
			hostname: '10.10.10.169',   // *************************** 待修改
			port: 3003,
			path: '/webwallet/getoutputs?txid='+content,
			method: 'GET',
			timeout: 6000,
			headers: {
				'Content-Type':'application/json',
				'referer': 'trustnote.org'
			}
		};

		var req = https.request(options, function (res) {
			res.setEncoding('utf8');
			res.on('data', function (data) {
				if(res.statusCode == 200 && data.errCode == 0){
					self.assetsType = data.data.assetName; // 发送资产类型
					self.outputs = data.data.outputs; // 发送outputs 数组



				}
			});
		});

		req.on('error', function (e) {
			console.log("http error");
		});
		req.end();

	};
	self.sendMsgDir();*/




// 示例
	self.dataEx = {
		"errCode": 0,
		"errMsg": "success",
		"data": {
			"assetName": "MN",
			"asset": "base",
			"message": "hello",
			"outputs": [
				{
					"address": "QCCB6ECZBXNREX5H6QGBAKKTOTMXDAMS",
					"amount": 1
				},
				{
					"address": "OHD5P3MEUU3FYODZXH6KUP6IH2UGDKM3",
					"amount": 1
				}
			]
		}
	};

	self.assetsType = self.dataEx.data.assetName;
	self.outputs = self.dataEx.data.outputs;

	self.asset = self.dataEx.data.asset;
	//self.asset = 'kPI5sZc1e7vG/nik67qDP4N8sjAnnhYRsUTUB/YvsTY=';








// 点击发送
	self.sendAssets = function () {
		var fc = profileService.focusedClient;

		if (fc.isPrivKeyEncrypted()) {
			profileService.unlockFC(null, function (err) {
				if (err) {
					$timeout(function () {
						$scope.$apply()
					}, 10);
					return self.setSendError(gettextCatalog.getString(err.message));
				}
				return self.sendAssets();
			});
			return;
		}


		self.thirdOutputs = [];
		$timeout(function () {
			var address;
			var amount;
			var asset = self.asset;

			if(self.outputs.length == 1){          // 只有一个地址
				address = self.outputs[0].address;
				amount = self.outputs[0].amount;

				if(self.asset != 'base'){
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
					shared_address: indexScope.shared_address,
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


				fc.sendMultiPayment(opts, function (err) {
					//indexScope.setOngoingProcess(gettext('sending'), false);  // if multisig, it might take very long before the callback is called
					//breadcrumbs.add('done payment in ' + asset + ', err=' + err);
					//delete self.current_payment_key;
					profileService.bKeepUnlocked = false;
					if (err) {
						// self.hasClicked = 0;
						// self.geneding = 0;
						$timeout(function () {
							$scope.$apply()
						}, 10);
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
						return self.setSendError(err);
					} else {

						alert(11111)
						//self.showSeedList = true;
						// self.candyHistoryList.unshift({
						// 	amount: (amount * redPacketCount / 1000000),
						// 	time: CurentTime(),
						// 	seeds: self.candyTokenArr
						// });
						//var arrValues = [];
						//profileService.temArrValues = [];
						//var walletId = profileService.focusedClient.credentials.walletId;
						//var creation_date = CurentTime();
						// for (var i = 0; i < self.candyTokenArr.length; i++) {  // candyOutputArr1
                        //
						// 	var tobj = {
						// 		'code':self.candyTokenArr[i],
						// 		'amount':tempAmount,
						// 		'asset_name':asset_name
						// 	};
						// 	profileService.temArrValues.push(tobj);
                        //
						// 	arrValues.push("('" + walletId + "','" + asset +"','"+ asset_name +"','"+ self.candyTokenArr[0] + "','" + self.candyTokenArr[i] + "','" + self.tempArrAddress[i].address + "'," + tempAmount  + "," + 0 + ",'" + creation_date + "')");
						// }
						//var strValues = arrValues.join(",");


						// db.query("INSERT INTO tcode (wallet,asset,asset_name,num,code,address,amount,is_spent,creation_date) values" + strValues, function () {
						// 	$timeout(function () {
						// 		self.gened = 1;
						// 		self.redPacketCount = '';
						// 		self.candyAmount = '';
						// 		self.hasClicked = 0;
						// 		self.geneding = 0;
						// 	}, 10);
                        //
						// 	go.toShowTcode();
						// 	self.getTemArr();
                        //
						// 	$timeout(function () {
						// 		self.gened = 0;
						// 	}, 3000);
                        //
						// 	$rootScope.$emit("NewOutgoingTx");
                        //
						// });
					}

				});
			}
		}, 100);
	};

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
});


