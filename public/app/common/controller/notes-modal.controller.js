(function () {
    function NotesCtrl(userId, type, $rootScope, $modalInstance) {
        var ctrl = this;

        $rootScope.maskLoading();

        ctrl.userId = userId;
        ctrl.type = type;

        ctrl.close = function () {
            $modalInstance.close();
        };
    }
    ;
    angular.module('xenon.controllers').controller('NotesCtrl', ["userId", "type", "$rootScope", "$modalInstance", NotesCtrl]);
})();