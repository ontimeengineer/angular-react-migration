(function() {
    function ViewTasksCtrl($scope, TasksDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, $timeout, $formService, PositionDAO, LanguageDAO) {
        var ctrl = this;

        function initialize() {
            $rootScope.maskLoading();
            Page.setTitle("Tasks");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.taskList = [];

            ctrl.retrieveTasks = retrieveTasksData;
            ctrl.addPopup = addPopup;
            ctrl.editPopup = editPopup;
            ctrl.getPositions = getPositions;
            ctrl.getLanguages = getLanguages;
            ctrl.activateDeactivatePopup = activateDeactivatePopup;
            ctrl.activateDeactivateTask = activateDeactivateTask;
            ctrl.retrieveTasks();
        }

        function initMultiSelect() {
            setTimeout(function() {
                $("#companyPositionId").multiSelect({
                    afterInit: function()
                    {
                        // Add alternative scrollbar to list
                        this.$selectableContainer.add(this.$selectionContainer).find('.ms-list').perfectScrollbar();
                    },
                    afterSelect: function()
                    {
                        // Update scrollbar size
                        this.$selectableContainer.add(this.$selectionContainer).find('.ms-list').perfectScrollbar('update');
                    }
                });
                $("#options").select2({
                    placeholder: 'Choose Options',
                    allowClear: true
                }).on('select2-open', function()
                {
                    // Adding Custom Scrollbar
                    $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                });
            }, 100);
        }

        function getPositions() {
            PositionDAO.view({subAction: 'active'}).then(function(res) {
                ctrl.positions = res;
            });
        }
        ;

        function getLanguages() {
            LanguageDAO.view({subAction: 'active'}).then(function(res) {
                $rootScope.taskModel.languages = res;
            });
        }

        function retrieveTasksData() {

            TasksDAO.view({subAction: 'all'}).then(function(res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {
                    }
                }); // showLoadingBar
                ctrl.taskList = res;
            }).catch(function(data, status) {
                toastr.error("Failed to retrieve tasks.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function() {

                    }
                }); // showLoadingBar
            }).then(function() {
                $rootScope.unmaskLoading();
            });
        }

        function addPopup() {
            var modalInstance = $modal.open({
                templateUrl: 'app/task/views/create-task.html',
                controller: 'CreateTaskCtrl',
                controllerAs: 'task'
            });

            modalInstance.result.then(function(selectedItem) {
                initMultiSelect();
            }, function() {

            });
        }

        function editPopup(task) {
            var taskCopy = angular.copy(task);
            console.log(task);
            console.log(taskCopy);

            var modalInstance = $modal.open({
                templateUrl: 'app/task/views/edit-task.html',
                controller: 'EditTaskCtrl',
                controllerAs: 'task',
                resolve: {
                    task_detail: function() {
                        return taskCopy;
                    }
                }
            });

            modalInstance.result.then(function(selectedItem) {
                initMultiSelect();
            }, function() {

            });
        }

        // function save(position){
        //     //position.positionGroup = position.positionGroup.join(',');
        //     PositionDAO.update(position).then(function (res) {
        //         showLoadingBar({
        //             delay: .5,
        //             pct: 100,
        //             finish: function () {
        //             }
        //         }); // showLoadingBar
        //         toastr.success("Company Position saved.");
        //         $rootScope.positionModel.close(); 
        //         ctrl.retrievePositions();
        //         //Reset dirty status of form
        //         if ($.fn.dirtyForms) {
        //             $('form').dirtyForms('setClean');
        //             $('.dirty').removeClass('dirty');
        //         }
        //     }).catch(function (data, status) {
        //         toastr.error(data.data);
        //         showLoadingBar({
        //             delay: .5,
        //             pct: 100,
        //             finish: function () {

        //             }
        //         }); // showLoadingBar
        //         console.log('Error in retrieving data')
        //     }).then(function () {
        //         $rootScope.unmaskLoading();
        //     });
        // }

        function activateDeactivatePopup(task, modal_id, action, modal_size, modal_backdrop)
        {
            $rootScope.taskActivateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.taskActivateModal.action = action;
            $rootScope.taskActivateModal.task = task;

            if (action == 'activate') {
                $rootScope.taskActivateModal.title = 'Activate Task';
            } else {
                $rootScope.taskActivateModal.title = 'Deactivate Task';
            }


            $rootScope.taskActivateModal.confirm = function(task) {
                ctrl.activateDeactivateTask(task, action);
            };

            $rootScope.taskActivateModal.dismiss = function() {
                $rootScope.taskActivateModal.close();
            }

        }

        function activateDeactivateTask(task, action) {
            TasksDAO.changestatus({id: task.id, status: action}).then(function(res) {
                toastr.success("Task " + action + "d.");
                ctrl.retrieveTasks();
            }).catch(function(data, status) {
                toastr.error("Task cannot be " + action + "d.");
            }).then(function() {
                $rootScope.taskActivateModal.close();
                $rootScope.unmaskLoading();
            });
        }

        initialize();
    }

    function  CreateTaskCtrl($scope, PositionDAO, $q, LanguageDAO, $timeout, $modalInstance, TasksDAO, $state) {
        var vm = this;

        vm.closePopup = closePopup;
        vm.save = save;

        vm.title = 'Add New Task';
        vm.task = {};
        vm.positions = [];
        vm.companyPositionId = [];

        activate();

        function activate() {
            var promises = [getPositions(), getLanguages()];
            $q.all(promises).then(function(response) {

            })
        }

        function getPositions() {
            PositionDAO.view({subAction: 'active'}).then(function(res) {
                vm.positions = res;
                delete vm.positions["$promise"];
                delete vm.positions["$resolved"];
            });
        }

        function getLanguages() {
            LanguageDAO.view({subAction: 'active'}).then(function(res) {
                vm.languages = res;
            });
        }

        $scope.$watch(function() {
            return vm.positions;
        }, function(newVal, oldValue) {
            if (vm.positions) {
                $timeout(function() {
                    $('#companyPositionId').multiSelect('refresh');
                }, 100);
            }
        });

        function closePopup() {
            $modalInstance.dismiss();
        }

        function save(action) {
            vm.task.positionTasks = [];

            if (vm.companyPositionId.length == 0) {
                toastr.error('Please select atleast one company position');
                return;
            }
            angular.forEach(vm.companyPositionId, function(value) {
                vm.task.positionTasks.push({
                    positionTaskPK: {'companyPositionId': value},
                    status: 'a'
                })
            });

            vm.task.taskLanguageSet = [];
            var flag = 0;
            angular.forEach(vm.languages, function(value) {

                if (!angular.isUndefined(value.options) && value.options.length > 0) {
                    vm.task.taskLanguageSet.push({
                        languageId: {'id': value.id},
                        task: value.task,
                        options: value.options.join("|"),
                        companyPositionId: {id: 1}
                    });
                    if (value.languageCode == "EN-US") {
                        //vm.task.languageId = {'id': value.id};
                        if (value.task == null) {
                            toastr.error('Please enter title in English');
                            flag = 1;
                        }
                        vm.task.task = value.task;
                        vm.task.options = value.options.join("|")
                    }
                } else {
                    vm.task.taskLanguageSet.push({
                        languageId: {'id': value.id},
                        task: value.task,
                        options: "",
                        companyPositionId: {id: 1}
                    });
                    if (value.languageCode == "EN-US") {
                        //vm.task.languageId = {'id': value.id};
                        if (value.task == null) {
                            toastr.error('Please enter title in English');
                            flag = 1;
                        }
                        vm.task.task = value.task;
                        vm.task.options = "";
                    }
                }
            });

            if (flag == 1) {
                return;
            }

            TasksDAO.save(vm.task).then(function() {
                $modalInstance.close();
                toastr.success("Task saved successfully.");
                $state.go("admin.task-list", {status: 'all'}, {reload: true});
            }, function() {
                toastr.error("Something went wrong!");
            });
        }
    }

    function  EditTaskCtrl($scope, PositionDAO, $q, LanguageDAO, $timeout, $modalInstance, TasksDAO, task_detail, $state) {
        var vm = this;

        vm.closePopup = closePopup;
        vm.save = save;

        vm.title = 'Edit Task';
        vm.task = {};
        vm.positions = [];
        vm.companyPositionId = [];
        vm.languages = [];

        activate();

        function activate() {
            var promises = [getPositions()];
            $q.all(promises).then(function(response) {
                uiDataBind();
            })
        }

        function uiDataBind() {
            console.log(task_detail);
            angular.forEach(task_detail.positionTasks, function(value) {
                vm.companyPositionId.push(value.companyPositionId);
            })

            angular.forEach(task_detail.taskLanguageSet, function(value) {
                if (value.options == null) {
                    vm.languages.push({
                        id: value.languageId.id,
                        language: value.languageId.language,
                        options: [],
                        task: value.task,
                        languageCode: value.languageId.languageCode
                    })
                } else {
                    vm.languages.push({
                        id: value.languageId.id,
                        language: value.languageId.language,
                        options: value.options.split("|"),
                        task: value.task,
                        languageCode: value.languageId.languageCode

                    })
                }
            })
        }

        function getPositions() {
            PositionDAO.view({subAction: 'active'}).then(function(res) {
                vm.positions = res;
                delete vm.positions["$promise"];
                delete vm.positions["$resolved"];
            });
        }

        $scope.$watch(function() {
            return vm.positions;
        }, function(newVal, oldValue) {
            if (vm.positions) {
                $timeout(function() {
                    $('#companyPositionId').multiSelect('refresh');
                }, 100);
            }
        });

        function closePopup() {
            $modalInstance.dismiss();
        }

        function save() {
            vm.task.id = task_detail.id;
            vm.task.orgCode = task_detail.orgCode;
            vm.task.status = 'a';


            vm.task.positionTasks = [];

            if (vm.companyPositionId.length == 0) {
                toastr.error('Please select atleast one company position');
                return;
            }
            angular.forEach(vm.companyPositionId, function(value) {
                vm.task.positionTasks.push({
                    positionTaskPK: {'companyPositionId': value},
                    status: 'a'
                })
            });

            vm.task.taskLanguageSet = [];
            var flag = 0;
            angular.forEach(vm.languages, function(value) {

                if (!angular.isUndefined(value.options) && value.options.length > 0) {
                    vm.task.taskLanguageSet.push({
                        languageId: {'id': value.id},
                        task: value.task,
                        options: value.options.join("|"),
                        companyPositionId: {id: 1}
                    });
                    if (value.languageCode == "EN-US") {
                        //vm.task.languageId = {'id': value.id};
                        if (value.task == null) {
                            toastr.error('Please enter title in English');
                            flag = 1;
                        }
                        vm.task.task = value.task;
                        vm.task.options = value.options.join("|")
                    }
                } else {
                    vm.task.taskLanguageSet.push({
                        languageId: {'id': value.id},
                        task: value.task,
                        options: "",
                        companyPositionId: {id: 1}
                    });
                    if (value.languageCode == "EN-US") {
                        //vm.task.languageId = {'id': value.id};
                        if (value.task == null) {
                            toastr.error('Please enter title in English');
                            flag = 1;
                        }
                        vm.task.task = value.task;
                        vm.task.options = "";
                    }
                }
            });

            if (flag == 1) {
                return;
            }

            TasksDAO.update(vm.task).then(function() {
                $modalInstance.close();
                toastr.success("Task updated");
                $state.go("admin.task-list", {status: 'all'}, {reload: true});
            }, function() {
                toastr.error("Something went wrong!");
            });
        }
    }

    angular.module('xenon.controllers')
            .controller('ViewTasksCtrl', ["$scope", "TasksDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "$timeout", "$formService", "PositionDAO", "LanguageDAO", ViewTasksCtrl])
            .controller('CreateTaskCtrl', ["$scope", "PositionDAO", "$q", "LanguageDAO", "$timeout", "$modalInstance", "TasksDAO", "$state", CreateTaskCtrl])
            .controller('EditTaskCtrl', ["$scope", "PositionDAO", "$q", "LanguageDAO", "$timeout", "$modalInstance", "TasksDAO", "task_detail", "$state", EditTaskCtrl]);
})();