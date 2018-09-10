'use strict';

var constants = require('trustnote-common/constants.js');

angular.module('trustnoteApp.services').factory('txFormatService', function (profileService, configService, lodash) {
	var root = {};

	var formatAmountStr = function (amount, asset) {
		if (!amount) return;
		if (asset !== "base" && asset !== constants.BLACKBYTES_ASSET)
			return amount;
		var config = configService.getSync().wallet.settings;
		var assetName = asset !== "base" ? 'blackbytes' : 'base';
		var unitName = asset !== "base" ? config.bbUnitName : config.unitName;
		return profileService.formatAmount(amount, assetName) + ' ' + unitName;
	};

// 更改代码 交易小费单位是MN

	var formatFeeStr = function (fee) {
		if (!fee) return;
		return fee/1000000 + ' MN';
	};



	root.processTx = function (tx) {
		if (!tx) return;

		var outputs = tx.outputs ? tx.outputs.length : 0;
		if (outputs > 1 && tx.action != 'received') {
			tx.hasMultiplesOutputs = true;
			tx.recipientCount = outputs;
			tx.amount = lodash.reduce(tx.outputs, function (total, o) {
				o.amountStr = formatAmountStr(o.amount, tx.asset);
				return total + o.amount;
			}, 0);
		}

		tx.amountStr = formatAmountStr(tx.amount, tx.asset);

		tx.feeStr = formatFeeStr(tx.fee || tx.fees);

		return tx;
	};

	return root;
});
