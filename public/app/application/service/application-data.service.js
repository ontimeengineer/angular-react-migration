(function () {
    'use strict';
    var ApplicationDataService = function ($rootScope) {
        this.setBaseValues = function () {
            $rootScope.isLoginPage = true;
            $rootScope.isLightLoginPage = false;
            $rootScope.isLockscreenPage = false;
            $rootScope.isMainPage = false;
        }
    };
    angular.module("xenon.factory").service('ApplicationDataService', ['$rootScope', ApplicationDataService]);
})();
