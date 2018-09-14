'use strict';

var constants = require('trustnote-common/constants.js');

angular.module('trustnoteApp.controllers').controller('qrcodeController', function ($scope, $rootScope, $timeout, $filter, $modal, $log, notification, isCordova, profileService, lodash, configService, storageService, gettext, gettextCatalog, nodeWebkit, addressService, confirmDialog, animationService, backButton, safeApplyService) {

    var self = this;
    var conf = require('trustnote-common/conf.js');
    this.protocol = conf.program;
    var config = configService.getSync();
    var configWallet = config.wallet;
    var indexScope = $scope.index;

    // INIT
    var walletSettings = configWallet.settings;
    this.unitValue = walletSettings.unitValue;
    this.bbUnitValue = walletSettings.bbUnitValue;
    this.unitName = walletSettings.unitName;
    this.bbUnitName = walletSettings.bbUnitName;
    this.unitDecimals = walletSettings.unitDecimals;
    this.isCordova = isCordova;
    this.addresses = [];
    this.isMobile = isMobile.any();
    this.isWindowsPhoneApp = isMobile.Windows() && isCordova;
    this.blockUx = false;
    this.isMobile = isMobile.any();
    this.addr = {};
    this.isTestnet = constants.version.match(/t$/);
    this.testnetName = (constants.alt === '2') ? '[NEW TESTNET]' : '[TESTNET]';

    this.hideQrcode = function () {
        document.getElementsByClassName("passModalMask")[0].style.zIndex = -1;
        var elem = document.getElementById("showqrcode");
        elem.style.display = "none";
    };

    this.setAddress = function (forceNew) {
        self.addrError = null;
        var fc = profileService.focusedClient;
        if (!fc)
            return;

        // Address already set?
        if (!forceNew && self.addr[fc.credentials.walletId])
            return;

        if (indexScope.shared_address && forceNew)
            throw Error('attempt to generate for shared address');

        self.generatingAddress = true;
        $timeout(function () {
            addressService.getAddress(fc.credentials.walletId, forceNew, function (err, addr) {
                self.generatingAddress = false;

                if (err) {
                    self.addrError = err;
                } else {
                    if (addr)
                        self.addr[fc.credentials.walletId] = addr;
                }
                safeApplyService.safeApply($scope);
                // $timeout(function(){
                // 	$scope.$digest();
                // });
            });
        });
    };


    // 复制 钱包地址 到粘贴板
    this.copyAddress = function (addr) {
        if (isCordova) {
            window.cordova.plugins.clipboard.copy(addr);
            window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
        } else if (nodeWebkit.isDefined()) {
            nodeWebkit.writeToClipboard(addr);
            document.getElementsByClassName("copyedd")[0].style.display = 'block';
            setTimeout(function () {
                if (document.getElementsByClassName("copyedd")[0])
                    document.getElementsByClassName("copyedd")[0].style.display = 'none';
            }, 1000)
            // window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
        }
    };

    // this.shareAddress = function(addr) {
    // 	if (isCordova) {
    // 		if (isMobile.Android() || isMobile.Windows()) {
    // 			window.ignoreMobilePause = true;
    // 		}
    // 		window.plugins.socialsharing.share(self.protocol+':' + addr, null, null, null);
    // 	}
    // };

    // 定制金额模式
    this.openCustomizedAmountModal = function (addr) {
        $rootScope.modalOpened = true;
        var self = this;
        var fc = profileService.focusedClient;
        var ModalInstanceCtrl = function ($scope, $modalInstance) {
            $scope.addr = addr;
            $scope.color = fc.backgroundColor;
            $scope.unitName = self.unitName;
            $scope.unitValue = self.unitValue;
            $scope.unitDecimals = self.unitDecimals;
            $scope.bbUnitValue = walletSettings.bbUnitValue;
            $scope.bbUnitName = walletSettings.bbUnitName;
            $scope.isCordova = isCordova;
            $scope.buttonLabel = gettextCatalog.getString('Generate QR Code');
            $scope.protocol = conf.program;

            // 定义新属性 修改原有属性
            Object.defineProperty($scope, "_customAmount", {
                get: function () {
                    return $scope.customAmount;
                },
                set: function (newValue) {
                    $scope.customAmount = newValue;
                },
                enumerable: true,
                configurable: true
            });

            $scope.submitForm = function (form) {
                if ($scope.index.arrBalances.length === 0)
                    return console.log('openCustomizedAmountModal: no balances yet');
                var amount = form.amount.$modelValue;
                var asset = $scope.index.arrBalances[$scope.index.assetIndex].asset;
                if (!asset)
                    throw Error("no asset");
                var amountInSmallestUnits = (asset === 'base')
                    ? parseInt((amount * $scope.unitValue).toFixed(0))
                    : (asset === constants.BLACKBYTES_ASSET ? parseInt((amount * $scope.bbUnitValue).toFixed(0)) : amount);
                $timeout(function () {
                    $scope.customizedAmountUnit =
                        amount + ' ' + ((asset === 'base') ? $scope.unitName : (asset === constants.BLACKBYTES_ASSET ? $scope.bbUnitName : 'of ' + asset));
                    $scope.amountInSmallestUnits = amountInSmallestUnits;
                    $scope.asset_param = (asset === 'base') ? '' : '&asset=' + encodeURIComponent(asset);
                }, 1);
            };


            $scope.shareAddress = function (uri) {
                if (isCordova) {
                    if (isMobile.Android() || isMobile.Windows())
                        window.ignoreMobilePause = true;
                    window.plugins.socialsharing.share(uri, null, null, null);
                }
            };

            $scope.cancel = function () {
                document.getElementsByClassName("passModalMask")[0].style.zIndex = 1099;
                $scope.index.askqr = false;
                breadcrumbs.add('openCustomizedAmountModal: cancel');
                $modalInstance.dismiss('cancel');
            };
        };

        var modalInstance = $modal.open({
            templateUrl: 'views/modals/customized-amount.html',
            windowClass: animationService.modalAnimated.slideUp,
            controller: ModalInstanceCtrl,
            scope: $scope
        });
        // 更改代码
        var disableCloseModal = $rootScope.$on('closeModal', function () {
            breadcrumbs.add('openCustomizedAmountModal: on closeModal');
            document.getElementsByClassName("passModalMask")[0].style.zIndex = 1099;
            $scope.index.askqr = false;
            backButton.showQrcode = false;
            modalInstance.dismiss('cancel');
        });
        // 更改代码
        modalInstance.result.finally(function () {
            $rootScope.modalOpened = false;
            backButton.showQrcode = false;
            document.getElementsByClassName("passModalMask")[0].style.zIndex = 1099;
            $scope.index.askqr = false;
            disableCloseModal();
            var m = angular.element(document.getElementsByClassName('reveal-modal'));
            m.addClass(animationService.modalAnimated.slideOutDown);
        });
    };

    // close Qrcode
    $rootScope.$on('closeQrcode', function () {
        backButton.showQrcode = false;
        $scope.index.askqr = false;
        $timeout(function () {
            $rootScope.$apply();
        });
    });

    if (profileService.focusedClient && profileService.focusedClient.isComplete()) {
        this.setAddress();
    }
});
