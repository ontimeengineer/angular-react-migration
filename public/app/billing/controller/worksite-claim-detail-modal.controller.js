(function () {
    var workSiteClaimLinesCtrl = function ($modalInstance, workSiteName, workSiteClaimLines) {
        var ctrl = this;
        ctrl.title = workSiteName;
        ctrl.workSiteClaimLines = angular.copy(workSiteClaimLines);
        angular.forEach(ctrl.workSiteClaimLines, function (line) {
            if (line.serviceFromDate !== null) {
                line.serviceFromDate = Date.parse(line.serviceFromDate);
            }
            if (line.serviceToDate !== null) {
                line.serviceToDate = Date.parse(line.serviceToDate);
            }
        });
        ctrl.close = function () {
            $modalInstance.close();
        };
    };
    angular.module('xenon.controllers').controller('WorkSiteClaimLinesCtrl', ['$modalInstance', 'workSiteName',
        'workSiteClaimLines', workSiteClaimLinesCtrl]);
})();