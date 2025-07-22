(function () {
    var dispatchConfirmModalController = function ($modalInstance, patientId, PatientDAO, searchParams, DispatchDAO) {
        var ctrl = this;
        ctrl.noFilters = true;
        ctrl.totalRecords = 0;
        ctrl.ok = function () {
            $modalInstance.close(ctrl.careType);
        };
        ctrl.cancel = function () {
            $modalInstance.dismiss('cancel');
        };
        if (searchParams != null) {
            for (var key in searchParams) {
                if (key != 'skip' && key != 'limit' && key != 'patientId' && searchParams.hasOwnProperty(key)) {
                    var val = searchParams[key];
                    if (val != null) {
                        ctrl.noFilters = false;
                        break;
                    }
                }
            }
        }
        ctrl.careTypeChange = function () {
            var paramsToSend = angular.copy(searchParams);
            if (ctrl.careType != null) {
                paramsToSend.careTypeId = ctrl.careType;
            }
            DispatchDAO.getEmployeeCountForDispatch(paramsToSend).then(function (res) {
                ctrl.totalRecords = res.count;
            });
        };
        PatientDAO.getPatientsForSchedule({patientIds: patientId}).then(function (res) {
            var patientObj = res[0];
            if (patientObj && patientObj.patientCareTypeCollection && patientObj.patientCareTypeCollection.length > 0) {
                var careTypesSelected = [];
                var length = patientObj.patientCareTypeCollection.length;
                var str = "";
                for (var i = 0; i < length; i++) {
                    careTypesSelected.push(patientObj.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId);
                    if (str.length > 0) {
                        str = str + ",";
                    }
                    str = str + patientObj.patientCareTypeCollection[i].insuranceCareTypeId.companyCaretypeId.id;
                }
                ctrl.careTypes = careTypesSelected;
                ctrl.careType = ctrl.careTypes[0].id;
                ctrl.careTypeChange();
            }
        });
    };
    angular.module('xenon.controllers').controller('DispatchConfirmModalController', ['$modalInstance', 'patientId', 'PatientDAO', 'searchParams', 'DispatchDAO', dispatchConfirmModalController]);
})();