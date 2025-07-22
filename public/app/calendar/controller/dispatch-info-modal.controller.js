(function () {
    function DispatchInfoModalCtrl(dispatch, $modalInstance) {
        var ctrl = this;
        ctrl.dispatch = dispatch;
        ctrl.close = function () {
            $modalInstance.close();
        };
    }
    ;
    angular.module('xenon.controllers').controller('DispatchInfoModalCtrl', ["dispatch", "$modalInstance", DispatchInfoModalCtrl]);
})();