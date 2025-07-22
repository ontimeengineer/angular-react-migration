/* global ontime_data, _ */

(function () {
    function ViewRolesCtrl(RoleDAO, UserDAO, $rootScope, $modal, Page) {
        var ctrl = this;
        UserDAO.getUserFeatures().then(function (featureList) {
            ctrl.featureList = angular.copy(featureList);
            console.log(ctrl.featureList);
        });

        function initialize() {
            $rootScope.maskLoading();
            Page.setTitle("Roles");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.roleList = [];

            ctrl.retrieveRoles = retrieveRolesData;
            ctrl.addEditPopup = addEditPopup;
            ctrl.save = save;
            ctrl.activateDeactivatePopup = activateDeactivatePopup;
            ctrl.activateDeactivateRole = activateDeactivateRole;
            ctrl.retrieveRoles();
        }

        function initMultiSelect() {
            setTimeout(function () {
                $("#multi-select").multiSelect({
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
            }, 100);
        }


        function retrieveRolesData() {

            RoleDAO.retrieveAll({status:'all',featuresRequired:true}).then(function (roles) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar

                _.each(roles,function(role){
                    role.featuresArray = role.features ? role.features.split(',') : [];
                    ctrl.roleList.push(role);
                });
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve users.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data');
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function addEditPopup(role) {
            var roleCopy = angular.copy(role);
            $rootScope.roleModel = $modal.open({
                templateUrl: 'roleModel',
                size: "lg",
                backdrop: true,
                keyboard: false
            });
            $rootScope.roleModel.featureList = ctrl.featureList;
            if (roleCopy == undefined) {
                $rootScope.roleModel.title = 'Add New Role';
                $rootScope.roleModel.role = {};
                $rootScope.roleModel.role.unauthorisedFeatures = [];
                $rootScope.roleModel.role.orgCode = ontime_data.company_code;
                $rootScope.roleModel.role.status = "a";
            } else {
                $rootScope.roleModel.title = 'Edit Role';
                delete roleCopy.features;
                $rootScope.roleModel.role = roleCopy;                
                if (!roleCopy.featureIds) {
                    $rootScope.roleModel.role.featureIds = [];
                    /* To Prevent From Removing UnAuthorised features*/
                        $rootScope.roleModel.role.unauthorisedFeatures = [];
                    /* To Prevent From Removing UnAuthorised features*/    
                } else {
                    /* To Prevent From Removing UnAuthorised features*/
                        console.log("$rootScope.roleModel.featureList",_.map($rootScope.roleModel.featureList,'id'));
                        console.log("roleCopy.featureIds",roleCopy.featureIds);
                        $rootScope.roleModel.role.unauthorisedFeatures = _.difference(roleCopy.featureIds,_.map($rootScope.roleModel.featureList,'id'));
                        console.log("$rootScope.roleModel.role.unauthorisedFeatures",$rootScope.roleModel.role.unauthorisedFeatures);
                    /* To Prevent From Removing UnAuthorised features*/
                    $rootScope.roleModel.role.featureIds = roleCopy.featureIds;
                }
            }

            $rootScope.roleModel.closePopup = function () {
                $rootScope.roleModel.close();
            };

            $rootScope.roleModel.save = function () {
                if ($rootScope.roleModel.role_form.$valid) {
                    ctrl.save($rootScope.roleModel.role);
                }
            };
            initMultiSelect();
            setTimeout(function () {
                cbr_replace();
            }, 100);
        }

        function save(role) {
            /* To Prevent From Removing UnAuthorised features*/
                role.featureIds = role.featureIds ? _.uniq(_.concat(role.unauthorisedFeatures,role.featureIds)) : [];
                delete role.unauthorisedFeatures;
            /* To Prevent From Removing UnAuthorised features*/
            var save; 
            if(role.id){
                save = RoleDAO.update(role);
            }else{
                save = RoleDAO.create(role);
            }
            save.then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Company Role saved.");
                $rootScope.roleModel.close();
                ctrl.retrieveRoles();
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
                console.log('Error in retrieving data');
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function activateDeactivatePopup(role, modal_id, action, modal_size, modal_backdrop)
        {
            $rootScope.roleActivateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.roleActivateModal.action = action;
            $rootScope.roleActivateModal.role = role;

            if (action == 'activate') {
                $rootScope.roleActivateModal.title = 'Activate Role';
            } else {
                $rootScope.roleActivateModal.title = 'Deactivate Role';
            }

            $rootScope.roleActivateModal.confirm = function (role) {
                ctrl.activateDeactivateRole(role, action);
            };

            $rootScope.roleActivateModal.dismiss = function () {
                $rootScope.roleActivateModal.close();
            };

        }

        function activateDeactivateRole(role, action) {
            RoleDAO.changestatus({id: role.id, status: action}).then(function (res) {
                toastr.success("Role " + action + "d.");
                ctrl.retrieveRoles();
            }).catch(function (data, status) {
                toastr.error("Role cannot be " + action + "d.");
            }).then(function () {
                $rootScope.roleActivateModal.close();
                $rootScope.unmaskLoading();
            });
        }

        initialize();
    }
    ;

    angular.module('xenon.controllers').controller('ViewRolesCtrl', ["RoleDAO","UserDAO", "$rootScope", "$modal", "Page", ViewRolesCtrl]);
})();