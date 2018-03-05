'use strict';

var _ = require('lodash');

var Constants = require('./constants');

function Utils() { };


Utils.formatAmount = function (bytes, unitCode, opts) {
	if (!_.isNumber(bytes)) throw new Error("Variable should be a Number.");
	if (!Constants.UNITS[unitCode]) throw new Error("Illegal Argument.");

	function addSeparators(nStr, thousands, decimal, minDecimals) {

		// 替换 后面是 十进制
		nStr = nStr.replace('.', decimal);
		// 分割 成 ===> 数组
		var x = nStr.split(decimal);
		// x0 获取 整数位
		var x0 = x[0];
		// x1 获取 小数位
		var x1 = x[1];

		// losash插件 .dropRightWhile命令 从右向左查找 从第一个返回的false值开始 向后面删除
		x1 = _.dropRightWhile(x1, function (n, i) {	// n：value	i：index
			return n == '0' && i >= minDecimals;
		}).join(''); // 最后转换成 str字符串

		var x2 = x.length > 1 && parseInt(x[1])
			? decimal + x1
			: '';

		// in safari, toLocaleString doesn't add thousands separators
		if (navigator && navigator.vendor && navigator.vendor.indexOf('Apple') >= 0) {
			x0 = x0.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);
			return x0 + x2;
		}
		else {
			// 暂定义为 - 坑：需优化
			return parseFloat(x0 + x2).toLocaleString([], {maximumFractionDigits: 20});
		}
	}

	opts = opts || {};

	// 引入变量 Constants = require('./constants')
	var u = Constants.UNITS[unitCode];

	// bytes：现总资产；  u.value:现所用单位；  最后得资产的 位数
	var intAmountLength = Math.floor(bytes / u.value).toString().length;

	var digits = intAmountLength >= 7 || unitCode == 'one'
		? 0
		: 7 - intAmountLength;

	var amount = opts.dontRound
		? (bytes / u.value).toString()
		: (bytes / u.value).toFixed(digits);
	return addSeparators(amount, opts.thousandsSeparator || ',', opts.decimalSeparator || '.', u.minDecimals);
};

module.exports = Utils;
