(function () {
    function ComplaintInfoCtrl(complaint, $rootScope, $modal, $modalInstance, PatientDAO) {
        var ctrl = this;
        ctrl.complaint = complaint;
        ctrl.getTitleByValue = getTitleByValue;

        ctrl.close = function () {
            $modalInstance.close();
        };

        function getTitleByValue (value, objectName) {
            const dataObject = angular.copy(ontime_data[objectName]);
            const foundItem = dataObject.find(function (item) {
                return item.value == value;
            });
            
            return foundItem !== undefined ? foundItem.title : value; 
        }

    };
    angular.module('xenon.controllers')
    .controller('ComplaintInfoCtrl', ["complaint", "$rootScope", "$modal", "$modalInstance", "PatientDAO", ComplaintInfoCtrl])
})();