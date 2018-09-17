'use strict';

angular.module('trustnoteApp.services')
	.factory('storageService', function (fileStorageService, localStorageService, $log, isCordova) {

        var root = {};

        var shouldUseFileStorage = isCordova && !isMobile.Windows();
        $log.debug('Using file storage:', shouldUseFileStorage);

        var storage = shouldUseFileStorage ? fileStorageService : localStorageService;

		// on mobile, the storage keys are files, we have to avoid slashes in filenames
		function getSafeWalletId(walletId) {
			return walletId.replace(/[\/+=]/g, '');
		}

        root.storeNewProfile = function (profile, cb) {
            storage.create('profile', profile.toStr(), cb);
        };

        root.storeProfile = function (profile, cb) {
            storage.set('profile', profile.toStr(), cb);
        };

        root.getProfile = function (cb) {
            storage.get('profile', function (err, str) {
                if (err || !str)
                    return cb(err);

                $log.debug("get profile done!");
                var p = Profile.fromString(str);
                return cb(err, p);
            });
        };

		root.deleteProfile = function (cb) {
			storage.remove('profile', cb);
		};

		root.storeFocusedWalletId = function (id, cb) {
			storage.set('focusedWalletId', id || '', cb);
		};

		root.getFocusedWalletId = function (cb) {
			storage.get('focusedWalletId', cb);
		};

		root.setBackupFlag = function (walletId, cb) {
			storage.set('backup-' + getSafeWalletId(walletId), Date.now(), cb);
		};

		root.getBackupFlag = function (walletId, cb) {
			storage.get('backup-' + getSafeWalletId(walletId), cb);
		};

		root.clearBackupFlag = function (walletId, cb) {
			storage.remove('backup-' + getSafeWalletId(walletId), cb);
		};

		root.getConfig = function (cb) {
			storage.get('config', cb);
		};

		root.storeConfig = function (val, cb) {
			$log.debug('Storing Preferences', val);
			storage.set('config', val, cb);
		};

		root.clearConfig = function (cb) {
			storage.remove('config', cb);
		};



		// 存储 是否同意 免责声明
		root.setDisclaimerFlag = function (cb) {
			storage.set('agreeDisclaimer', true, cb);
		};

		// 获取 是否同意 免责声明
		root.getDisclaimerFlag = function (cb) {
			storage.get('agreeDisclaimer', cb);
		};



		root.setRemotePrefsStoredFlag = function (cb) {
			storage.set('remotePrefStored', true, cb);
		};

		root.getRemotePrefsStoredFlag = function (cb) {
			storage.get('remotePrefStored', cb);
		};

		root.setAddressbook = function (network, addressbook, cb) {
			storage.set('addressbook-' + network, addressbook, cb);
		};

		root.getAddressbook = function (network, cb) {
			storage.get('addressbook-' + network, cb);
		};

		root.removeAddressbook = function (network, cb) {
			storage.remove('addressbook-' + network, cb);
		};

		root.setPushInfo = function (projectNumber, registrationId, enabled, cb) {
			storage.set('pushToken', JSON.stringify({
				projectNumber: projectNumber,
				registrationId: registrationId,
				enabled: enabled
			}), cb);
		};

		root.getPushInfo = function (cb) {
			storage.get('pushToken', function (err, data) {
				err ? cb(err) : cb(null, (data ? JSON.parse(data) : data));
			});
		};

		root.removePushInfo = function (cb) {
			storage.remove('pushToken', cb);
		};

		// 存储 是否选择  回复钱包 创建新的钱包
		root.hashaschoosen = function (value, cb) {
			storage.set('haschoosen', value, cb);
			// alert('zai storage zhong')
		};

		// 获取 是否选择 回复钱包 创建新的钱包
		root.gethaschoosen = function (cb) {
			storage.get('haschoosen',cb);
		};

		root.setAsset = function (value, cb) {
			storage.set('asset', value, cb);
		};
		
		root.getAsset = function (cb) {
			storage.get('asset',cb);
		};

		//发送红包记录
		root.setCandySendHistory = function (value, cb) {
			storage.set('candySendHistory', value, cb);
		};
		root.getCandySendHistory = function (cb) {
			storage.get('candySendHistory',cb);
		};

		root.setDatabaseFlag = function (value, cb) {
			storage.set('databaseFlag', value, cb);
		};
		root.getDatabaseFlag = function (cb) {
			storage.get('databaseFlag',cb);
		}

		return root;
	});
