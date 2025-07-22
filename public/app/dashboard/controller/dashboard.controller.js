(function () {
    function DashboardCtrl(Page, $rootScope, $formService, $timeout, UserDAO, DashboardDAO, $filter) {
        var ctrl = this;
        Page.setTitle("Dashboard");
        ctrl.weatherObj = {location: ontime_data.weatherCity, currentTime: new Date().getTime() / 1000};
//        $rootScope.isAdminPortal = false;
//        var tasks = JSON.parse(localStorage.getItem("tasksArray"));
        ctrl.weatherIcons = {'clear-day': 'meteocons-sun', 'clear-night': 'meteocons-moon', 'rain': 'meteocons-rain', 'snow': 'meteocons-snow', 'sleet': 'meteocons-rain', 'wind': 'meteocons-wind', 'fog': 'meteocons-fog', 'cloudy': 'meteocons-cloud', 'partly-cloudy-day': 'meteocons-cloud-sun', 'partly-cloudy-night': 'meteocons-cloud-moon'}
        ctrl.currentDate= $filter('date')(new Date(), $rootScope.dateFormat);
//        if (tasks != null && tasks[$rootScope.currentUser.userName] != null) {
//            //this flag is used to hide the flickering from normal checkbox to theme checkbox
//            ctrl.inProgress = true;
//            ctrl.taskList = tasks[$rootScope.currentUser.userName];
//            $timeout(function () {
//                cbr_replace();
//                ctrl.inProgress = false;
//            });
//        } else {
//            ctrl.taskList = [];
//        }
//        $timeout(function () {
//            $("#taskList").perfectScrollbar().addClass('overflow-hidden');
//        });
//        ctrl.taskMarked = function (index) {
//            setTasksInLocalStorage();
//        };
//        ctrl.removeAllMarkedTasks = function () {
//            var taskListToSave = [];
//            angular.forEach(ctrl.taskList, function (task, index) {
//                if (!task.taskMarked) {
//                    taskListToSave.push(task);
//                }
//            });
//            ctrl.inProgress = true;
//            ctrl.taskList = [];
//            $timeout(function () {
//                ctrl.taskList = taskListToSave;
//                $timeout(function () {
//                    cbr_replace();
//                    ctrl.inProgress = false;
//                    setTasksInLocalStorage();
//                });
//            });            
//        };
//        ctrl.addTask = function () {
//            if (ctrl.taskName != null && ctrl.taskName != '') {
//                //this flag is used to hide the flickering from normal checkbox to theme checkbox
//                ctrl.inProgress = true;
//                ctrl.taskList.push({taskValue: ctrl.taskName});
//                $timeout(function () {
//                    cbr_replace();
//                    ctrl.inProgress = false;
//                    ctrl.taskName = null;
//                    setTasksInLocalStorage();
//                });
//            }
//        };
//        var setTasksInLocalStorage = function () {
//            $timeout(function () {
//                $("#taskList").perfectScrollbar("update");
//            });
//            if (tasks == null) {
//                tasks = {};
//            }
//            tasks[$rootScope.currentUser.userName] = ctrl.taskList;
//            localStorage.setItem("tasksArray", JSON.stringify(tasks));
//        };
        ctrl.retrieveCounts = function () {
            DashboardDAO.getCompianceTrackerCount({currentDate: $filter('date')(new Date(), $rootScope.dateFormat)}).then(function (res) {
                ctrl.complianceTracker = res.count;
            });
            DashboardDAO.getActivePatientCount().then(function (res) {
                ctrl.activePatientCount = res.count;
            });
            DashboardDAO.getOpenCasesCount({currentDate: $filter('date')(new Date(), $rootScope.dateFormat)}).then(function (res) {
                ctrl.openCasesCount = res.count;
            });
            DashboardDAO.getDischargedPatientsCount({currentDate: $filter('date')(new Date(), $rootScope.dateFormat)}).then(function (res) {
                ctrl.dischargedPatientsCount = res.count;
            });
        };
        ctrl.retrieveWeather = function () {
            DashboardDAO.getWeather().then(function (res) {
                ctrl.weatherObj = res;
            });
        };
        ctrl.retrieveCounts();
        ctrl.retrieveWeather();
        ctrl.companyCode = ontime_data.company_code;
    }
    ;
    angular.module('xenon.controllers').controller('DashboardCtrl', ["Page", "$rootScope", "$formService", "$timeout", "UserDAO", "DashboardDAO", "$filter", DashboardCtrl]);
})();
