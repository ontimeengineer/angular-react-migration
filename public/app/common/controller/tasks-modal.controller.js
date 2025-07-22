(function () {
    function TasksModalCtrl(
        selectedType,
        taskScheduleSet,
        editMode,
        $modalInstance
    ) {
        var ctrl = this;
        ctrl.editMode = editMode;

        // Define the days of the week
        ctrl.daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

        ctrl.generateFormCall = generateForms;

        /*================   FUNCTION CALLS   ===================*/
        ctrl.generateFormCall();

        /*================   FORM FUNCTIONS   ===================*/
        function generateForms() {
            // Initialize form data
            ctrl.daysErrorMsg = null;
            ctrl.parameters = {
                selectedDays: [],
                frequency: "",
                additionalInstructions: ""
            };
            if (selectedType !== null) {
                ctrl.selectedTasksObj = selectedType[0];
            }
            if (_.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj })) {
                ctrl.parameters = angular.copy(_.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj }));
            } else {
                ctrl.parameters.taskType = selectedType[0];
            }

        }
        // Toggle the selection of a day
        ctrl.toggleDay = function (day) {
            var index = ctrl.parameters.selectedDays.indexOf(day);
            if (index === -1) {
                ctrl.parameters.selectedDays.push(day);
            } else {
                ctrl.parameters.selectedDays.splice(index, 1);
            }
        };

        // Select all days at once or deselect if all are already selected
        ctrl.selectAllDays = function () {
            if (ctrl.parameters.selectedDays.length === ctrl.daysOfWeek.length) {
                ctrl.parameters.selectedDays = [];
            } else {
                ctrl.parameters.selectedDays = angular.copy(ctrl.daysOfWeek);
            }
        };

        ctrl.save = function () {
            //Check validity for days
            if (ctrl.parameters.selectedDays.length === 0) {
                return ctrl.daysErrorMsg = "Please select at least one day."
            }

            if ($('#task_model_form')[0].checkValidity()) {
                ctrl.parameters.isDeleted = false;
                if (_.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj }) && _.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj }).isDeleted === false) {
                    $modalInstance.close({
                        reverse: true, taskScheduleSet: _.map(taskScheduleSet, function (taskTypeObj) {
                            return ctrl.parameters.taskType === taskTypeObj.taskType ? ctrl.parameters : taskTypeObj;
                        })
                    });
                } else if (_.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj }) && _.find(taskScheduleSet, { taskType: ctrl.selectedTasksObj }).isDeleted === true) {
                    $modalInstance.close({
                        reverse: false, taskScheduleSet: _.map(taskScheduleSet, function (taskTypeObj) {
                            return ctrl.parameters.taskType === taskTypeObj.taskType ? ctrl.parameters : taskTypeObj;
                        })
                    });
                } else {
                    taskScheduleSet.push(ctrl.parameters);
                    $modalInstance.close({ reverse: false, taskScheduleSet: taskScheduleSet });
                }

                // Save the parameters task details
                // Add the parameters task details to selectedType
                // Validation can also be performed before saving
                // ...
            }
        };

        ctrl.reset = function () {
            ctrl.generateFormCall();
        }

        ctrl.remove = function () {
            ctrl.parameters.isDeleted = true;
            if (ctrl.parameters.id) { // for edit logic if there is position id then edit
                $modalInstance.close({
                    reverse: false, taskScheduleSet: _.map(taskScheduleSet, function (taskTypeObj) {
                        return ctrl.parameters.taskType === taskTypeObj.taskType ? ctrl.parameters : taskTypeObj;
                    })
                });
            } else {
                $modalInstance.close({
                    reverse: false, taskScheduleSet: _.remove(taskScheduleSet, function (taskTypeObj) {
                        return ctrl.parameters.taskType !== taskTypeObj.taskType;
                    })
                });
            }
        };

        ctrl.cancel = function () {
            // Reverse the action if canceled
            $modalInstance.close({ reverse: true });
        };
    }
    angular.module('xenon.controllers').controller('TasksModalCtrl', [
        "selectedType",
        "taskScheduleSet",
        "editMode",
        "$modalInstance",
        TasksModalCtrl
    ]);
})();
