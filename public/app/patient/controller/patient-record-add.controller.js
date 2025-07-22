(function () {
    function PatientRecordAddCtrl($rootScope, $modalInstance, PatientRecordDAO, $state) {
        var ctrl = this;
        ctrl.hideForMedicalOrderCall = hideForMedicalOrder;
        ctrl.hideMedOederExp = true;
        ctrl.disableButton = true;
        ctrl.objectExpiryVisibilitySettings = {
            medical_order: 'Medical_Orders',
            progress_note: 'Progress_Note',
            home_care_plan: 'Home_Care_Plan',
            patient_consents: 'Patient_Consents',
            pdf_record: 'Pdf_Record',
            emergency_disaster: 'Emergency_Disaster'
        }
        this.recordOptions = angular.copy(ontime_data.patientRecordsObj);
        ctrl.patientRecordsRoutes = angular.copy(ontime_data.patientRecordsRoutes);
        ctrl.createdByName = getCookie("fl");
        
        function hideForMedicalOrder(hideMedOederExpVal){
            if (Object.values(ctrl.objectExpiryVisibilitySettings).includes(hideMedOederExpVal.value) || hideMedOederExpVal.value === '') {
                ctrl.disableButton = hideMedOederExpVal.value === 'Pdf_Record';
                ctrl.hideMedOederExp = true;
                ctrl.expiry = null;
            }else{
                ctrl.hideMedOederExp = false;
                ctrl.disableButton = true;
            }
        }

        ctrl.checkValidation = function () {
            if (ctrl.expiry || ctrl.recordName) {
                ctrl.disableButton = false;
            } else {
                ctrl.disableButton = true;
            }
        }

        ctrl.save = function () {
            var request = { "type": ctrl.type.value, "expiryDate": ctrl.expiry, "createdByName": ctrl.createdByName, recordName: ctrl.recordName,origin:'WEB' };
            request.patientId = $modalInstance.id;
            $rootScope.maskLoading();

            PatientRecordDAO.save(request).then(function (res) {
                toastr.success("Patient Record Added");
                if (res.type in ctrl.patientRecordsRoutes) {
                    var params = {
                        patientId: res.patientId,
                        recordType: res.type,
                        id: res.id
                };
                    $state.go(ctrl.patientRecordsRoutes[res.type], params);
                }
            }).catch(function (data, status) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.error("Failed to retrieve patient data");
            }).then(function () {
                $rootScope.unmaskLoading();
            });

            $modalInstance.close();
        };
        ctrl.close = function () {
            $modalInstance.close();
        };

    }
    ;
    angular.module('xenon.controllers').controller('PatientRecordAddCtrl', ["$rootScope", "$modalInstance", "PatientRecordDAO", "$state", PatientRecordAddCtrl]);
})();