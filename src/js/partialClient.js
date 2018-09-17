var fileSystem = require('./fileStorage');
var completeClientLoaded = false;

window.onerror = function (message) {
    console.error(message);
    console.error(new Error('Error partialClient: ' + message));
    // getFromId('splash').style.display = 'block';
    // wallet.loadCompleteClient(true);
};

function initWallet() {
    var root = {};
    root.profile = null;
    root.focusedClient = null;
    root.walletClients = {};
    root.config = null;

    function createObjProfile(profile) {
        profile = JSON.parse(profile);
        var Profile = {};
        Profile.version = '1.0.0';
        Profile.createdOn = profile.createdOn;
        Profile.credentials = profile.credentials;

        if (Profile.credentials[0] && typeof Profile.credentials[0] !== 'object')
            throw ("credentials should be an object");

        if (!profile.xPrivKey && !profile.xPrivKeyEncrypted)
            throw Error("no xPrivKey, even encrypted");
        if (!profile.tempDeviceKey)
            throw Error("no tempDeviceKey");
        Profile.xPrivKey = profile.xPrivKey;
        Profile.mnemonic = profile.mnemonic;
        Profile.xPrivKeyEncrypted = profile.xPrivKeyEncrypted;
        Profile.mnemonicEncrypted = profile.mnemonicEncrypted;
        Profile.tempDeviceKey = profile.tempDeviceKey;
        Profile.prevTempDeviceKey = profile.prevTempDeviceKey; // optional
        Profile.my_device_address = profile.my_device_address;
        return Profile;
    }

    function setWalletClients(credentials) {
        if (root.walletClients[credentials.walletId] && root.walletClients[credentials.walletId].started)
            return;

        var client = { credentials: credentials };

        client.credentials.xPrivKey = root.profile.xPrivKey;
        client.credentials.mnemonic = root.profile.mnemonic;
        client.credentials.xPrivKeyEncrypted = root.profile.xPrivKeyEncrypted;
        client.credentials.mnemonicEncrypted = root.profile.mnemonicEncrypted;

        root.walletClients[credentials.walletId] = client;
        root.walletClients[credentials.walletId].started = true;
    }

    function readStorage(cb) {
        fileSystem.get('agreeDisclaimer', function (err, agreeDisclaimer) {
            fileSystem.get('profile', function (err, profile) {
                fileSystem.get('focusedWalletId', function (err, focusedWalletId) {
                    fileSystem.get('config', function (err, config) {
                        window.config = config;
                        cb(agreeDisclaimer, profile, focusedWalletId, config ? JSON.parse(config) : config);
                    });
                });
            });
        });
    }

    // load angular.js and trustnote.js
    function loadCompleteClient(showClient) {
        self._bTrustnoteCoreLoaded = false; //"fix" : Looks like you are loading multiple copies of trustnote core, which is not supported. Running 'npm dedupe' might help.
        var body = document.body;
        var page = document.createElement('div');

        // first step: load angular.js
        // second step: load trustnote.js
        body.appendChild(page);
        var angularJs = document.createElement('script');
        angularJs.src = 'angular.js';
        angularJs.onload = function () {
            var trustnoteJS = document.createElement('script');
            trustnoteJS.src = 'trustnote.js';
            body.appendChild(trustnoteJS);
            trustnoteJS.onload = function () {
                if (showClient) showCompleteClient();
            }
        };
        body.appendChild(angularJs);
    }

    // after load done! show homepage
    function showCompleteClient() {
        getFromId('splash').style.display = 'none'; // close splash

        var pages = document.getElementsByClassName('page');
        if (pages.length === 2) {
            document.getElementsByClassName('page')[1].remove();
            document.getElementsByClassName('page')[0].style.display = 'block';
            completeClientLoaded = true;
        }
    }

    function loadProfile() {
        readStorage(function (agreeDisclaimer, profile, focusedWalletId, config) {
            if (!agreeDisclaimer || !profile) {
                getFromId('splash').style.display = 'block';
                loadCompleteClient(true);
                return;
            }

            root.config = config;
            root.profile = createObjProfile(profile);

            // If password is set hide wallet display, show splash instead
            if (root.profile.xPrivKeyEncrypted) {
                getFromId('splash').style.display = 'block';
            }

            // load wallet info
            root.profile.credentials.forEach(function (credentials) {
                setWalletClients(credentials);
            });

            // set focus wallet
            if (focusedWalletId)
                root.focusedClient = root.walletClients[focusedWalletId];
            else
                root.focusedClient = [];
            if (root.focusedClient.length === 0)
                root.focusedClient = root.walletClients[Object.keys(root.walletClients)[0]];

            loadCompleteClient();
        });
    }

    root.showCompleteClient = showCompleteClient;
    root.loadProfile = loadProfile;
    root.loadCompleteClient = loadCompleteClient;
    root.clientCompleteLoaded = function () { return completeClientLoaded; };
    return root;
}

window.wallet = new initWallet();

document.addEventListener("deviceready", function () {
    getFromId('splash').style.display = 'block';
    // wallet.loadProfile();
    wallet.loadCompleteClient(true);
});

setTimeout(function () {
    var divTextDbLock = getFromId('textDbLock');
    if (divTextDbLock) {
        divTextDbLock.style.display = 'inline-block';
    }
}, 15000);

function getFromId(id) {
    return document.getElementById(id);
}