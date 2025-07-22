(function () {
    function ForgotPasswordCtrl($scope, UserDAO, $rootScope, $state) {
        var ctrl = this;
        ctrl.submitHandler = function () {
            if ($('#forgotPassword').valid()) {
                setCookie("cc", ctrl.companyCode, 7);
                $rootScope.maskLoading();
                UserDAO.resetUserPassword({userName: ctrl.username, passwordType: "f"}).then(function (res) {
                    toastr.success("Instuction for resetting your password has been sent.");
                    $state.transitionTo(ontime_data.defaultState);
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('ForgotPasswordCtrl', ["$scope", "UserDAO", "$rootScope", "$state", ForgotPasswordCtrl]);
})();
