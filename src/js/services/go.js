'use strict';

var eventBus = require('trustnote-pow-common/event_bus.js');

angular.module('trustnoteApp.services').factory('go', function ($rootScope, $state, $deepStateRedirect, $stickyState, $log, profileService, fileSystemService, nodeWebkit, notification, authService) {
    var root = {};
    root.toPay = 0;
    root.haschoosen = 0;
    root.showCodeDetil = 0;
    root.isToRecordsDir = 0;

    // 生成 T-code 后  自动跳转到 T-code详情页面
    root.toShowTcode = function () {
        $state.go('preferences.preferencesTcode.preferencesRecords');
        root.showCodeDetil = 1;
        root.isToRecordsDir = 1;
    };

    root.openExternalLink = function (url, target) {
        if (nodeWebkit.isDefined()) {
            nodeWebkit.openExternalLink(url);
        }
        else {
            target = target || '_blank';
            window.open(url, target, 'location=no');
        }
    };

    root.path = function (path, cb) {
        $state.go(path).then(function () {
            $log.info("transition done", path);
            if (cb) return cb();
        }, function () {
            $log.error("transition failed", path);
            if (cb) return cb('animation in progress');
        });
    };

    $rootScope.go = function (path, resetState) {
        var targetState = $state.get(path);
        if (resetState) $deepStateRedirect.reset(targetState.name);
        root.path(path);
    };

    $rootScope.openExternalLink = function (url, target) {
        root.openExternalLink(url, target);
    };

    root.walletHome = function () {
        var fc = profileService.focusedClient;
        root.haschoosen = 2;
        if (fc && !fc.isComplete())
            root.path('copayers');
        else {
            root.path('walletHome', function () {
                $rootScope.$emit('Local/SetTab', 'walletHome', true);
            });
        }
    };

    root.send = function (cb) {
        $stickyState.reset('walletHome');
        root.path('walletHome', function () {
            $rootScope.$emit('Local/SetTab', 'send');
            if (cb)
                cb();
        });
    };

    // 更改代码 （ tab-4 到mywallet ）
    root.wallet = function () {
        var fc = profileService.focusedClient;
        if (fc && !fc.isComplete())
            root.path('copayers');
        else {
            root.path('mywallet', function () {
                $rootScope.$emit('Local/SetTab', 'mywallet', true);
            });
        }
    };


    root.history = function (cb) {
        root.path('walletHome', function () {
            $rootScope.$emit('Local/SetTab', 'walletHome');
            if (cb)
                cb();
        });
    };

    root.addWallet = function () {
        $state.go('add');
    };

    root.preferences = function () {
        $state.go('preferences');
    };

    root.preferencesGlobal = function () {
        $state.go('preferencesGlobal');
    };

    root.reload = function () {
        $state.reload();
    };

    // 添加变量：控制观察钱包 (交易页面） 默认是0 普通钱包
    root.observed = 0;

    function handleUri(uri) {
        console.log("handleUri " + uri);

        require('trustnote-pow-common/uri.js').parseUri(uri, {
            ifError: function (err) {
                console.log(err);
                notification.error(err);
                //notification.success(gettextCatalog.getString('Success'), err);
            },

            ifOk: function (objRequest) {
                // console.log("request: "+JSON.stringify(objRequest));
                if (root.haschoosen != 2) {
                    return;
                }
                if (objRequest.type === 'address') {
                    root.send(function () {
                        $rootScope.$emit('paymentRequest', objRequest.address, objRequest.amount, objRequest.asset);
                    });
                }
                // ***************** tcode - 接收资产
                else if (objRequest.type === 'tcode') {
                    root.tempTcode = objRequest.to_address;
                    root.isToRecDir = 1;
                    $rootScope.go('preferences.preferencesTcode.receive');
                }

                // ***************** 扫码登陆
                else if (objRequest.type === 'login') {

                    // 判断 是否添加了密码*****************

                    root.objToWeb = objRequest;
                    root.path('login');
                }

                // ***************** 扫码 发送资产
                else if (objRequest.type === 'payment') {
                    root.objSendAsset = objRequest.sendAssetMsg;
                    root.path('payment');
                }

                // ***************** 冷钱包扫描
                else if (objRequest.type === 'ob_walletToPay') {
                    root.toPay = 1;
                    root.objDetail = {
                        "to_address": objRequest.to_address,
                        "amount": objRequest.amount,
                        "v": objRequest.v
                    };
                    root.paths = objRequest.path;
                    root.text_to_sign = new Buffer(objRequest.text_to_sign, "base64");
                }
                else if (objRequest.type === 'pairing') {
                    $rootScope.$emit('Local/CorrespondentInvitation', objRequest.pubkey, objRequest.hub, objRequest.pairing_secret);
                }
                else if (objRequest.type === 'auth') {
                    authService.objRequest = objRequest;
                    root.path('authConfirmation');
                }
                else
                    throw Error('unknown url type: ' + objRequest.type);
            }
        });
    }

    function extractTrustnoteArgFromCommandLine(commandLine) {
        var conf = require('trustnote-pow-common/conf.js');
        var re = new RegExp('^' + conf.program + ':', 'i');
        var arrParts = commandLine.split(' '); // on windows includes exe and all args, on mac just our arg
        for (var i = 0; i < arrParts.length; i++) {
            var part = arrParts[i].trim();
            if (part.match(re))
                return part;
        }
        return null;
    }

    function registerWindowsProtocolHandler() {
        // now we do it in inno setup(一个免费的安装制作软件)
    }

    function createLinuxDesktopFile() {
        console.log("will write .desktop file");
        var fs = require('fs' + '');
        var path = require('path' + '');
        var child_process = require('child_process' + '');
        var package = require('../package.json' + ''); // relative to html root
        var applicationsDir = process.env.HOME + '/.local/share/applications';
        fileSystemService.recursiveMkdir(applicationsDir, parseInt('700', 8), function (err) {
            console.log('mkdir applications: ' + err);
            fs.writeFile(applicationsDir + '/' + package.name + '.desktop', "[Desktop Entry]\n\
Type=Application\n\
Version=1.0\n\
Name="+ package.name + "\n\
Comment="+ package.description + "\n\
Exec="+ process.execPath.replace(/ /g, '\\ ') + " %u\n\
Icon="+ path.dirname(process.execPath) + "/public/img/icons/icon-white-outline.iconset/icon_256x256.png\n\
Terminal=false\n\
Categories=Office;Finance;\n\
MimeType=x-scheme-handler/"+ package.name + ";\n\
X-Ubuntu-Touch=true\n\
X-Ubuntu-StageHint=SideStage\n", { mode: 0755 }, function (err) {
                    if (err)
                        throw Error("failed to write desktop file: " + err);
                    child_process.exec('update-desktop-database ~/.local/share/applications', function (err) {
                        if (err)
                            throw Error("failed to exec update-desktop-database: " + err);
                        console.log(".desktop done");
                    });
                });
        });
    }

    var gui;
    try {
        gui = require('nw.gui');
    }
    catch (e) {
    }

    if (gui) { // nwjs
        var removeListenerForOnopen = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function () {
            removeListenerForOnopen();
            gui.App.on('open', function (commandLine) {
                console.log("Open url: " + commandLine);
                if (commandLine) {
                    var file = extractTrustnoteArgFromCommandLine(commandLine);
                    if (!file)
                        return console.log("no TTT: arg found");
                    handleUri(file);
                    gui.Window.get().focus();
                }
            });
        });
        console.log("argv: " + gui.App.argv);
        if (gui.App.argv[0]) {
            // wait till the wallet fully loads
            var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function () {
                setTimeout(function () {
                    handleUri(gui.App.argv[0]);
                }, 100);
                removeListener();
            });
        }
        if (process.platform === 'win32' || process.platform === 'linux') {
            // wait till the wallet fully loads
            var removeRegListener = $rootScope.$on('Local/BalanceUpdated', function () {
                setTimeout(function () {
                    (process.platform === 'win32') ? registerWindowsProtocolHandler() : createLinuxDesktopFile();
                    gui.desktop = process.env.HOME + '/.local/share/applications';
                }, 200);
                removeRegListener();
            });
        }
		/*var win = gui.Window.get();
		win.on('close', function(){
			console.log('close event');
			var db = require('trustnote-pow-common/db.js');
			db.close(function(err){
				console.log('close err: '+err);
			});
			this.close(true);
		});*/
    }
    else if (window.cordova) {
        //console.log("go service: setting temp handleOpenURL");
        //window.handleOpenURL = tempHandleUri;
        // wait till the wallet fully loads
        var removeListener = $rootScope.$on('Local/BalanceUpdatedAndWalletUnlocked', function () {
            console.log("setting permanent handleOpenURL");
            window.handleOpenURL = handleUri;
            if (window.open_url) { // use cached url at startup
                console.log("using cached open url " + window.open_url);
                setTimeout(function () {
                    handleUri(window.open_url);
                }, 100);
            }
            removeListener();
        });
		/*
		document.addEventListener('backbutton', function() {
			console.log('doc backbutton');
			if (root.onBackButton)
				root.onBackButton();
		});*/
        document.addEventListener('resume', function () {
            console.log('resume');
            $rootScope.$emit('Local/Resume');
        }, false);
    }


    root.handleUri = handleUri;

    return root;



}).factory('$exceptionHandler', function ($log) {
    return function myExceptionHandler(exception, cause) {
        console.log("angular $exceptionHandler");
        $log.error(exception, cause);
        eventBus.emit('uncaught_error', "An exception occurred: " + exception + "; cause: " + cause, exception);
    };
});

function tempHandleUri(url) {
    console.log("saving open url " + url);
    window.open_url = url;
}


console.log("parsing go.js");
if (window.cordova) {
    // this is temporary, before angular starts
    console.log("go file: setting temp handleOpenURL");
    window.handleOpenURL = tempHandleUri;
}

// window.onerror = function(msg, url, line, col, error){
// 	console.log("onerror");
// 	eventBus.emit('uncaught_error', "Javascript error: "+msg, error);
// };

process.on('uncaughtException', function (e) {
    console.error("uncaughtException");
    eventBus.emit('uncaught_error', "Uncaught exception: " + e, e);
});

