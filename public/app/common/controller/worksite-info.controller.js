(function () {
    function WorksiteInfoCtrl(worksiteId, positionMap, $rootScope, $modal, $modalInstance, WorksiteDAO) {
        var ctrl = this;
        ctrl.worksite = {};
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        $rootScope.maskLoading();

        WorksiteDAO.get({id: worksiteId}).then(function (res) {
            ctrl.worksite = angular.copy(res);
            ctrl.worksite.positions = [];
            angular.forEach(ctrl.worksite.positionIds,function(position){
                if(positionMap[position])
                    ctrl.worksite.positions.push(positionMap[position]);
            });            
            $rootScope.unmaskLoading();
        });

        ctrl.close = function () {
            $modalInstance.close();
        };
    };
    angular.module('xenon.controllers').controller('WorksiteInfoCtrl', ["worksiteId", "positionMap", "$rootScope", "$modal", "$modalInstance", "WorksiteDAO", WorksiteInfoCtrl]);
})();