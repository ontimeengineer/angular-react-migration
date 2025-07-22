(function () {
    function PatientInfoCtrl(patientId, insuranceProviderMap, nursingCareMap, staffCoordinatorMap, $rootScope, $modal, $modalInstance, PatientDAO) {
        var ctrl = this;

        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.patient = {};
        $rootScope.maskLoading();
        PatientDAO.retrieveEnumType({'type': 'aideSkills'}).then(function (res) {
            ctrl.capacitiesKeyValue = res;
            PatientDAO.getPatientsForSchedule({patientIds: patientId, addressRequired: true}).then(function (patients) {
                var patient = patients[0];
                ctrl.patient = angular.copy(patient);
                ctrl.patient.insuranceProviderName = insuranceProviderMap[patient.insuranceProviderId];
                ctrl.patient.nurseCaseManagerName = nursingCareMap[patient.nurseCaseManagerId];
                ctrl.patient.staffingCordinatorName = staffCoordinatorMap[patient.staffingCordinatorId];
                if (patient.languagesSpoken != null && patient.languagesSpoken.length > 0) {
                    ctrl.patient.languagesSpoken = patient.languagesSpoken.split(",");
                }
                var aideSkills = ctrl.patient.aideSkills.split(',');
                var patientAideSkills = [];
                angular.forEach(aideSkills, function (skillId) {
                    if (skillId) {
                        patientAideSkills.push(skillId);
                    }
                });
                ctrl.patient.patientAideSkills = patientAideSkills;
                $rootScope.unmaskLoading();
            });
        }).catch(function () {
            toastr.error("Failed to retrieve aide skill capacities.");
        });


        ctrl.close = function () {
            $modalInstance.close();
        };
    }
    ;
    angular.module('xenon.controllers').controller('PatientInfoCtrl', ["patientId", "insuranceProviderMap", "nursingCareMap", "staffCoordinatorMap", "$rootScope", "$modal", "$modalInstance", "PatientDAO", PatientInfoCtrl]);
})();