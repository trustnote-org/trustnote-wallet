'use strict';

// 冷钱包公钥 以及 相关信息
angular.module('trustnoteApp.controllers').controller('preferencesColdController', function ($scope,  profileService, nodeWebkit, isCordova) {
	var fc = profileService.focusedClient;
	var self = this;
	self.myDeviceAddress = require('trustnote-pow-common/wallet/device.js').getMyDeviceAddress();  // 获取我的 设备地址 getMyDeviceAddress
	self.credentials = fc.credentials;
	self.objQr_to_show = {
		"type": "c1",
		"name": "TTT",
		"pub": self.credentials.xPubKey,
		"n": 0,
		"v": Math.floor(Math.random()*9000+1000)
	};
	self.qrcode = "TTT:" + JSON.stringify(self.objQr_to_show);

	// 此时 设置一个临时变量 用于验证钱包之间扫码的实效性
	self.setTmpeNum = function () {
		profileService.tmpeNum = self.objQr_to_show.v;
		$scope.index.scanErr = 0;
	};
	self.setTmpeNum();

	var crypto = require("crypto");
	self.wallet_Id = crypto.createHash("sha256").update(self.credentials.xPubKey.toString(), "utf8").digest("base64");

	// 复制 钱包公钥 到粘贴板
	self.copyxPubKey = function() {
		var xPub = self.qrcode;
		if (isCordova) {
			window.cordova.plugins.clipboard.copy(xPub);
			//window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
			document.getElementsByClassName("toast_showCopy")[0].style.display = 'block';
			setTimeout(function () {
				if(document.getElementsByClassName("toast_showCopy")[0])
					document.getElementsByClassName("toast_showCopy")[0].style.display = 'none';
			},1000)
		}
		else if (nodeWebkit.isDefined()) {
			nodeWebkit.writeToClipboard(xPub);
			document.getElementsByClassName("toast_showCopy")[0].style.display = 'block';
			setTimeout(function () {
				if(document.getElementsByClassName("toast_showCopy")[0])
					document.getElementsByClassName("toast_showCopy")[0].style.display = 'none';
			},1000)
		}
	};
});