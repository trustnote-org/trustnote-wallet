/**
 * Created by gaoyang on 2018/1/22.
 */
'use strict';

angular.module('copayApp.controllers').controller('recoveryFromSeeddir', function ($rootScope, $scope, $log, gettext, $timeout, gettextCatalog, profileService, go, notification, storageService) {
	var async = require('async');
	var conf = require('trustnote-common/conf.js');
	var wallet_defined_by_keys = require('trustnote-common/wallet_defined_by_keys.js');
	var objectHash = require('trustnote-common/object_hash.js');
	try {
		var ecdsa = require('secp256k1');
	}
	catch (e) {
		var ecdsa = require('trustnote-common/node_modules/secp256k1' + '');
	}
	var Mnemonic = require('bitcore-mnemonic');
	var Bitcore = require('bitcore-lib');
	var db = require('trustnote-common/db.js');
	var network = require('trustnote-common/network');
	var myWitnesses = require('trustnote-common/my_witnesses');
	var fc = profileService.focusedClient;


	// 更改代码
	var successMsg = gettext('Backup words deleted');
	var self = this;

	self.error = '';
	self.bLight = conf.bLight;
	self.scanning = false;
	self.inputMnemonic = '';
	self.xPrivKey = '';
	self.assocIndexesToWallets = {};
	self.credentialsEncrypted = false;
	var reg = new RegExp(/^[a-z]+$/);

	// 定义模态框 的显示
	self.show = false;


	// 删除口令 （ 修改后 ）
	self.delteConfirm = function () {
		fc.clearMnemonic();
		profileService.clearMnemonic(function () {
			// self.deleted = true;
			notification.success(successMsg);
			// go.walletHome();
		});

	};


	self.passwordRequest = function (msg) {
		self.credentialsEncrypted = true;
		$timeout(function () {
			$scope.$apply();
		});
		profileService.unlockFC(msg, function (err) {
			if (typeof(err) !== "undefined") {
				if (typeof(err.message) === "undefined")
					return;
				if (err.message === "Wrong password") {
					$timeout(function () {
						self.passwordRequest(gettextCatalog.getString(err.message));
					}, 500);
				}
				return;
			}
			else if (err) {
				return;
			}
			profileService.disablePrivateKeyEncryptionFC(function (err) {
				$rootScope.$emit('Local/NewEncryptionSetting');
				if (err) {
					self.credentialsEncrypted = true;
					return;
				}
			});
			self.credentialsEncrypted = false;
		});
	};

	if (fc.isPrivKeyEncrypted()) {
		self.passwordRequest(gettextCatalog.getString('This will permanently delete all your existing wallets!'));
	}

	function determineIfAddressUsed(address, cb) {
		db.query("SELECT 1 FROM outputs WHERE address = ? LIMIT 1", [address], function (outputsRows) {
			if (outputsRows.length === 1)
				cb(true);
			else {
				db.query("SELECT 1 FROM unit_authors WHERE address = ? LIMIT 1", [address], function (unitAuthorsRows) {
					//cb(unitAuthorsRows.length === 1);  // Victor ShareAddress add third sql
					if (unitAuthorsRows.length === 1)
						cb(true);
					else {
						db.query("SELECT 1 FROM shared_address_signing_paths WHERE address = ? LIMIT 1", [address], function (sharedAddressRows) {
							cb(sharedAddressRows.length === 1);
						});
					}
				});
			}
		});
	}

	function scanForAddressesAndWallets(mnemonic, cb) {
		self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
		var xPubKey;
		var lastUsedAddressIndex = -1;
		var lastUsedWalletIndex = -1;
		var currentAddressIndex = 0;
		var currentWalletIndex = 0;
		var assocMaxAddressIndexes = {};

		function checkAndAddCurrentAddress(is_change) {
			var address = objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + currentAddressIndex)}]);
			determineIfAddressUsed(address, function (bUsed) {
				if (bUsed) {
					lastUsedAddressIndex = currentAddressIndex;
					if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {main: 0};
					if (is_change) {
						assocMaxAddressIndexes[currentWalletIndex].change = currentAddressIndex;
					} else {
						assocMaxAddressIndexes[currentWalletIndex].main = currentAddressIndex;
					}
					currentAddressIndex++;
					checkAndAddCurrentAddress(is_change);
				} else {
					currentAddressIndex++;
					if (currentAddressIndex - lastUsedAddressIndex >= 20) {
						if (is_change) {
							if (lastUsedAddressIndex !== -1) {
								lastUsedWalletIndex = currentWalletIndex;
							}
							if (currentWalletIndex - lastUsedWalletIndex >= 20) {
								cb(assocMaxAddressIndexes);
							} else {
								currentWalletIndex++;
								setCurrentWallet();
							}
						} else {
							currentAddressIndex = 0;
							checkAndAddCurrentAddress(1);
						}
					} else {
						checkAndAddCurrentAddress(is_change);
					}
				}
			})
		}

		function setCurrentWallet() {
			xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
			lastUsedAddressIndex = -1;
			currentAddressIndex = 0;
			checkAndAddCurrentAddress(0);
		}

		setCurrentWallet();
	}

	function removeAddressesAndWallets(cb) {
		var arrQueries = [];
		db.addQuery(arrQueries, "DELETE FROM pending_shared_address_signing_paths");
		//db.addQuery(arrQueries, "DELETE FROM shared_address_signing_paths");
		db.addQuery(arrQueries, "DELETE FROM pending_shared_addresses");
		//db.addQuery(arrQueries, "DELETE FROM shared_addresses");
		db.addQuery(arrQueries, "DELETE FROM my_addresses");
		db.addQuery(arrQueries, "DELETE FROM wallet_signing_paths");
		db.addQuery(arrQueries, "DELETE FROM extended_pubkeys");
		db.addQuery(arrQueries, "DELETE FROM wallets");
		db.addQuery(arrQueries, "DELETE FROM correspondent_devices");

		async.series(arrQueries, cb);
	}

	function createAddresses(assocMaxAddressIndexes, cb) {
		var accounts = Object.keys(assocMaxAddressIndexes);
		var currentAccount = 0;

		function addAddress(wallet, is_change, index, maxIndex) {
			wallet_defined_by_keys.issueAddress(wallet, is_change, index, function (addressInfo) {
				index++;
				if (index <= maxIndex) {
					addAddress(wallet, is_change, index, maxIndex);
				} else {
					if (is_change) {
						currentAccount++;
						(currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
					} else {
						startAddToNewWallet(1);
					}
				}
			});
		}

		function startAddToNewWallet(is_change) {
			if (is_change) {
				if (assocMaxAddressIndexes[accounts[currentAccount]].change !== undefined) {
					addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 1, 0, assocMaxAddressIndexes[accounts[currentAccount]].change);
				} else {
					currentAccount++;
					(currentAccount < accounts.length) ? startAddToNewWallet(0) : cb();
				}
			} else {
				addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 0, 0, assocMaxAddressIndexes[accounts[currentAccount]].main + 20);
			}
		}


		startAddToNewWallet(0);
	}

	function createWallets(arrWalletIndexes, cb) {

		function createWallet(n) {
			var account = parseInt(arrWalletIndexes[n]);
			var opts = {};
			opts.m = 1;
			opts.n = 1;
			opts.name = 'Wallet #' + account;
			opts.network = 'livenet';
			opts.cosigners = [];
			opts.extendedPrivateKey = self.xPrivKey;
			opts.mnemonic = self.inputMnemonic;
			opts.account = account;

			profileService.createWallet(opts, function (err, walletId) {
				self.assocIndexesToWallets[account] = walletId;
				n++;
				(n < arrWalletIndexes.length) ? createWallet(n) : cb();
			});
		}

		createWallet(0);
	}

	function scanForAddressesAndWalletsInLightClient(mnemonic, cb) {
		self.xPrivKey = new Mnemonic(mnemonic).toHDPrivateKey();
		var xPubKey;
		var currentWalletIndex = 0;
		var lastUsedWalletIndex = -1;
		var assocMaxAddressIndexes = {};

		function checkAndAddCurrentAddresses(is_change) {
			if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {
				main: 0,
				change: 0
			};
			var arrTmpAddresses = [];
			for (var i = 0; i < 20; i++) {
				var index = (is_change ? assocMaxAddressIndexes[currentWalletIndex].change : assocMaxAddressIndexes[currentWalletIndex].main) + i;
				arrTmpAddresses.push(objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + index)}]));
			}
			myWitnesses.readMyWitnesses(function (arrWitnesses) {
				network.requestFromLightVendor('light/get_history', {
					addresses: arrTmpAddresses,
					witnesses: arrWitnesses
				}, function (ws, request, response) {
					if (response && response.error) {
						var breadcrumbs = require('trustnote-common/breadcrumbs.js');
						breadcrumbs.add('Error scanForAddressesAndWalletsInLightClient: ' + response.error);
						self.error = 'When scanning an error occurred, please try again later.';
						self.scanning = false;

						// 定义模态框 出错后 模态框不显示
						self.show = false;

						$timeout(function () {
							$rootScope.$apply();
						});
						return;
					}
					if (Object.keys(response).length) {
						lastUsedWalletIndex = currentWalletIndex;
						if (is_change) {
							assocMaxAddressIndexes[currentWalletIndex].change += 20;
						} else {
							assocMaxAddressIndexes[currentWalletIndex].main += 20;
						}
						checkAndAddCurrentAddresses(is_change);
					} else {
						if (is_change) {
							if (assocMaxAddressIndexes[currentWalletIndex].change === 0 && assocMaxAddressIndexes[currentWalletIndex].main === 0) delete assocMaxAddressIndexes[currentWalletIndex];
							currentWalletIndex++;
							if (currentWalletIndex - lastUsedWalletIndex > 3) {
								cb(assocMaxAddressIndexes);
							} else {
								setCurrentWallet();
							}
						} else {
							checkAndAddCurrentAddresses(1);
						}
					}
				});
			},'wait');
		}

		function setCurrentWallet() {
			xPubKey = Bitcore.HDPublicKey(self.xPrivKey.derive("m/44'/0'/" + currentWalletIndex + "'"));
			checkAndAddCurrentAddresses(0);
		}

		setCurrentWallet();
	}

	function cleanAndAddWalletsAndAddresses(assocMaxAddressIndexes) {
		var device = require('trustnote-common/device');
		var arrWalletIndexes = Object.keys(assocMaxAddressIndexes);
		if (arrWalletIndexes.length) {
			removeAddressesAndWallets(function () {
				var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
				profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
					device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
					createWallets(arrWalletIndexes, function () {
						createAddresses(assocMaxAddressIndexes, function () {
							self.scanning = false;
							self.show = false;
							// 向内存中写入2
							self.haschoosen();

							// 更改代码   正常恢复
							$rootScope.$emit('Local/ShowAlertdir', arrWalletIndexes.length + gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {
								if (navigator && navigator.app) // android
									navigator.app.exitApp();

								else if (process.exit) // nwjs
									process.exit();
							});
						});
					});
				});
			});
		} else {
			removeAddressesAndWallets(function () {
				arrWalletIndexes[0] = 0;
				var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
				profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
					device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
					createWallets(arrWalletIndexes, function () {
						self.scanning = false;
						self.show = false;
						// 向内存中写入2
						self.haschoosen();

						// 更改代码   没有交易恢复
						$rootScope.$emit('Local/ShowAlertdir', arrWalletIndexes.length + gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {
							if (navigator && navigator.app) // android
								navigator.app.exitApp();

							else if (process.exit) // nwjs
								process.exit();
						});
					});
				});
			});
			// self.error = 'No active addresses found.';
			// self.scanning = false;
			// $timeout(function () {
			// 	$rootScope.$apply();
			// });
		}
	}


	// 更改代码 添加监听事件 恢复成功 弹出确认框
	self.showPopup = function (msg, msg_icon, cb) {
		$log.warn('Showing ' + msg_icon + ' popup:' + msg);
		self.showAlert = {
			msg: msg.toString(),
			msg_icon: msg_icon,
			close: function (err) {
				self.showAlert = null;
				if (cb) return cb(err);
			},
		};
		$timeout(function () {
			$rootScope.$apply();
		});
	};

	$rootScope.$on('Local/ShowAlertdir', function (event, msg, msg_icon, cb) {
		self.showPopup(msg, msg_icon, cb);
	});


	// 点击恢复钱包
	self.recoveryForm = function () {
		self.m1 = 0;
		// 首先拼接一下 12个 助记词
		self.strMnemonic();
		if (self.inputMnemonic) {
			self.error = '';
			// 首先转换成小写
			self.inputMnemonic = self.inputMnemonic.toLowerCase();
			if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
				self.scanning = true;

				// 向内存中写入2
				// self.haschoosen();

				// 模态框 显示出来
				self.show = true;

				if (self.bLight) {
					scanForAddressesAndWalletsInLightClient(self.inputMnemonic, cleanAndAddWalletsAndAddresses);

				} else {
					scanForAddressesAndWallets(self.inputMnemonic, cleanAndAddWalletsAndAddresses);
				}
			} else {
				self.error = 'Seed is not valid';
			}
		}
	};


// 更改代码 声明一个方法 向存储中写入2
	self.haschoosen = function () {
		storageService.hashaschoosen(2, function (err) {
		});
	};

	self.delteConfirm = function () {
		fc.clearMnemonic();
		profileService.clearMnemonic(function () {
			self.deleted = true;
			notification.success(successMsg);
		});
	};


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	// 回复钱包并删除口令
	self.recoveryFormdel = function () {
		self.m1 = 0;
		// 首先拼接一下 12个 助记词
		self.strMnemonic();
		if (self.inputMnemonic) {
			self.error = '';
			// 首先转换成小写
			self.inputMnemonic = self.inputMnemonic.toLowerCase();
			if ((self.inputMnemonic.split(' ').length % 3 === 0) && Mnemonic.isValid(self.inputMnemonic)) {
				self.scanning = true;

				// 模态框 显示出来
				self.show = true;

				if (self.bLight) {
					scanForAddressesAndWalletsInLightClient(self.inputMnemonic, cleanAndAddWalletsAndAddressesdel);
				} else {
					scanForAddressesAndWallets(self.inputMnemonic, cleanAndAddWalletsAndAddressesdel);
				}
			} else {
				self.error = 'Seed is not valid';
			}
		}
	};


	function cleanAndAddWalletsAndAddressesdel(assocMaxAddressIndexes) {
		var device = require('trustnote-common/device');
		var arrWalletIndexes = Object.keys(assocMaxAddressIndexes);
		if (arrWalletIndexes.length) {
			removeAddressesAndWallets(function () {
				var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
				profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
					device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
					createWallets(arrWalletIndexes, function () {
						createAddresses(assocMaxAddressIndexes, function () {
							self.scanning = false;
							self.show = false;
							// 向内存中写入2
							self.haschoosen();

							// 更改代码   正常恢复
							$rootScope.$emit('Local/ShowAlertdir', arrWalletIndexes.length + gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {

								self.delteConfirm();
								if (navigator && navigator.app) // android
									navigator.app.exitApp();
								else if (process.exit) // nwjs
									process.exit();
							});
						});
					});
				});
			});
		} else {
			removeAddressesAndWallets(function () {
				arrWalletIndexes[0] = 0;
				var myDeviceAddress = objectHash.getDeviceAddress(ecdsa.publicKeyCreate(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}), true).toString('base64'));
				profileService.replaceProfile(self.xPrivKey.toString(), self.inputMnemonic, myDeviceAddress, function () {
					device.setDevicePrivateKey(self.xPrivKey.derive("m/1'").privateKey.bn.toBuffer({size: 32}));
					createWallets(arrWalletIndexes, function () {
						self.scanning = false;
						self.show = false;
						// 向内存中写入2
						self.haschoosen();

						// 更改代码   没有交易恢复
						$rootScope.$emit('Local/ShowAlertdir', arrWalletIndexes.length + gettextCatalog.getString(" wallets recovered, please restart the application to finish."), 'fi-check', function () {

							self.delteConfirm();
							if (navigator && navigator.app) // android
								navigator.app.exitApp();

							else if (process.exit) // nwjs
								process.exit();
						});
					});
				});
			});
			// self.error = 'No active addresses found.';
			// self.scanning = false;
			// $timeout(function () {
			// 	$rootScope.$apply();
			// });
		}
	}



// 	更改代码： 原来输入框 改为12个input
	self.items = []; // 提示列表
	self.m1 = 0; // 列表显示与否
	self.num = -1; // 控制候选词

	self.jumpNum = 1;
	self.jumpNext = function () {
		window.clearTimeout(self.t)
		var inputList = document.getElementsByClassName('inptMnemonic1');
		if(self.jumpNum == 12){
			return;
		}else{
			self.t = setTimeout(function () {
				inputList[self.jumpNum].focus();
				self.jumpNum++;
			},100);
		}
	};


// 点击提示列表 隐藏Ul and 清空self.items
	self.hideUlclearItems = function () {
		self.m1 = 0;
		self.items = [];
		self.jumpNext();
		//self.strMnemonic();
	};

// input框中 内容变化时 触发对应函数
	self.funReg1 = function () {
		self.items = []
		self.m1 = self.jumpNum = 1;
		if(reg.test(self.mnemonic1)){
			self.str = self.mnemonic1;
			self.funReg();
		}
	};
	self.funReg2 = function () {
		self.items = []
		self.m1 = self.jumpNum = 2;

		if(reg.test(self.mnemonic2)){
			self.str = self.mnemonic2;
			self.funReg();
		}
	};
	self.funReg3 = function () {
		self.items = []
		self.m1 = self.jumpNum = 3;

		if(reg.test(self.mnemonic3)){
			self.str = self.mnemonic3;
			self.funReg();
		}
	};
	self.funReg4 = function () {
		self.items = []
		self.m1 = self.jumpNum = 4;

		if(reg.test(self.mnemonic4)){
			self.str = self.mnemonic4;
			self.funReg();
		}
	};
	self.funReg5 = function () {
		self.items = []
		self.m1 = self.jumpNum = 5;

		if(reg.test(self.mnemonic5)){
			self.str = self.mnemonic5;
			self.funReg();
		}
	};
	self.funReg6 = function () {
		self.items = []
		self.m1 = self.jumpNum = 6;

		if(reg.test(self.mnemonic6)){
			self.str = self.mnemonic6;
			self.funReg();
		}
	};
	self.funReg7 = function () {
		self.items = []
		self.m1 = self.jumpNum = 7;

		if(reg.test(self.mnemonic7)){
			self.items = []
			self.str = self.mnemonic7;
			self.funReg();
		}
	};
	self.funReg8 = function () {
		self.items = []
		self.m1 = self.jumpNum = 8;

		if(reg.test(self.mnemonic8)){
			self.str = self.mnemonic8;
			self.funReg();
		}
	};
	self.funReg9 = function () {
		self.items = []
		self.m1 = self.jumpNum = 9;

		if(reg.test(self.mnemonic9)){
			self.str = self.mnemonic9;
			self.funReg();
		}
	};
	self.funReg10 = function () {
		self.items = []
		self.m1 = self.jumpNum = 10;

		if(reg.test(self.mnemonic10)){
			self.str = self.mnemonic10;
			self.funReg();
		}
	};
	self.funReg11 = function () {
		self.items = []
		self.m1 = self.jumpNum = 11;

		if(reg.test(self.mnemonic11)){
			self.str = self.mnemonic11;
			self.funReg();
		}
	};
	self.funReg12 = function () {
		self.items = []
		self.m1 = self.jumpNum = 12;

		if(reg.test(self.mnemonic12)){
			self.str = self.mnemonic12;
			self.funReg();
		}
	};

// 拼接12个助记词
	self.strMnemonic = function () {
		return self.inputMnemonic = self.mnemonic1 + ' ' + self.mnemonic2 + ' ' + self.mnemonic3 + ' ' + self.mnemonic4 + ' ' + self.mnemonic5 + ' ' + self.mnemonic6 + ' ' + self.mnemonic7 + ' ' + self.mnemonic8 + ' ' + self.mnemonic9 + ' ' + self.mnemonic10 + ' ' + self.mnemonic11 + ' ' + self.mnemonic12;
	};

// input输入框中 处理键盘事件
	self.handleKeyboard = function (e) {
		// 方向键控制选择 提示词
		if (e.keyCode == 40 || e.keyCode == 32) {
			if (self.num >= self.items.length - 1) {
				self.num = 0;
				//console.log('提示列表长度 = ' + self.items.length);
				//console.log('self.num = ' + self.num)
			} else {
				self.num++;
				//console.log('self.num = ' + self.num)
			}
			//self.mnemonic1 += self.items[self.num]
		}
		if (e.keyCode == 38) {
			if (self.num == 0) {
				self.num = self.items.length - 1;
			} else {
				self.num--;
			}
		}
	};

	// 12个 input 方向键 处理
	self.handleKeyboard1 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic1 += self.items[self.num];
			//console.log(self.num)
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();

	};
	self.handleKeyboard2 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic2 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard3 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic3 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard4 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic4 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard5 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic5 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard6 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic6 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard7 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic7 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard8 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic8 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard9 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic9 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard10 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic10 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard11 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic11 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};
	self.handleKeyboard12 = function (e) {
		self.handleKeyboard(e);
		// 回车键 选择候选词
		if (e.keyCode == 13) {
			if (self.num == -1) {
				return
			}
			self.m1 = 0;
			self.mnemonic12 += self.items[self.num];
			self.num = -1;
			self.jumpNext();
		}
		self.strMnemonic();
	};


// 定义提示框内容
	self.funReg = function () {
		self.num = -1;
		var mnemonic = ['abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance', 'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent', 'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album', 'alcohol', 'alert', 'alien', 'all', 'alley', 'allow', 'almost', 'alone', 'alpha', 'already', 'also', 'alter', 'always', 'amateur', 'amazing', 'among', 'amount', 'amused', 'analyst', 'anchor', 'ancient', 'anger', 'angle', 'angry', 'animal', 'ankle', 'announce', 'annual', 'another', 'answer', 'antenna', 'antique', 'anxiety', 'any', 'apart', 'apology', 'appear', 'apple', 'approve', 'april', 'arch', 'arctic', 'area', 'arena', 'argue', 'arm', 'armed', 'armor', 'army', 'around', 'arrange', 'arrest', 'arrive', 'arrow', 'art', 'artefact', 'artist', 'artwork', 'ask', 'aspect', 'assault', 'asset', 'assist', 'assume', 'asthma', 'athlete', 'atom', 'attack', 'attend', 'attitude', 'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn', 'average', 'avocado', 'avoid', 'awake', 'aware', 'away', 'awesome', 'awful', 'awkward', 'axis', 'baby', 'bachelor', 'bacon', 'badge', 'bag', 'balance', 'balcony', 'ball', 'bamboo', 'banana', 'banner', 'bar', 'barely', 'bargain', 'barrel', 'base', 'basic', 'basket', 'battle', 'beach', 'bean', 'beauty', 'because', 'become', 'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'below', 'belt', 'bench', 'benefit', 'best', 'betray', 'better', 'between', 'beyond', 'bicycle', 'bid', 'bike', 'bind', 'biology', 'bird', 'birth', 'bitter', 'black', 'blade', 'blame', 'blanket', 'blast', 'bleak', 'bless', 'blind', 'blood', 'blossom', 'blouse', 'blue', 'blur', 'blush', 'board', 'boat', 'body', 'boil', 'bomb', 'bone', 'bonus', 'book', 'boost', 'border', 'boring', 'borrow', 'boss', 'bottom', 'bounce', 'box', 'boy', 'bracket', 'brain', 'brand', 'brass', 'brave', 'bread', 'breeze', 'brick', 'bridge', 'brief', 'bright', 'bring', 'brisk', 'broccoli', 'broken', 'bronze', 'broom', 'brother', 'brown', 'brush', 'bubble', 'buddy', 'budget', 'buffalo', 'build', 'bulb', 'bulk', 'bullet', 'bundle', 'bunker', 'burden', 'burger', 'burst', 'bus', 'business', 'busy', 'butter', 'buyer', 'buzz', 'cabbage', 'cabin', 'cable', 'cactus', 'cage', 'cake', 'call', 'calm', 'camera', 'camp', 'can', 'canal', 'cancel', 'candy', 'cannon', 'canoe', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'car', 'carbon', 'card', 'cargo', 'carpet', 'carry', 'cart', 'case', 'cash', 'casino', 'castle', 'casual', 'cat', 'catalog', 'catch', 'category', 'cattle', 'caught', 'cause', 'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal', 'certain', 'chair', 'chalk', 'champion', 'change', 'chaos', 'chapter', 'charge', 'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest', 'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'chuckle', 'chunk', 'churn', 'cigar', 'cinnamon', 'circle', 'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay', 'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb', 'clinic', 'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club', 'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee', 'coil', 'coin', 'collect', 'color', 'column', 'combine', 'come', 'comfort', 'comic', 'common', 'company', 'concert', 'conduct', 'confirm', 'congress', 'connect', 'consider', 'control', 'convince', 'cook', 'cool', 'copper', 'copy', 'coral', 'core', 'corn', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple', 'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram', 'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek', 'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch', 'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'cry', 'crystal', 'cube', 'culture', 'cup', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion', 'custom', 'cute', 'cycle', 'dad', 'damage', 'damp', 'dance', 'danger', 'daring', 'dash', 'daughter', 'dawn', 'day', 'deal', 'debate', 'debris', 'decade', 'december', 'decide', 'decline', 'decorate', 'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver', 'demand', 'demise', 'denial', 'dentist', 'deny', 'depart', 'depend', 'deposit', 'depth', 'deputy', 'derive', 'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect', 'develop', 'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'dice', 'diesel', 'diet', 'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt', 'disagree', 'discover', 'disease', 'dish', 'dismiss', 'disorder', 'display', 'distance', 'divert', 'divide', 'divorce', 'dizzy', 'doctor', 'document', 'dog', 'doll', 'dolphin', 'domain', 'donate', 'donkey', 'donor', 'door', 'dose', 'double', 'dove', 'draft', 'dragon', 'drama', 'drastic', 'draw', 'dream', 'dress', 'drift', 'drill', 'drink', 'drip', 'drive', 'drop', 'drum', 'dry', 'duck', 'dumb', 'dune', 'during', 'dust', 'dutch', 'duty', 'dwarf', 'dynamic', 'eager', 'eagle', 'early', 'earn', 'earth', 'easily', 'east', 'easy', 'echo', 'ecology', 'economy', 'edge', 'edit', 'educate', 'effort', 'egg', 'eight', 'either', 'elbow', 'elder', 'electric', 'elegant', 'element', 'elephant', 'elevator', 'elite', 'else', 'embark', 'embody', 'embrace', 'emerge', 'emotion', 'employ', 'empower', 'empty', 'enable', 'enact', 'end', 'endless', 'endorse', 'enemy', 'energy', 'enforce', 'engage', 'engine', 'enhance', 'enjoy', 'enlist', 'enough', 'enrich', 'enroll', 'ensure', 'enter', 'entire', 'entry', 'envelope', 'episode', 'equal', 'equip', 'era', 'erase', 'erode', 'erosion', 'error', 'erupt', 'escape', 'essay', 'essence', 'estate', 'eternal', 'ethics', 'evidence', 'evil', 'evoke', 'evolve', 'exact', 'example', 'excess', 'exchange', 'excite', 'exclude', 'excuse', 'execute', 'exercise', 'exhaust', 'exhibit', 'exile', 'exist', 'exit', 'exotic', 'expand', 'expect', 'expire', 'explain', 'expose', 'express', 'extend', 'extra', 'eye', 'eyebrow', 'fabric', 'face', 'faculty', 'fade', 'faint', 'faith', 'fall', 'false', 'fame', 'family', 'famous', 'fan', 'fancy', 'fantasy', 'farm', 'fashion', 'fat', 'fatal', 'father', 'fatigue', 'fault', 'favorite', 'feature', 'february', 'federal', 'fee', 'feed', 'feel', 'female', 'fence', 'festival', 'fetch', 'fever', 'few', 'fiber', 'fiction', 'field', 'figure', 'file', 'film', 'filter', 'final', 'find', 'fine', 'finger', 'finish', 'fire', 'firm', 'first', 'fiscal', 'fish', 'fit', 'fitness', 'fix', 'flag', 'flame', 'flash', 'flat', 'flavor', 'flee', 'flight', 'flip', 'float', 'flock', 'floor', 'flower', 'fluid', 'flush', 'fly', 'foam', 'focus', 'fog', 'foil', 'fold', 'follow', 'food', 'foot', 'force', 'forest', 'forget', 'fork', 'fortune', 'forum', 'forward', 'fossil', 'foster', 'found', 'fox', 'fragile', 'frame', 'frequent', 'fresh', 'friend', 'fringe', 'frog', 'front', 'frost', 'frown', 'frozen', 'fruit', 'fuel', 'fun', 'funny', 'furnace', 'fury', 'future', 'gadget', 'gain', 'galaxy', 'gallery', 'game', 'gap', 'garage', 'garbage', 'garden', 'garlic', 'garment', 'gas', 'gasp', 'gate', 'gather', 'gauge', 'gaze', 'general', 'genius', 'genre', 'gentle', 'genuine', 'gesture', 'ghost', 'giant', 'gift', 'giggle', 'ginger', 'giraffe', 'girl', 'give', 'glad', 'glance', 'glare', 'glass', 'glide', 'glimpse', 'globe', 'gloom', 'glory', 'glove', 'glow', 'glue', 'goat', 'goddess', 'gold', 'good', 'goose', 'gorilla', 'gospel', 'gossip', 'govern', 'gown', 'grab', 'grace', 'grain', 'grant', 'grape', 'grass', 'gravity', 'great', 'green', 'grid', 'grief', 'grit', 'grocery', 'group', 'grow', 'grunt', 'guard', 'guess', 'guide', 'guilt', 'guitar', 'gun', 'gym', 'habit', 'hair', 'half', 'hammer', 'hamster', 'hand', 'happy', 'harbor', 'hard', 'harsh', 'harvest', 'hat', 'have', 'hawk', 'hazard', 'head', 'health', 'heart', 'heavy', 'hedgehog', 'height', 'hello', 'helmet', 'help', 'hen', 'hero', 'hidden', 'high', 'hill', 'hint', 'hip', 'hire', 'history', 'hobby', 'hockey', 'hold', 'hole', 'holiday', 'hollow', 'home', 'honey', 'hood', 'hope', 'horn', 'horror', 'horse', 'hospital', 'host', 'hotel', 'hour', 'hover', 'hub', 'huge', 'human', 'humble', 'humor', 'hundred', 'hungry', 'hunt', 'hurdle', 'hurry', 'hurt', 'husband', 'hybrid', 'ice', 'icon', 'idea', 'identify', 'idle', 'ignore', 'ill', 'illegal', 'illness', 'image', 'imitate', 'immense', 'immune', 'impact', 'impose', 'improve', 'impulse', 'inch', 'include', 'income', 'increase', 'index', 'indicate', 'indoor', 'industry', 'infant', 'inflict', 'inform', 'inhale', 'inherit', 'initial', 'inject', 'injury', 'inmate', 'inner', 'innocent', 'input', 'inquiry', 'insane', 'insect', 'inside', 'inspire', 'install', 'intact', 'interest', 'into', 'invest', 'invite', 'involve', 'iron', 'island', 'isolate', 'issue', 'item', 'ivory', 'jacket', 'jaguar', 'jar', 'jazz', 'jealous', 'jeans', 'jelly', 'jewel', 'job', 'join', 'joke', 'journey', 'joy', 'judge', 'juice', 'jump', 'jungle', 'junior', 'junk', 'just', 'kangaroo', 'keen', 'keep', 'ketchup', 'key', 'kick', 'kid', 'kidney', 'kind', 'kingdom', 'kiss', 'kit', 'kitchen', 'kite', 'kitten', 'kiwi', 'knee', 'knife', 'knock', 'know', 'lab', 'label', 'labor', 'ladder', 'lady', 'lake', 'lamp', 'language', 'laptop', 'large', 'later', 'latin', 'laugh', 'laundry', 'lava', 'law', 'lawn', 'lawsuit', 'layer', 'lazy', 'leader', 'leaf', 'learn', 'leave', 'lecture', 'left', 'leg', 'legal', 'legend', 'leisure', 'lemon', 'lend', 'length', 'lens', 'leopard', 'lesson', 'letter', 'level', 'liar', 'liberty', 'library', 'license', 'life', 'lift', 'light', 'like', 'limb', 'limit', 'link', 'lion', 'liquid', 'list', 'little', 'live', 'lizard', 'load', 'loan', 'lobster', 'local', 'lock', 'logic', 'lonely', 'long', 'loop', 'lottery', 'loud', 'lounge', 'love', 'loyal', 'lucky', 'luggage', 'lumber', 'lunar', 'lunch', 'luxury', 'lyrics', 'machine', 'mad', 'magic', 'magnet', 'maid', 'mail', 'main', 'major', 'make', 'mammal', 'man', 'manage', 'mandate', 'mango', 'mansion', 'manual', 'maple', 'marble', 'march', 'margin', 'marine', 'market', 'marriage', 'mask', 'mass', 'master', 'match', 'material', 'math', 'matrix', 'matter', 'maximum', 'maze', 'meadow', 'mean', 'measure', 'meat', 'mechanic', 'medal', 'media', 'melody', 'melt', 'member', 'memory', 'mention', 'menu', 'mercy', 'merge', 'merit', 'merry', 'mesh', 'message', 'metal', 'method', 'middle', 'midnight', 'milk', 'million', 'mimic', 'mind', 'minimum', 'minor', 'minute', 'miracle', 'mirror', 'misery', 'miss', 'mistake', 'mix', 'mixed', 'mixture', 'mobile', 'model', 'modify', 'mom', 'moment', 'monitor', 'monkey', 'monster', 'month', 'moon', 'moral', 'more', 'morning', 'mosquito', 'mother', 'motion', 'motor', 'mountain', 'mouse', 'move', 'movie', 'much', 'muffin', 'mule', 'multiply', 'muscle', 'museum', 'mushroom', 'music', 'must', 'mutual', 'myself', 'mystery', 'myth', 'naive', 'name', 'napkin', 'narrow', 'nasty', 'nation', 'nature', 'near', 'neck', 'need', 'negative', 'neglect', 'neither', 'nephew', 'nerve', 'nest', 'net', 'network', 'neutral', 'never', 'news', 'next', 'nice', 'night', 'noble', 'noise', 'nominee', 'noodle', 'normal', 'north', 'nose', 'notable', 'note', 'nothing', 'notice', 'novel', 'now', 'nuclear', 'number', 'nurse', 'nut', 'oak', 'obey', 'object', 'oblige', 'obscure', 'observe', 'obtain', 'obvious', 'occur', 'ocean', 'october', 'odor', 'off', 'offer', 'office', 'often', 'oil', 'okay', 'old', 'olive', 'olympic', 'omit', 'once', 'one', 'onion', 'online', 'only', 'open', 'opera', 'opinion', 'oppose', 'option', 'orange', 'orbit', 'orchard', 'order', 'ordinary', 'organ', 'orient', 'original', 'orphan', 'ostrich', 'other', 'outdoor', 'outer', 'output', 'outside', 'oval', 'oven', 'over', 'own', 'owner', 'oxygen', 'oyster', 'ozone', 'pact', 'paddle', 'page', 'pair', 'palace', 'palm', 'panda', 'panel', 'panic', 'panther', 'paper', 'parade', 'parent', 'park', 'parrot', 'party', 'pass', 'patch', 'path', 'patient', 'patrol', 'pattern', 'pause', 'pave', 'payment', 'peace', 'peanut', 'pear', 'peasant', 'pelican', 'pen', 'penalty', 'pencil', 'people', 'pepper', 'perfect', 'permit', 'person', 'pet', 'phone', 'photo', 'phrase', 'physical', 'piano', 'picnic', 'picture', 'piece', 'pig', 'pigeon', 'pill', 'pilot', 'pink', 'pioneer', 'pipe', 'pistol', 'pitch', 'pizza', 'place', 'planet', 'plastic', 'plate', 'play', 'please', 'pledge', 'pluck', 'plug', 'plunge', 'poem', 'poet', 'point', 'polar', 'pole', 'police', 'pond', 'pony', 'pool', 'popular', 'portion', 'position', 'possible', 'post', 'potato', 'pottery', 'poverty', 'powder', 'power', 'practice', 'praise', 'predict', 'prefer', 'prepare', 'present', 'pretty', 'prevent', 'price', 'pride', 'primary', 'print', 'priority', 'prison', 'private', 'prize', 'problem', 'process', 'produce', 'profit', 'program', 'project', 'promote', 'proof', 'property', 'prosper', 'protect', 'proud', 'provide', 'public', 'pudding', 'pull', 'pulp', 'pulse', 'pumpkin', 'punch', 'pupil', 'puppy', 'purchase', 'purity', 'purpose', 'purse', 'push', 'put', 'puzzle', 'pyramid', 'quality', 'quantum', 'quarter', 'question', 'quick', 'quit', 'quiz', 'quote', 'rabbit', 'raccoon', 'race', 'rack', 'radar', 'radio', 'rail', 'rain', 'raise', 'rally', 'ramp', 'ranch', 'random', 'range', 'rapid', 'rare', 'rate', 'rather', 'raven', 'raw', 'razor', 'ready', 'real', 'reason', 'rebel', 'rebuild', 'recall', 'receive', 'recipe', 'record', 'recycle', 'reduce', 'reflect', 'reform', 'refuse', 'region', 'regret', 'regular', 'reject', 'relax', 'release', 'relief', 'rely', 'remain', 'remember', 'remind', 'remove', 'render', 'renew', 'rent', 'reopen', 'repair', 'repeat', 'replace', 'report', 'require', 'rescue', 'resemble', 'resist', 'resource', 'response', 'result', 'retire', 'retreat', 'return', 'reunion', 'reveal', 'review', 'reward', 'rhythm', 'rib', 'ribbon', 'rice', 'rich', 'ride', 'ridge', 'rifle', 'right', 'rigid', 'ring', 'riot', 'ripple', 'risk', 'ritual', 'rival', 'river', 'road', 'roast', 'robot', 'robust', 'rocket', 'romance', 'roof', 'rookie', 'room', 'rose', 'rotate', 'rough', 'round', 'route', 'royal', 'rubber', 'rude', 'rug', 'rule', 'run', 'runway', 'rural', 'sad', 'saddle', 'sadness', 'safe', 'sail', 'salad', 'salmon', 'salon', 'salt', 'salute', 'same', 'sample', 'sand', 'satisfy', 'satoshi', 'sauce', 'sausage', 'save', 'say', 'scale', 'scan', 'scare', 'scatter', 'scene', 'scheme', 'school', 'science', 'scissors', 'scorpion', 'scout', 'scrap', 'screen', 'script', 'scrub', 'sea', 'search', 'season', 'seat', 'second', 'secret', 'section', 'security', 'seed', 'seek', 'segment', 'select', 'sell', 'seminar', 'senior', 'sense', 'sentence', 'series', 'service', 'session', 'settle', 'setup', 'seven', 'shadow', 'shaft', 'shallow', 'share', 'shed', 'shell', 'sheriff', 'shield', 'shift', 'shine', 'ship', 'shiver', 'shock', 'shoe', 'shoot', 'shop', 'short', 'shoulder', 'shove', 'shrimp', 'shrug', 'shuffle', 'shy', 'sibling', 'sick', 'side', 'siege', 'sight', 'sign', 'silent', 'silk', 'silly', 'silver', 'similar', 'simple', 'since', 'sing', 'siren', 'sister', 'situate', 'six', 'size', 'skate', 'sketch', 'ski', 'skill', 'skin', 'skirt', 'skull', 'slab', 'slam', 'sleep', 'slender', 'slice', 'slide', 'slight', 'slim', 'slogan', 'slot', 'slow', 'slush', 'small', 'smart', 'smile', 'smoke', 'smooth', 'snack', 'snake', 'snap', 'sniff', 'snow', 'soap', 'soccer', 'social', 'sock', 'soda', 'soft', 'solar', 'soldier', 'solid', 'solution', 'solve', 'someone', 'song', 'soon', 'sorry', 'sort', 'soul', 'sound', 'soup', 'source', 'south', 'space', 'spare', 'spatial', 'spawn', 'speak', 'special', 'speed', 'spell', 'spend', 'sphere', 'spice', 'spider', 'spike', 'spin', 'spirit', 'split', 'spoil', 'sponsor', 'spoon', 'sport', 'spot', 'spray', 'spread', 'spring', 'spy', 'square', 'squeeze', 'squirrel', 'stable', 'stadium', 'staff', 'stage', 'stairs', 'stamp', 'stand', 'start', 'state', 'stay', 'steak', 'steel', 'stem', 'step', 'stereo', 'stick', 'still', 'sting', 'stock', 'stomach', 'stone', 'stool', 'story', 'stove', 'strategy', 'street', 'strike', 'strong', 'struggle', 'student', 'stuff', 'stumble', 'style', 'subject', 'submit', 'subway', 'success', 'such', 'sudden', 'suffer', 'sugar', 'suggest', 'suit', 'summer', 'sun', 'sunny', 'sunset', 'super', 'supply', 'supreme', 'sure', 'surface', 'surge', 'surprise', 'surround', 'survey', 'suspect', 'sustain', 'swallow', 'swamp', 'swap', 'swarm', 'swear', 'sweet', 'swift', 'swim', 'swing', 'switch', 'sword', 'symbol', 'symptom', 'syrup', 'system', 'table', 'tackle', 'tag', 'tail', 'talent', 'talk', 'tank', 'tape', 'target', 'task', 'taste', 'tattoo', 'taxi', 'teach', 'team', 'tell', 'ten', 'tenant', 'tennis', 'tent', 'term', 'test', 'text', 'thank', 'that', 'theme', 'then', 'theory', 'there', 'they', 'thing', 'this', 'thought', 'three', 'thrive', 'throw', 'thumb', 'thunder', 'ticket', 'tide', 'tiger', 'tilt', 'timber', 'time', 'tiny', 'tip', 'tired', 'tissue', 'title', 'toast', 'tobacco', 'today', 'toddler', 'toe', 'together', 'toilet', 'token', 'tomato', 'tomorrow', 'tone', 'tongue', 'tonight', 'tool', 'tooth', 'top', 'topic', 'topple', 'torch', 'tornado', 'tortoise', 'toss', 'total', 'tourist', 'toward', 'tower', 'town', 'toy', 'track', 'trade', 'traffic', 'tragic', 'train', 'transfer', 'trap', 'trash', 'travel', 'tray', 'treat', 'tree', 'trend', 'trial', 'tribe', 'trick', 'trigger', 'trim', 'trip', 'trophy', 'trouble', 'truck', 'true', 'truly', 'trumpet', 'trust', 'truth', 'try', 'tube', 'tuition', 'tumble', 'tuna', 'tunnel', 'turkey', 'turn', 'turtle', 'twelve', 'twenty', 'twice', 'twin', 'twist', 'two', 'type', 'typical', 'ugly', 'umbrella', 'unable', 'unaware', 'uncle', 'uncover', 'under', 'undo', 'unfair', 'unfold', 'unhappy', 'uniform', 'unique', 'unit', 'universe', 'unknown', 'unlock', 'until', 'unusual', 'unveil', 'update', 'upgrade', 'uphold', 'upon', 'upper', 'upset', 'urban', 'urge', 'usage', 'use', 'used', 'useful', 'useless', 'usual', 'utility', 'vacant', 'vacuum', 'vague', 'valid', 'valley', 'valve', 'van', 'vanish', 'vapor', 'various', 'vast', 'vault', 'vehicle', 'velvet', 'vendor', 'venture', 'venue', 'verb', 'verify', 'version', 'very', 'vessel', 'veteran', 'viable', 'vibrant', 'vicious', 'victory', 'video', 'view', 'village', 'vintage', 'violin', 'virtual', 'virus', 'visa', 'visit', 'visual', 'vital', 'vivid', 'vocal', 'voice', 'void', 'volcano', 'volume', 'vote', 'voyage', 'wage', 'wagon', 'wait', 'walk', 'wall', 'walnut', 'want', 'warfare', 'warm', 'warrior', 'wash', 'wasp', 'waste', 'water', 'wave', 'way', 'wealth', 'weapon', 'wear', 'weasel', 'weather', 'web', 'wedding', 'weekend', 'weird', 'welcome', 'west', 'wet', 'whale', 'what', 'wheat', 'wheel', 'when', 'where', 'whip', 'whisper', 'wide', 'width', 'wife', 'wild', 'will', 'win', 'window', 'wine', 'wing', 'wink', 'winner', 'winter', 'wire', 'wisdom', 'wise', 'wish', 'witness', 'wolf', 'woman', 'wonder', 'wood', 'wool', 'word', 'work', 'world', 'worry', 'worth', 'wrap', 'wreck', 'wrestle', 'wrist', 'write', 'wrong', 'yard', 'year', 'yellow', 'you', 'young', 'youth', 'zebra', 'zero', 'zone', 'zoo'];
		var newlist = [];
		//var str = self.mnemonic1;
		var newStr = '';
		try{
			var reg1 = new RegExp('^' + self.str + '.*');
			for (var i = 0; i < mnemonic.length; i++) {
				if (reg1.test(mnemonic[i])) {
					newStr = mnemonic[i].substr(self.str.length);
					newlist.push(newStr);
				}
			}
		}catch (err){
			console.log(err);
		}

		self.items = newlist;

		if (self.items.length > 3) {
			self.items.length = 3;
		}
	};
});



