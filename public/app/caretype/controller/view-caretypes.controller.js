(function () {
    function ViewCareTypesCtrl(CareTypeDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, $timeout, $formService, PositionDAO) {
        var ctrl = this;

        function initialize() {
            //$rootScope.maskLoading();
            Page.setTitle("Care Types");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.careTypeList = [];
            ctrl.positions = [];
            ctrl.test = '';

            ctrl.retrieveCareTypes = retrieveCareTypes;
            ctrl.addEditPopup = addEditPopup;
            ctrl.getPositions = getPositions;
            ctrl.save = save;
            ctrl.activateDeactivatePopup = activateDeactivatePopup;
            ctrl.activateDeactivateCareType = activateDeactivateCareType;
            ctrl.retrieveCareTypes();
        }

        function getPositions() {
            PositionDAO.view({subAction: 'active'}).then(function (res) {
                $rootScope.careTypeModel.positions = res;
            });
        }
        ;

        function retrieveCareTypes() {
            CareTypeDAO.view({subAction: 'all'}).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.careTypeList = res;
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve caretypes.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function addEditPopup(caretype) {
            var caretypeCopy = angular.copy(caretype);
            $rootScope.careTypeModel = $modal.open({
                templateUrl: 'careTypeModel'
            });

            if (caretypeCopy == undefined) {
                $rootScope.careTypeModel.title = 'Add New Care Type';
                $rootScope.careTypeModel.caretype = {};
                $rootScope.careTypeModel.caretype.action = 'savecaretype';
                $rootScope.careTypeModel.companyPositionId = [];
            } else {
                $rootScope.careTypeModel.title = 'Edit Care Type';
                $rootScope.careTypeModel.caretype = caretypeCopy;
                $rootScope.careTypeModel.caretype.action = 'updatecaretype';
                $rootScope.careTypeModel.companyPositionId = [];

                angular.forEach($rootScope.careTypeModel.caretype.positionCareTypes, function (value) {
                    $rootScope.careTypeModel.companyPositionId.push(value.companyPositionId);
                })
            }

            initMultiSelect();
            
            ctrl.getPositions();

            $rootScope.careTypeModel.closePopup = function () {
                $rootScope.careTypeModel.close();
            }

            function initMultiSelect() {
                setTimeout(function () {
                    $("#companyPositionId").multiSelect({
                        afterInit: function ()
                        {
                            // Add alternative scrollbar to list
                            this.$selectableContainer.add(this.$selectionContainer).find('.ms-list').perfectScrollbar();
                        },
                        afterSelect: function ()
                        {
                            // Update scrollbar size
                            this.$selectableContainer.add(this.$selectionContainer).find('.ms-list').perfectScrollbar('update');
                        }
                    });
                    $("#options").select2({
                        placeholder: 'Choose Options',
                        allowClear: true
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                }, 1000);
            }

            $rootScope.careTypeModel.save = function () {
                if ($rootScope.careTypeModel.caretype_form.$valid) {
                    if ($rootScope.careTypeModel.companyPositionId.length == 0) {
                        toastr.error('Please select atleast one company position');
                        return;
                    }
                    $rootScope.careTypeModel.caretype.positionCareTypes = [];
                    angular.forEach($rootScope.careTypeModel.companyPositionId, function (value) {
                        $rootScope.careTypeModel.caretype.positionCareTypes.push({
                            positionCareTypePK: {'companyPositionId': value}
                        })
                    });
                    ctrl.save($rootScope.careTypeModel.caretype);
                }
            }
        }

        function save(caretype) {
            //position.positionGroup = position.positionGroup.join(',');
            CareTypeDAO.update(caretype).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Company Care Type saved.");
                $rootScope.careTypeModel.close();
                ctrl.retrieveCareTypes();
                //Reset dirty status of form
                if ($.fn.dirtyForms) {
                    $('form').dirtyForms('setClean');
                    $('.dirty').removeClass('dirty');
                }
            }).catch(function (data, status) {
                toastr.error(data.data);
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function activateDeactivatePopup(caretype, modal_id, action, modal_size, modal_backdrop)
        {
            $rootScope.careTypeActivateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.careTypeActivateModal.action = action;
            $rootScope.careTypeActivateModal.caretype = caretype;

            if (action == 'activate') {
                $rootScope.careTypeActivateModal.title = 'Activate Care Type';
            } else {
                $rootScope.careTypeActivateModal.title = 'Deactivate Care Type';
            }


            $rootScope.careTypeActivateModal.confirm = function (caretype) {
                ctrl.activateDeactivateCareType(caretype, action);
            };

            $rootScope.careTypeActivateModal.dismiss = function () {
                $rootScope.careTypeActivateModal.close();
            }

        }

        function activateDeactivateCareType(caretype, action) {
            CareTypeDAO.changestatus({id: caretype.id, status: action}).then(function (res) {
                toastr.success("Care Type " + action + "d.");
                ctrl.retrieveCareTypes();
            }).catch(function (data, status) {
                toastr.error("Care Type cannot be " + action + "d.");
            }).then(function () {
                $rootScope.careTypeActivateModal.close();
                $rootScope.unmaskLoading();
            });
        }


        initialize();
    }
    ;

    angular.module('xenon.controllers').controller('ViewCareTypesCtrl', ["CareTypeDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "$timeout", "$formService", "PositionDAO", ViewCareTypesCtrl]);
})();