'use strict';

angular.module('copayApp.controllers').controller('synchronization', function ($rootScope, $scope, $log, gettext, $timeout, lodash, gettextCatalog, profileService, storageService, configService) {

	var conf = require('trustnote-common/conf.js');
	var wallet_defined_by_keys = require('trustnote-common/wallet_defined_by_keys.js');
	var objectHash = require('trustnote-common/object_hash.js');

	var Bitcore = require('bitcore-lib');
	var db = require('trustnote-common/db.js');
	var network = require('trustnote-common/network');
	var myWitnesses = require('trustnote-common/my_witnesses');

	var self = this;

	self.error = '';
	self.bLight = conf.bLight;
	self.scanning = false;
	self.xPrivKey = '';
	self.assocIndexesToWallets = {};
	self.assocWallets = {};
	self.credentialsEncrypted = false;
	self.totalWallet = 0;

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

	function scanForAddressesAndWallets(cb) {
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
					if (currentAddressIndex - lastUsedAddressIndex > 40) {
						if (is_change) {
							if (lastUsedAddressIndex !== -1) {
								lastUsedWalletIndex = currentWalletIndex;
							}
							if (currentWalletIndex >= self.totalWallet - 1) {
								cb(assocMaxAddressIndexes);
							} else {
								currentWalletIndex++;
								setCurrentWallet();
							}
						} else {
							if (lastUsedAddressIndex !== -1) {
								if (!assocMaxAddressIndexes[currentWalletIndex]) assocMaxAddressIndexes[currentWalletIndex] = {main: 0};
								assocMaxAddressIndexes[currentWalletIndex].main = Math.floor((currentAddressIndex - 1) / 40) * 40;
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
			xPubKey = Bitcore.HDPublicKey.fromString(self.assocWallets[currentWalletIndex]);
			lastUsedAddressIndex = -1;
			currentAddressIndex = 0;
			checkAndAddCurrentAddress(0);
		}

		setCurrentWallet();
	}

	function createAddresses(assocMaxAddressIndexes, cb) {
		var accounts = Object.keys(assocMaxAddressIndexes);
		var currentAccount = 0;

		function addAddress(wallet, is_change, index, maxIndex) {
			wallet_defined_by_keys.issueAddressSync(wallet, is_change, index, function (addressInfo) {
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
				addAddress(self.assocIndexesToWallets[accounts[currentAccount]], 0, 0, assocMaxAddressIndexes[accounts[currentAccount]].main + 40);
			}
		}


		startAddToNewWallet(0);
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
			for (var i = 0; i < 40; i++) {
				var index = (is_change ? assocMaxAddressIndexes[currentWalletIndex].change : assocMaxAddressIndexes[currentWalletIndex].main) + i;  // is_change 0：生成的地址 1：找零的地址
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
						self.error = gettextCatalog.getString('please try again later.');
						self.scanning = false;
						$scope.index.showneikuangsync = false;
						$timeout(function () {
							$rootScope.$apply();
						});
						return;
					}
					if (Object.keys(response).length) {
						lastUsedWalletIndex = currentWalletIndex;
						if (is_change) {
							assocMaxAddressIndexes[currentWalletIndex].change += 40;
						} else {
							assocMaxAddressIndexes[currentWalletIndex].main += 40;
						}
						checkAndAddCurrentAddresses(is_change);
					} else {
						if (is_change) {
							if (assocMaxAddressIndexes[currentWalletIndex].change === 0 && assocMaxAddressIndexes[currentWalletIndex].main === 0) delete assocMaxAddressIndexes[currentWalletIndex];
							currentWalletIndex++;
							if (currentWalletIndex > self.totalWallet - 1) {
								cb(assocMaxAddressIndexes);
							} else {
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
			xPubKey = Bitcore.HDPublicKey.fromString(self.assocWallets[currentWalletIndex]);
			checkAndAddCurrentAddresses(0);
		}

		setCurrentWallet();
	}

	function cleanAndAddWalletsAndAddresses(assocMaxAddressIndexes) {
		var arrWalletIndexes = Object.keys(assocMaxAddressIndexes);
		if (arrWalletIndexes.length) {
			createAddresses(assocMaxAddressIndexes, function () {
				self.scanning = false;
				$scope.index.showneikuangsync = false;

				$rootScope.$emit('Local/ShowAlert', gettextCatalog.getString("Synchronization completed"), 'fi-check', function () {
					$rootScope.$emit('Local/Synchronization');
				});
			});
		}
	}

	self.synchronization = function () {
		self.scanning = true;
		$scope.index.showneikuangsync = true;
		delete profileService.haschoosen;
		self.totalWallet = profileService.profile.credentials.length;
		for (var i = 0; i < profileService.profile.credentials.length; i++) {
			self.assocIndexesToWallets[i] = profileService.profile.credentials[i].walletId;
			self.assocWallets[i] = profileService.profile.credentials[i].xPubKey;
		}
		self.scanning = true;
		if (self.bLight) {
			scanForAddressesAndWalletsInLightClient(cleanAndAddWalletsAndAddresses);
		} else {
			scanForAddressesAndWallets(cleanAndAddWalletsAndAddresses);
		}
	}
});
