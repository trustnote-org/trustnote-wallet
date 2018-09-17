var client = module.exports = require('./api');

client.Utils = require('./common/utils');
client.sjcl = require('sjcl');

// Expose bitcore
client.Bitcore = require('bitcore-lib');
