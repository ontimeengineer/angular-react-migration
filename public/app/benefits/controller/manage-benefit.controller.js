/* global ontime_data */

(function () {
    function ManageBenefitCtrl($scope, $rootScope, $state, $modal, $timeout, BenefitDAO, Page) {
        var ctrl = this;
        ctrl.selectedBenefits = [];
        ctrl.benifitObj = {};
        ctrl.benifitObj.benefitPackageLineSet = [];
        var avoidWatch = true;

        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id)) || $rootScope.currentUser.allowedFeature.indexOf('EDIT_BENEFIT') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Update Benefit");
            ctrl.editMode = true;
        } else {
            if ($rootScope.currentUser.allowedFeature.indexOf('CREATE_BENEFIT') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Add Benefit");
        }
        
        ctrl.resetBenifits = function(){                        
            avoidWatch = true;
            ctrl.selectedBenefits = [];
            delete ctrl.benifitObj.packageName;
            ctrl.benifitObj.benefitPackageLineSet = _.remove(ctrl.benifitObj.benefitPackageLineSet,function(benefitPackageLine){
                return typeof benefitPackageLine.id !== 'undefined';
            });
            
            _.each(ctrl.benifitObj.benefitPackageLineSet,function(benefitPackageLine){
                benefitPackageLine.isDeleted = true;
            });
        };

        //function called on page initialization.
        function pageInit() {
            ctrl.benefitList = ontime_data.benefitList;
            if ($state.params.id && $state.params.id !== '') {
                BenefitDAO.get({id: $state.params.id}).then(function (res) {
                    ctrl.benifitObj = res;
                    if (ctrl.benifitObj.benefitPackageLineSet == null) {
                        ctrl.benifitObj.benefitPackageLineSet = [];
                    } else {
                        angular.forEach(ctrl.benifitObj.benefitPackageLineSet, function (obj) {
                            if (ctrl.benefitList.indexOf(obj.lineType)) {
                                avoidWatch = true;
                                ctrl.selectedBenefits.push(obj.lineType);
                            }
                        });
                    }
                }).catch(function (data, status) {
                    toastr.error("Failed to retrieve Payer.");
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {

                        }
                    }); // showLoadingBar
                }).then(function () {                    
                    $rootScope.unmaskLoading();
                    $timeout(function () {
                        $('#multi-select').multiSelect('refresh');
                    });                    
                });
            }
        }
        pageInit();        

        // Open Simple Modal
        ctrl.openModal = function (modal_id, modal_size, modal_backdrop, editMode) {

            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('benefits', 'benefit-modal'),
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'BenefitModalCtrl as benefitModal',
                resolve: {
                    selectedType: function () {
                        return ctrl.newSelectedType;
                    },
                    benefitPackageLineSet: function () {
                        return angular.copy(ctrl.benifitObj.benefitPackageLineSet);
                    },
                    editMode: function () {
                        return editMode;
                    }
                }
            });
            modalInstance.result.then(function (result) {
                if (result.reverse) {
                    avoidWatch = true;
                    if (!editMode)
                        ctrl.selectedBenefits.splice(ctrl.selectedBenefits.indexOf(ctrl.newSelectedType.toString()), 1);
                    else
                        ctrl.selectedBenefits.push(ctrl.newSelectedType.toString());
                }
                if (result.benefitPackageLineSet) {
                    ctrl.benifitObj.benefitPackageLineSet = angular.copy(result.benefitPackageLineSet);
                }
            });
        };



        $scope.$watch(function () {
            return ctrl.selectedBenefits;
        }, function (newValue, oldValue) {
            if (avoidWatch === false) {
                $timeout(function () {
                    $("#multi-select").multiSelect('refresh');
                });
                if (newValue != null && (oldValue == null || newValue.length > oldValue.length)) {
                    if (oldValue == null) {
                        ctrl.newSelectedType = newValue;
                    } else {
                        ctrl.newSelectedType = arr_diff(newValue, oldValue);
                    }
                    ctrl.openModal('modal-5', 'md', 'static', false);
                } else if (oldValue !== null && newValue.length < oldValue.length) {
                    ctrl.newSelectedType = arr_diff(oldValue, newValue);
                    ctrl.openModal('modal-5', 'md', 'static', true);
                }
            } else {
                avoidWatch = false;
                $timeout(function () {
                    $("#multi-select").multiSelect('refresh');
                });
            }
        }, true);

        ctrl.saveBenifits = function () {
            if ($('#add_benifit_form')[0].checkValidity()) {
                var benifitObjToSave = angular.copy(ctrl.benifitObj);
                $rootScope.maskLoading();
                if ($state.params.id && $state.params.id !== '') {
                    BenefitDAO.update({data: benifitObjToSave, id: $state.params.id}).then(function () {
                        toastr.success("Benifit Package Information updated.");
                        $state.go('admin.benefits');
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                } else {                                        
                    BenefitDAO.save(benifitObjToSave).then(function () {
                        toastr.success("Benifit Package Information saved.");
                        $state.go('admin.benefits');
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }

            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('ManageBenefitCtrl', ["$scope", "$rootScope", "$state", "$modal", "$timeout", "BenefitDAO", "Page", ManageBenefitCtrl]);
})();

