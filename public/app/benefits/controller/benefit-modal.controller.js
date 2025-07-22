/* global ontime_data, _ */

(function () {
    function BenefitModalCtrl(selectedType, benefitPackageLineSet, editMode, $modalInstance, $timeout) {
        var ctrl = this;
        ctrl.parameters = {};
        if (selectedType !== null) {
            ctrl.selectedBenefitObj = selectedType[0];
        }
        if (ctrl.selectedBenefitObj == 'HEC' || ctrl.selectedBenefitObj == 'WFC' || ctrl.selectedBenefitObj == '401') {
            ctrl.parameters['employerContributionType'] = 'F';
        }
        ctrl.modalTitle = ontime_data.benefitMap[ctrl.selectedBenefitObj];
        if (_.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj})) {
            ctrl.parameters = angular.copy(_.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj}));
        } else {
            ctrl.parameters.lineType = selectedType[0];
        }

        ctrl.editMode = editMode;
        ctrl.getDaysCount = function (num) {
            return new Array(num);
        };
        ctrl.save = function () {
            if ($('#benefit_model_form')[0].checkValidity()) {
                ctrl.parameters.isDeleted = false;
                if (_.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj}) && _.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj}).isDeleted === false) {
                    $modalInstance.close({reverse: true, benefitPackageLineSet: _.map(benefitPackageLineSet, function (lineTypeObj) {
                            return ctrl.parameters.lineType === lineTypeObj.lineType ? ctrl.parameters : lineTypeObj;
                        })});
                } else if (_.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj}) && _.find(benefitPackageLineSet, {lineType: ctrl.selectedBenefitObj}).isDeleted === true) {
                    $modalInstance.close({reverse: false, benefitPackageLineSet: _.map(benefitPackageLineSet, function (lineTypeObj) {
                            return ctrl.parameters.lineType === lineTypeObj.lineType ? ctrl.parameters : lineTypeObj;
                        })});
                } else {
                    benefitPackageLineSet.push(ctrl.parameters);
                    $modalInstance.close({reverse: false, benefitPackageLineSet: benefitPackageLineSet});
                }
            }
        };
        ctrl.remove = function () {
            ctrl.parameters.isDeleted = true;
            if (ctrl.parameters.id) {
                $modalInstance.close({reverse: false, benefitPackageLineSet: _.map(benefitPackageLineSet, function (lineTypeObj) {
                        return ctrl.parameters.lineType === lineTypeObj.lineType ? ctrl.parameters : lineTypeObj;
                    })});
            } else {
                $modalInstance.close({reverse: false, benefitPackageLineSet: _.remove(benefitPackageLineSet, function (lineTypeObj) {
                        return ctrl.parameters.lineType !== lineTypeObj.lineType;
                    })});
            }
        };
        ctrl.cancel = function () {
            //reverse the action.
            $modalInstance.close({reverse: true});
        };
        //to make the radio buttons selected, theme bug
        setTimeout(function () {
            cbr_replace();
        }, 100);
    }
    angular.module('xenon.controllers').controller('BenefitModalCtrl', ["selectedType", "benefitPackageLineSet", "editMode", "$modalInstance", "$timeout", BenefitModalCtrl]);
})();