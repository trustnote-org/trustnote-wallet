'use strict';

var breadcrumbs = require('trustnote-common/breadcrumbs.js');

angular.module('copayApp.services').factory('profileService', function profileServiceFactory($rootScope, $location, $timeout, $filter, $log, lodash, storageService, bwcService, configService, pushNotificationsService, isCordova, gettext, gettextCatalog, nodeWebkit, uxLanguage) {

    var root = {};

    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};
	root.Utils = bwcService.getUtils();

	root.formatAmount = function(amount, asset, opts) {
      	var config = configService.getSync().wallet.settings;

      	//if (config.unitCode == 'byte') return amount;
      	//TODO : now only works for english, specify opts to change thousand separator and decimal separator
		if(asset == 'blackbytes') {
			return this.Utils.formatAmount(amount, config.bbUnitCode, opts);
		}else if(asset == 'base'){
			return this.Utils.formatAmount(amount, config.unitCode, opts);
		}else{
		    return amount;
        }
    };


	// 更改代码  添加选项：option（第一次改）
    root._setFocus = function(walletId, option, cb) {
    	// alert("----"+option)
      	$log.debug('Set focus:', walletId);

      	// Set local object
      	if (walletId)
        	root.focusedClient = root.walletClients[walletId];
      	else
        	root.focusedClient = [];

      	if (lodash.isEmpty(root.focusedClient)) {
        	root.focusedClient = root.walletClients[lodash.keys(root.walletClients)[0]];
      	}


      	// 仍然没有钱包 emit一个事件 Still nothing?
		if (lodash.isEmpty(root.focusedClient)) {
        	$rootScope.$emit('Local/NoWallets');
        	return;

      	} else {
        	$rootScope.$emit('Local/NewFocusedWallet', option);
      	}

      	return cb();
    };

    root.setAndStoreFocus = function(walletId, option, cb) {
      	root._setFocus(walletId, option, function() {
        	storageService.storeFocusedWalletId(walletId, cb);
      	});
    };
	// 更改代码  添加选项：option 结束


    root.setWalletClient = function(credentials) {
        if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
            return;

        var client = bwcService.getClient(JSON.stringify(credentials));
        
        client.credentials.xPrivKey = root.profile.xPrivKey;
        client.credentials.mnemonic = root.profile.mnemonic;
        client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
        client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;
        
        root.walletClients[credentials.walletId] = client;

		if("observed" in credentials)
			root.walletClients[credentials.walletId].observed = true;
        root.walletClients[credentials.walletId].started = true;

        client.initialize({}, function(err) {
            if (err) {
                // impossible
                return;
            }
        });
    };

    root.setWalletClients = function() {
      	var credentials = root.profile.credentials;
      	lodash.each(credentials, function(credentials) {
        	root.setWalletClient(credentials);
      	});
      	$rootScope.$emit('Local/WalletListUpdated');
    };
    
    
    function saveTempKeys(tempDeviceKey, prevTempDeviceKey, onDone){
		$timeout(function(){
			console.log("will save temp device keys");//, tempDeviceKey, prevTempDeviceKey);

			root.profile.tempDeviceKey = tempDeviceKey.toString('base64');
			if (prevTempDeviceKey)
				root.profile.prevTempDeviceKey = prevTempDeviceKey.toString('base64');
			storageService.storeProfile(root.profile, function(err) {
				onDone(err);
			});
        });
    }

    function unlockWalletAndInitDevice(){

		breadcrumbs.add('unlockWalletAndInitDevice');   // wait till the wallet fully loads

		var mainSectionElement = angular.element( document.querySelector( '#mainSection' ) );   //Hide the mainSection
		mainSectionElement.css('visibility','hidden');

        var removeListener = $rootScope.$on('Local/BalanceUpdated', function(){
            removeListener();
			breadcrumbs.add('unlockWalletAndInitDevice BalanceUpdated');

			root.insistUnlockFC(null, function(){
				breadcrumbs.add('unlockWalletAndInitDevice unlocked');

				//After unlock, make mainSection visible again
				var mainSectionElement = angular.element( document.querySelector( '#mainSection' ) );
				mainSectionElement.css('visibility','visible');

                if (!root.focusedClient.credentials.xPrivKey)
                    throw Error("xPrivKey still not set after unlock");
                console.log('unlocked: '+root.focusedClient.credentials.xPrivKey);

                var config = configService.getSync();
                root.focusedClient.initDeviceProperties( root.focusedClient.credentials.xPrivKey, root.profile.my_device_address, config.hub, config.deviceName );
				$rootScope.$emit('Local/BalanceUpdatedAndWalletUnlocked');
            });
        });
    }




    root.bindProfile = function(profile, cb) {
		breadcrumbs.add('bindProfile');
		root.profile = profile;

		console.log('**********************************'+JSON.stringify(root.profile));

        configService.get(function(err) {
            $log.debug('Preferences read');
            if (err)
                return cb(err);

            root.setWalletClients();

            storageService.getFocusedWalletId(function(err, focusedWalletId) {
                if (err) 
                    return cb(err);

                root._setFocus(focusedWalletId, true, function() {
                	console.log("focusedWalletId", focusedWalletId);

                	require('trustnote-common/wallet.js');
					var device = require('trustnote-common/device.js');
                    var config = configService.getSync();
                    var firstWc = root.walletClients[lodash.keys(root.walletClients)[0]];

                    if (root.profile.xPrivKeyEncrypted){
                        console.log('priv key is encrypted, will wait for UI and request password');
                        // assuming bindProfile is called on encrypted keys only at program startup
                        unlockWalletAndInitDevice();
                        device.setDeviceAddress(root.profile.my_device_address);
                        device.setDeviceName(config.deviceName);
                        device.setDeviceHub(config.hub);
                    }
                    else if (root.profile.xPrivKey)
                        root.focusedClient.initDeviceProperties(profile.xPrivKey, root.profile.my_device_address, config.hub, config.deviceName);
                    else
                        throw Error("neither xPrivKey nor xPrivKeyEncrypted");
                    //var tempDeviceKey = device.genPrivKey();
                    //saveTempKeys(tempDeviceKey, null, function(){});
                    var tempDeviceKey = Buffer.from(profile.tempDeviceKey, 'base64');
                    var prevTempDeviceKey = profile.prevTempDeviceKey ? Buffer.from(profile.prevTempDeviceKey, 'base64') : null;
                    device.setTempKeys(tempDeviceKey, prevTempDeviceKey, saveTempKeys);
                    $rootScope.$emit('Local/ProfileBound');
                    return cb();
                });
            });
        });
    };

	root.loadAndBindProfile = function (cb) {
		breadcrumbs.add('loadAndBindProfile');

		storageService.gethaschoosen(function (err, val) {
			root.haschoosen = val;
		});

		storageService.getDisclaimerFlag(function (err, val) {
			if (!val) {
				breadcrumbs.add('Non agreed disclaimer');
				return cb( new Error('NONAGREEDDISCLAIMER: Non agreed disclaimer') );
			} else {
				storageService.getProfile(function (err, profile) {
					if (err) {
						$rootScope.$emit('Local/DeviceError', err);
						return cb(err);
					}
					if (!profile) {
						breadcrumbs.add('no profile');
						return cb(new Error('NOPROFILE: No profile'));
					}
					else {
						$log.debug('Profile read');
						return root.bindProfile(profile, cb);
					}
				});
			}
		});
	};

    
    root._seedWallet = function(opts, cb) {
      	opts = opts || {};

      	var walletClient = bwcService.getClient();
      	var network = opts.networkName || 'livenet';


      	if (opts.mnemonic) {
        	try {
          		opts.mnemonic = root._normalizeMnemonic(opts.mnemonic);
          		walletClient.seedFromMnemonic(opts.mnemonic, {
            		network: network,
            		passphrase: opts.passphrase,
            		account: opts.account || 0,
            		derivationStrategy: opts.derivationStrategy || 'BIP44',
          		});

        	} catch (ex) {
          		$log.info(ex);
          		return cb(gettext('Could not create: Invalid wallet seed'));
        	}
      	} else if (opts.extendedPrivateKey) {
        	try {
          		walletClient.seedFromExtendedPrivateKey(opts.extendedPrivateKey, opts.account || 0);
        	} catch (ex) {
          		$log.warn(ex);
          		return cb(gettext('Could not create using the specified extended private key'));
        	}
      	} else if (opts.extendedPublicKey) {
        	try {
          		walletClient.seedFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
            		account: opts.account || 0,
            		derivationStrategy: opts.derivationStrategy || 'BIP44',
          		});
        	} catch (ex) {
          		$log.warn("Creating wallet from Extended Public Key Arg:", ex, opts);
          		return cb(gettext('Could not create using the specified extended public key'));
        	}
      	} else {
        	var lang = uxLanguage.getCurrentLanguage();
          	console.log("will seedFromRandomWithMnemonic for language "+lang);

          	try {
          		walletClient.seedFromRandomWithMnemonic({
					network: network,
					passphrase: opts.passphrase,
					language: lang,
					account: opts.account || 0,
          		});
        	} catch (e) {
          		$log.info('Error creating seed: ' + e.message);
          		if (e.message.indexOf('language') > 0) {
            		$log.info('Using default language for mnemonic');
            		walletClient.seedFromRandomWithMnemonic({
              			network: network,
              			passphrase: opts.passphrase,
              			account: opts.account || 0,
            		});
          		} else {
            		return cb(e);
          		}
        	}
      	}
      	return cb(null, walletClient);
    };


	// 第一个钱包 the first wallet is created in _createNewProfile()
    root._createNewProfile = function(opts, cb) {
        console.log("_createNewProfile");
        if (opts.noWallet)
            return cb(null, Profile.create());	// Profile.create() profile.js中的create函数

        root._seedWallet({}, function(err, walletClient) {
            if (err)
                return cb(err);
            var config = configService.getSync();
			require('trustnote-common/wallet.js'); // load hub / message handlers

			var device = require('trustnote-common/device.js');
            var tempDeviceKey = device.genPrivKey();

			walletClient.initDeviceProperties(walletClient.credentials.xPrivKey, null, config.hub, config.deviceName);	// initDeviceProperties sets my_device_address needed by walletClient.createWallet
            var walletName = gettextCatalog.getString('TTT Wallet');

			walletClient.createWallet(walletName, 1, 1, {
				network: 'livenet'
			}, function (err) {
				if (err)
					return cb(gettext('Error creating wallet') + ": " + err);
				console.log("created wallet, client: ", JSON.stringify(walletClient));

				var xPrivKey = walletClient.credentials.xPrivKey;
				var mnemonic = walletClient.credentials.mnemonic;
				console.log("mnemonic: " + mnemonic + ', xPrivKey: ' + xPrivKey);

				var p = Profile.create({
					credentials: [JSON.parse(walletClient.export())],
					xPrivKey: xPrivKey,
					mnemonic: mnemonic,
					tempDeviceKey: tempDeviceKey.toString('base64'),
					my_device_address: device.getMyDeviceAddress()
				});

				device.setTempKeys(tempDeviceKey, null, saveTempKeys);

				return cb(null, p);
			});
        });
    };


    // 创建新钱包 （ 第一个钱包在 上面的函数中创建的 ） create additional wallet (the first wallet is created in _createNewProfile())
	root.createWallet = function (opts, cb) {
		$log.debug('Creating Wallet:', opts);  // Creating Wallet: {"m":1,"n":1,"name":"wwwddd","networkName":"livenet","cosigners":[]}

		if (!root.focusedClient.credentials.xPrivKey) { // locked
			root.unlockFC(null, function (err) {
				if (err)
					return cb(err.message);
				root.createWallet(opts, cb);
			});
			return console.log('need password to create new wallet');
		}

		var walletDefinedByKeys = require('trustnote-common/wallet_defined_by_keys.js');

		walletDefinedByKeys.readNextAccount(function (account) {
			console.log("next account = " + account);
			if (!opts.extendedPrivateKey && !opts.mnemonic) {
				if (!root.focusedClient.credentials.xPrivKey)
					throw Error("no root.focusedClient.credentials.xPrivKey");
				$log.debug("reusing xPrivKey from focused client");

				opts.extendedPrivateKey = root.focusedClient.credentials.xPrivKey;
				opts.mnemonic = root.profile.mnemonic;
				opts.account = account;
			}
			root._seedWallet(opts, function (err, walletClient) {
				if (err)
					return cb(err);

				walletClient.createWallet(opts.name, opts.m, opts.n, {
					network: opts.networkName,
					account: opts.account,
					cosigners: opts.cosigners
				}, function (err) {
					if (err)
						return cb(gettext('Error creating wallet') + ": " + err);
					root._addWalletClient(walletClient, opts, cb);
				});
			});
		});
	};
    // 创建新钱包 结束

	// 创建观察钱包 开始
	root.createColdWallet = function (opts, addr, cb) {
		$log.debug('Creating ColdWallet:', opts);  // Creating Wallet: {"m":1,"n":1,"name":"wwwddd","networkName":"livenet","cosigners":[]}
		var device = require('trustnote-common/device.js');
		device.setMyColdDeviceAddress(addr);
		var walletClient = bwcService.getClient();

		walletClient.import(JSON.stringify(opts));

		walletClient.createWallet(opts.name, opts.m, opts.n, {
			network: opts.network,
			account: opts.account,
			cosigners: opts.cosigners
		}, function (err) {
			if (err)
				return cb(gettext('Error creating wallet') + ": " + err);
			opts.observed = true;
			root._addWalletClient(walletClient, opts, cb);
		});
	};


	//克隆钱包同步
	root.synchronization = function(opts, cb) {
		// opts：
		// {
		//  "m":1,
		// 	"n":1,
		// 	"name":"Wallet #0",
		// 	"network":"livenet",
		// 	"extendedPrivateKey":{    扩展私钥
		// 		"network":"livenet",
		// 		"depth":0,
		// 		"fingerPrint":953664,
		// 		"parentFingerPrint":0,
		// 		"childIndex":0,
		// 		"chainCode":"9a22e7c830b0ad83e63fb3eee6a2b5e4c7b803189317bb44878eb8",  链码
		// 		"privateKey":"643660c1cee52460d815cd070ff02fe0e29b31f54c9c9818b824d3543", 专用（私人的）密钥
		// 		"checksum":-310396521,
		// 		"xprivkey":"xprv9s21ZrQH143K3bN22jAJ35LZXV4WNGPMqpGdNq7g2KVacwHyuBJQdGydza9E9qsqsABkj4X2mRCWuNVNzQaZ"
		//  },
		// 	"cosigners":[],
		// 	"account":0
		// }
		$log.debug('synchronization :', opts);
		console.log(opts.extendedPrivateKey);
		//alert(JSON.stringify(opts.extendedPrivateKey));

		if (!root.focusedClient.credentials.xPrivKey){ // locked
			root.unlockFC(null, function(err){
				if (err)
					return cb(err.message);
				root.createWallet(opts, cb);
			});
			return console.log('need password to create new wallet');
		}

		var walletDefinedByKeys = require('trustnote-common/wallet_defined_by_keys.js');
		walletDefinedByKeys.readNextAccount(function(account){
			opts.extendedPrivateKey = root.focusedClient.credentials.xPrivKey;

			console.log(opts.extendedPrivateKey);
			//alert(JSON.stringify(opts.extendedPrivateKey));

			root._seedWallet(opts, function(err, walletClient) {
				if (err)
					return cb(err);

				walletClient.createWallet(opts.name, opts.m, opts.n, {
					network: opts.networkName,
					account: opts.account,
					cosigners: opts.cosigners
				}, function(err) {
					if (err)
						return cb(gettext('Error creating wallet')+": "+err);
					root._addWalletClient(walletClient, opts, cb);
				});
			});
		});
	};
	// 克隆钱包同步 结束


    root.getClient = function(walletId) {
      return root.walletClients[walletId];
    };

    // 删除钱包
    root.deleteWallet = function(opts, cb) {
		var client = opts.client || root.focusedClient;

        var walletId = client.credentials.walletId;
        $log.debug('Deleting Wallet:', client.credentials.walletName);
        breadcrumbs.add('Deleting Wallet: ' + client.credentials.walletName);

		// alert(JSON.stringify(root.profile.credentials))
        root.profile.credentials = lodash.reject(root.profile.credentials, {
            walletId: walletId
        });
        // alert(JSON.stringify(root.profile.credentials))

		//alert(JSON.stringify(root.walletClients))
        delete root.walletClients[walletId];
        root.focusedClient = null;
		//alert(JSON.stringify(root.walletClients))

        storageService.clearBackupFlag(walletId, function(err) {
            if (err) $log.warn(err);
        });

        $timeout(function() {
            root.setWalletClients();
            root.setAndStoreFocus(null, true, function() {
                storageService.storeProfile(root.profile, function(err) {
                    if (err) return cb(err);
                    return cb();
                });
            });
        });
    };

    root.setMetaData = function(walletClient, addressBook, cb) {
      	storageService.getAddressbook(walletClient.credentials.network, function(err, localAddressBook) {
        	var localAddressBook1 = {};
        	try {
          		localAddressBook1 = JSON.parse(localAddressBook);
        	} catch (ex) {
          		$log.warn(ex);
        	}
        	var mergeAddressBook = lodash.merge(addressBook, localAddressBook1);
        	storageService.setAddressbook(walletClient.credentials.network, JSON.stringify(addressBook), function(err) {
          		if (err) return cb(err);
            	return cb(null);
        	});
      	});
    }

	root._addWalletClient = function (walletClient, opts, cb) {
		var walletId = walletClient.credentials.walletId;

		// check if exists
		var w = lodash.find(root.profile.credentials, {'walletId': walletId});
		if (w)
			return cb(gettext('Wallet already in trustnote' + ": ") + w.walletName);

		root.profile.credentials.push(JSON.parse(walletClient.export()));
		if(opts.observed)
			root.profile.credentials[root.profile.credentials.length-1].observed = opts.observed;
		root.setWalletClients();

		// assign（分配） wallet color based on first character of walletId
		var color = configService.colorOpts[walletId.charCodeAt(0) % configService.colorOpts.length];
		var configOpts = {colorFor: {}};
		configOpts.colorFor[walletId] = color;
		configService.set(configOpts, function (err) {
			root.setAndStoreFocus(walletId, true, function () {
				storageService.storeProfile(root.profile, function (err) {
					var config = configService.getSync();
					return cb(err, walletId);
				});
			});
		});
	};

    
    root.importWallet = function(str, opts, cb) {

      	var walletClient = bwcService.getClient();

      	$log.debug('Importing Wallet:', opts);
      	try {
        	walletClient.import(str, {
          		compressed: opts.compressed,
          		password: opts.password
        	});
      	} catch (err) {
        	return cb(gettext('Could not import. Check input file and password'));
      	}

      	str = JSON.parse(str);

      	var addressBook = str.addressBook || {};

      	root._addWalletClient(walletClient, opts, function(err, walletId) {
        	if (err) return cb(err);
        	root.setMetaData(walletClient, addressBook, function(error) {
          		if (error) console.log(error);
          		return cb(err, walletId);
        	});
      	});
    };

    
    root.importExtendedPrivateKey = function(xPrivKey, opts, cb) {
     	var walletClient = bwcService.getClient();
      	$log.debug('Importing Wallet xPrivKey');

      	walletClient.importFromExtendedPrivateKey(xPrivKey, function(err) {
        	if (err)
          	return cb(gettext('Could not import')+": "+err);

        	root._addWalletClient(walletClient, opts, cb);
      	});
    };

    // 规范化 助记词
    root._normalizeMnemonic = function(words) {
      	var isJA = words.indexOf('\u3000') > -1;
      	var wordList = words.split(/[\u3000\s]+/);

      	return wordList.join(isJA ? '\u3000' : ' ');
    };

    
    root.importMnemonic = function(words, opts, cb) {

      	var walletClient = bwcService.getClient();

      	$log.debug('Importing Wallet Mnemonic');

      	words = root._normalizeMnemonic(words);
      	walletClient.importFromMnemonic(words, {
        	network: opts.networkName,
        	passphrase: opts.passphrase,
        	account: opts.account || 0,
      	}, function(err) {
        	if (err)
          	return cb(gettext('Could not import')+": "+err);

        	root._addWalletClient(walletClient, opts, cb);
      	});
    };

    
    root.importExtendedPublicKey = function(opts, cb) {

      	var walletClient = bwcService.getClient();
      	$log.debug('Importing Wallet XPubKey');

      	walletClient.importFromExtendedPublicKey(opts.extendedPublicKey, opts.externalSource, opts.entropySource, {
        	account: opts.account || 0,
        	derivationStrategy: opts.derivationStrategy || 'BIP44',
      	}, function(err) {
        	if (err) {

          	// in HW wallets, req key is always the same. They can't addAccess.
          	if (err.code == 'NOT_AUTHORIZED')
            err.code = 'WALLET_DOES_NOT_EXIST';

          	return cb(gettext('Could not import')+": "+err);
        	}

        root._addWalletClient(walletClient, opts, cb);
      	});
    };

    
    root.create = function(opts, cb) {
      	$log.info('Creating profile', opts);
      	var defaults = configService.getDefaults();

      	configService.get(function(err) {
        	root._createNewProfile(opts, function(err, p) {
          		if (err) return cb(err);

          		root.bindProfile(p, function(err) {
            		storageService.storeNewProfile(p, function(err) {
              			return cb(err);
            		});
          		});
        	});
      	});
    };


    root.updateCredentialsFC = function(cb) {
      	var fc = root.focusedClient;

      	var newCredentials = lodash.reject(root.profile.credentials, {
        	walletId: fc.credentials.walletId
      	});
      	newCredentials.push(JSON.parse(fc.export()));
      	root.profile.credentials = newCredentials;
        //root.profile.my_device_address = device.getMyDeviceAddress();

      	storageService.storeProfile(root.profile, cb);
    };

    root.clearMnemonic = function(cb){
        delete root.profile.mnemonic;
        delete root.profile.mnemonicEncrypted;

        for (var wid in root.walletClients)
            root.walletClients[wid].clearMnemonic();
        	storageService.storeProfile(root.profile, cb);
    };

    root.setPrivateKeyEncryptionFC = function(password, cb) {
        var fc = root.focusedClient;
        $log.debug('Encrypting private key for', fc.credentials.walletName);  // root.focusedClient (fc)  ---.credentials.walletName

        fc.setPrivateKeyEncryption(password);
        if (!fc.credentials.xPrivKeyEncrypted)
            throw Error("no xPrivKeyEncrypted after setting encryption");

        root.profile.xPrivKeyEncrypted = fc.credentials.xPrivKeyEncrypted;  // root.focusedClient (fc)  ---.credentials.xPrivKeyEncrypted
        root.profile.mnemonicEncrypted = fc.credentials.mnemonicEncrypted;
        delete root.profile.xPrivKey;
        delete root.profile.mnemonic;
        root.lockFC();

        for (var wid in root.walletClients){
            root.walletClients[wid].credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
            delete root.walletClients[wid].credentials.xPrivKey;
        }

        storageService.storeProfile(root.profile, function() {
            $log.debug('Wallet encrypted');
                return cb();
        });
        /*root.updateCredentialsFC(function() {
            $log.debug('Wallet encrypted');
                return cb();
        });*/
    };


    root.disablePrivateKeyEncryptionFC = function(cb) {
        var fc = root.focusedClient;
        $log.debug('Disabling private key encryption for', fc.credentials.walletName);

        try {
            fc.disablePrivateKeyEncryption();
        } catch (e) {
            return cb(e);
        }
        if (!fc.credentials.xPrivKey)
            throw Error("no xPrivKey after disabling encryption");
        root.profile.xPrivKey = fc.credentials.xPrivKey;
        root.profile.mnemonic = fc.credentials.mnemonic;
        delete root.profile.xPrivKeyEncrypted;
        delete root.profile.mnemonicEncrypted;

        for (var wid in root.walletClients){
            root.walletClients[wid].credentials.xPrivKey = root.profile.xPrivKey;
            delete root.walletClients[wid].credentials.xPrivKeyEncrypted;
        }
        storageService.storeProfile(root.profile, function() {
            $log.debug('Wallet encryption disabled');
                return cb();
        });
        /*root.updateCredentialsFC(function() {
            $log.debug('Wallet encryption disabled');
                return cb();
        });*/
    };

    root.lockFC = function() {
      	var fc = root.focusedClient;
     	 try {
        	fc.lock();
      	} catch (e) {};
    };

    root.unlockFC = function(error_message, cb) {
      	$log.debug('Wallet is encrypted');
      	$rootScope.$emit('Local/NeedsPassword', false, error_message, function(err2, password) {
        	if (err2 || !password) {
          		return cb({
            		message: (err2 || gettext('Password needed'))
          		});
        	}
			var fc = root.focusedClient;
        	try {
          		fc.unlock(password);
		  		breadcrumbs.add('unlocked '+fc.credentials.walletId);
		  		root.password = password;
        	} catch (e) {
          		$log.debug(e);
          		return cb({
            	message: gettext('Wrong password')
          		});
        	}
			var autolock = function() {
				if(root.password)
					delete root.password;
		  		if (root.bKeepUnlocked){
			  		console.log("keeping unlocked");
			  		breadcrumbs.add("keeping unlocked");
			  		$timeout(autolock, 30*1000);
			  		return;
		  		}
          		console.log('time to auto-lock wallet', fc.credentials);
          		if (fc.hasPrivKeyEncrypted()) {
            		$log.debug('Locking wallet automatically');
					try {
						fc.lock();
						breadcrumbs.add('locked '+fc.credentials.walletId);
					} catch (e) {};
          		};
        	};
        	$timeout(autolock, 30*1000);
        	return cb();
      	});
    };
    
    // continue to request password until the correct password is entered
    root.insistUnlockFC = function(error_message, cb){
        root.unlockFC(error_message, function(err){
            if (!err)
                return cb();
            $timeout(function(){
                root.insistUnlockFC(err.message, cb);
            }, 100);
        });
    };

    root.getWallets = function(network) {
      	if (!root.profile) return [];

      	var config = configService.getSync();
      	config.colorFor = config.colorFor || {};
      	config.aliasFor = config.aliasFor || {};
      	var ret = lodash.map(root.profile.credentials, function(c) {
        	return {
          		m: c.m,
          		n: c.n,
		  		is_complete: (c.publicKeyRing && c.publicKeyRing.length === c.n),
          		name: config.aliasFor[c.walletId] || c.walletName,
          		id: c.walletId,
          		network: c.network,
          		color: config.colorFor[c.walletId] || '#2C3E50'
        	};
      	});
      	ret = lodash.filter(ret, function(w) {
        	return (w.network == network && w.is_complete);
      	});
      	return lodash.sortBy(ret, 'name');
    };

	
	
	root.requestTouchid = function(cb) {
		var fc = root.focusedClient;
		var config = configService.getSync();
		config.touchIdFor = config.touchIdFor || {};
		if (window.touchidAvailable && config.touchIdFor[fc.credentials.walletId])
			$rootScope.$emit('Local/RequestTouchid', cb);
		else
			return cb();
	};
		
	root.replaceProfile = function (xPrivKey, mnemonic, myDeviceAddress, cb) {
		var device = require('trustnote-common/device.js');
		
		root.profile.credentials = [];
		root.profile.xPrivKey = xPrivKey;
		root.profile.mnemonic = mnemonic;
		root.profile.my_device_address = myDeviceAddress;
		device.setNewDeviceAddress(myDeviceAddress);
		
		storageService.storeProfile(root.profile, function () {
			return cb();
		});
	};


    return root;
});
