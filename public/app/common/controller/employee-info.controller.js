(function () {
    function EmployeeInfoCtrl(employeeId, $rootScope, $modal, $modalInstance, EmployeeDAO) {
        var ctrl = this;

        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.calledOnce = false;
        $rootScope.maskLoading();
        ctrl.employeeId = employeeId;
        ctrl.profileImage = "assets/images/user-5.png";
        EmployeeDAO.get({id: employeeId}).then(function (res) {
            ctrl.employee = angular.copy(res);
            if (ctrl.employee.languageSpoken != null && ctrl.employee.languageSpoken.length > 0) {
                ctrl.employee.languageSpoken = ctrl.employee.languageSpoken.split(",");
            }
            $rootScope.unmaskLoading();
            if (ctrl.employee.profileImage != null && ctrl.employee.profileImage != '') {
                EmployeeDAO.downloadProfilePic({fileName: ctrl.employee.profileImage, fileType: 'c'}).then(function (res) {
                    ctrl.profileImage = res.signedUrl;
                }).catch(function () {});
            }
        });
        
        ctrl.readNotes = function (isProfile) {
            if(!isProfile && !ctrl.calledOnce){
                ctrl.calledOnce = true;
                EmployeeDAO.readNotes({userId: employeeId}).then(function (res) {
                    console.log("read documents", res);
                });
            }            
        };
        
        ctrl.close = function () {
            $modalInstance.close(ctrl.calledOnce);
        };
    }
    ;
    angular.module('xenon.controllers').controller('EmployeeInfoCtrl', ["employeeId", "$rootScope", "$modal", "$modalInstance", "EmployeeDAO", EmployeeInfoCtrl]);
})();