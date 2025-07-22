(function () {
    var confirmModalController = function ($modalInstance, message, title,subtitle) {
        var ctrl = this;
        ctrl.message = message;
        ctrl.title = title;
        ctrl.subtitle = subtitle;
        ctrl.ok = function () {
            $modalInstance.close();
        };
        ctrl.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
    };
    angular.module('xenon.controllers').controller('ConfirmModalController', ['$modalInstance', 'message', 'title','subtitle', confirmModalController]);
})();