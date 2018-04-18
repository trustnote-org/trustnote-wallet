'use strict';

angular.module('copayApp.controllers').controller('synchronization',
	function ($rootScope, $scope, $log, gettext, $timeout, lodash, gettextCatalog, profileService, storageService, configService) {

		var async = require('async');
		var conf = require('trustnote-common/conf.js');
		var wallet_defined_by_keys = require('trustnote-common/wallet_defined_by_keys.js');
		var objectHash = require('trustnote-common/object_hash.js');
		try{
			var ecdsa = require('secp256k1');
		}
		catch(e){
			var ecdsa = require('trustnote-common/node_modules/secp256k1' + '');
		}
		var Bitcore = require('bitcore-lib');
		var db = require('trustnote-common/db.js');
		var network = require('trustnote-common/network');
		var myWitnesses = require('trustnote-common/my_witnesses');
		var fc = profileService.focusedClient;

		var self = this;

		self.error = '';
		self.bLight = conf.bLight;
		self.scanning = false;
		self.xPrivKey = '';
		self.assocIndexesToWallets = {};
		self.credentialsEncrypted = false;

		self.passwordRequest = function (msg, cb) {
			self.credentialsEncrypted = true;
			$timeout(function () {
				$scope.$apply();
			});
			profileService.unlockFC(msg, function (err) {
				if(typeof(err) !== "undefined"){
					if(typeof(err.message) === "undefined")
						return;
					if (err.message === "Wrong password") {
						$timeout(function(){
	                		self.passwordRequest(gettextCatalog.getString(err.message), cb);
	            		}, 500);
					}
					return;
				}
				else if(err){
					return;
				}
				profileService.disablePrivateKeyEncryptionFC(function (err) {
					$rootScope.$emit('Local/NewEncryptionSetting');
					if (err) {
						self.credentialsEncrypted = true;
						return;
					}
				});
				if(profileService.password)
					self.password = profileService.password;
				self.credentialsEncrypted = false;
				return cb();
			});
		}

		var config = configService.getSync();
		var walletId = fc.credentials.walletId;
		config.aliasFor = config.aliasFor || {};
		var wallets = lodash.map(profileService.profile.credentials, function(c) {
			return {
				name: config.aliasFor[c.walletId] || c.walletName,
				id: c.walletId,
			};
		});

		function determineIfAddressUsed(address, cb) {
			db.query("SELECT 1 FROM outputs WHERE address = ? LIMIT 1", [address], function(outputsRows) {
				if (outputsRows.length === 1)
					cb(true);
				else {
					db.query("SELECT 1 FROM unit_authors WHERE address = ? LIMIT 1", [address], function(unitAuthorsRows) {
						cb(unitAuthorsRows.length === 1);
					});
				}
			});
		}

		function scanForAddressesAndWallets(cb) {
			var xPubKey;
			var lastUsedAddressIndex = -1;
			var lastUsedWalletIndex = -1;
			var currentAddressIndex = 0;
			var currentWalletIndex = 0;
			var assocMaxAddressIndexes = {};

			function checkAndAddCurrentAddress(is_change) {
				var address = objectHash.getChash160(["sig", {"pubkey": wallet_defined_by_keys.derivePubkey(xPubKey, 'm/' + is_change + '/' + currentAddressIndex)}]);
				determineIfAddressUsed(address, function(bUsed) {
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
						if (currentAddressIndex - lastUsedAddressIndex > 20) {
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
								if (lastUsedAddressIndex !== -1) {
									if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {main: 0};
									assocMaxAddressIndexes[currentWalletIndex].main = Math.floor((currentAddressIndex-1)/20)*20;
								}
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
			db.addQuery(arrQueries, "DELETE FROM shared_address_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM pending_shared_addresses");
			db.addQuery(arrQueries, "DELETE FROM shared_addresses");
			db.addQuery(arrQueries, "DELETE FROM my_addresses");
			db.addQuery(arrQueries, "DELETE FROM wallet_signing_paths");
			db.addQuery(arrQueries, "DELETE FROM extended_pubkeys");
			db.addQuery(arrQueries, "DELETE FROM wallets");
			// db.addQuery(arrQueries, "DELETE FROM correspondent_devices");

			async.series(arrQueries, cb);
		}

		function createAddresses(assocMaxAddressIndexes, cb) {
			var accounts = Object.keys(assocMaxAddressIndexes);
			var currentAccount = 0;

			function addAddress(wallet, is_change, index, maxIndex) {
				wallet_defined_by_keys.issueAddress(wallet, is_change, index, function(addressInfo) {
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
				opts.extendedPrivateKey = self.xPrivKey;
				opts.cosigners = [];
				opts.account = account;

				profileService.synchronization(opts, function(err, walletId) {
					self.assocIndexesToWallets[account] = walletId;
					n++;
					(n < arrWalletIndexes.length) ? createWallet(n) : cb();
				});
			}

			createWallet(0);
		}

		function scanForAddressesAndWalletsInLightClient(cb) {
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
						if(response && response.error){
							var breadcrumbs = require('trustnote-common/breadcrumbs.js');
							breadcrumbs.add('Error scanForAddressesAndWalletsInLightClient: ' + response.error);
							self.error = gettextCatalog.getString('please try again later.');
							self.scanning = false;
							$scope.index.showneikuangsync = false;
							profileService.haschoosen = 2;
							if(self.password) {
								profileService.setPrivateKeyEncryptionFC(self.password, function () {
									$rootScope.$emit('Local/NewEncryptionSetting');
									$scope.encrypt = true;
									delete self.password;
								});
							}
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
								if(assocMaxAddressIndexes[currentWalletIndex].change === 0 && assocMaxAddressIndexes[currentWalletIndex].main === 0) delete assocMaxAddressIndexes[currentWalletIndex];
								currentWalletIndex++;
								if(currentWalletIndex - lastUsedWalletIndex > 3){
									cb(assocMaxAddressIndexes);
								}else{
									setCurrentWallet();
								}
							} else {
								checkAndAddCurrentAddresses(1);
							}
						}
					});
				});
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
								$scope.index.showneikuangsync = false;
								profileService.haschoosen = 2;
								if(self.password) {
									profileService.setPrivateKeyEncryptionFC(self.password, function () {
										$rootScope.$emit('Local/NewEncryptionSetting');
										$scope.encrypt = true;
										delete self.password;
									});
								}

// 更改代码
								// $rootScope.$emit('Local/ShowAlert', "Synchronization completed", 'fi-check', function () {
								$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Synchronization completed"), 'fi-check', function () {
										var opts = {
										aliasFor: {}
									};
									for(item in wallets) {
										opts.aliasFor[wallets[item].id] = wallets[item].name;
										configService.set(opts, function(err) {
											if (err) {
												$scope.$emit('Local/DeviceError', err);
												return;
											}
											$scope.$emit('Local/AliasUpdated');
										});
									}
									$rootScope.$emit('Local/Synchronization');
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
							$scope.index.showneikuangsync = false;
							profileService.haschoosen = 2;
// 更改代码
							if(self.password) {
								profileService.setPrivateKeyEncryptionFC(self.password, function () {
									$rootScope.$emit('Local/NewEncryptionSetting');
									$scope.encrypt = true;
									delete self.password;
								});
							}

							$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Synchronization completed"), 'fi-check', function () {
								var opts = {
									aliasFor: {}
								};
								for(item in wallets) {
									opts.aliasFor[wallets[item].id] = wallets[item].name;
									configService.set(opts, function(err) {
										if (err) {
											$scope.$emit('Local/DeviceError', err);
											return;
										}
										$scope.$emit('Local/AliasUpdated');
									});
								}
							});
						});
					});
				});
			}
		}

		self.synchronization = function() {
			if (fc.hasPrivKeyEncrypted()) {
				self.passwordRequest(gettextCatalog.getString('During synchronization, please be patient.'), function(){
					self.scanning = true;
					$scope.index.showneikuangsync = true;
					delete profileService.haschoosen;
					self.xPrivKey = Bitcore.HDPrivateKey.fromString(profileService.profile.xPrivKey);
					self.scanning = true;
					if (self.bLight) {
						scanForAddressesAndWalletsInLightClient(cleanAndAddWalletsAndAddresses);
					} else {
						scanForAddressesAndWallets(cleanAndAddWalletsAndAddresses);
					}
				});
			}
			else {
				self.scanning = true;
				$scope.index.showneikuangsync = true;
				delete profileService.haschoosen;
				self.xPrivKey = Bitcore.HDPrivateKey.fromString(profileService.profile.xPrivKey);
				self.scanning = true;
				if (self.bLight) {
					scanForAddressesAndWalletsInLightClient(cleanAndAddWalletsAndAddresses);
				} else {
					scanForAddressesAndWallets(cleanAndAddWalletsAndAddresses);
				}
			}
		}

	});
