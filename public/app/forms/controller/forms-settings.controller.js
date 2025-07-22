(function () {
    function FormSettingController($rootScope, $state, $stateParams, $modal, FormsDAO, Page) {
        'use strict';
        var ctrl = this;
        Page.setTitle("Forms Setting");
        ctrl.complaintResDays;

        ctrl.formTypeList = angular.copy(ontime_data.formTypes);

        ctrl.typeChange = function () {
            // Typechange Code goes here
            if (ctrl.formType == 'complaintform') {
                ctrl.getComplaintDays()
            }
        }

        ctrl.getComplaintDays = function () {
            $rootScope.maskLoading();
            FormsDAO.getComplaintPolicyResolutionTime().then(res => {
                ctrl.complaintResDays = res.complaintPolicyResolutionTime;
            }).catch(err => {
                toastr.error(err.data)
                $rootScope.unmaskLoading();// showLoadingBar
            }).then((res)=>{
                $rootScope.unmaskLoading();
            })
        }

        ctrl.saveFormSetting = function () {
            if ($('#formsetting_form')[0].checkValidity()) {
                FormsDAO.setCompResolutionDays({ days: ctrl.complaintResDays }).then((res) => {
                    const characterArray = Object.values(res).filter(value => typeof value === 'string');
                    toastr.success(Object.values(characterArray))
                }).catch((err) => {
                    toastr.error(err.data)
                })
            }

        }

    }
    angular.module('xenon.controllers').controller('FormSettingController', ["$rootScope", "$state", "$stateParams", "$modal", "FormsDAO", "Page", FormSettingController]);
})();
