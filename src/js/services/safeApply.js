'use strict';

angular.module('trustnoteApp.services').factory('safeApplyService', function safeApplyServiceFactory() {
    var root = {};

    root.safeApply = function (scope, fn) {
        var phase = scope.$$phase || scope.$root.$$phase;
        if (phase == '$apply' || phase == '$digest') {
            if (fn && typeof fn === 'function') {
                fn();
            }
        }
        else {
            scope.$apply(fn);
        }
    };

    return root;
});