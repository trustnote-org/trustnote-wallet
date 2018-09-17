'use strict';

var modules = [
    'ui.router',
    'angularMoment',
    'angular-carousel',
    'mm.foundation',
    'monospaced.qrcode',
    'monospaced.elastic',
    'gettext',
    'ngLodash',
    'uiSwitch',
    'bwcModule',
    'trustnoteApp.filters',
    'trustnoteApp.services',
    'trustnoteApp.controllers',
    'trustnoteApp.directives',
    'trustnoteApp.addons',
    'ct.ui.router.extras'
];

var trustnoteApp = window.trustnoteApp = angular.module('trustnoteApp', modules);

angular.module('trustnoteApp.filters', []);
angular.module('trustnoteApp.services', []);
angular.module('trustnoteApp.controllers', []);
angular.module('trustnoteApp.directives', []);
angular.module('trustnoteApp.addons', []);

