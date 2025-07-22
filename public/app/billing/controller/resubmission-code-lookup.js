(function () {
    function ResubmissionLookupCtrl($rootScope, $scope, $http, $state, $timeout, Page) {
        var ctrl = this;
        Page.setTitle("Resubmission Code Lookup");
        $rootScope.layoutOptions.sidebar.hideMenu = true;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.records = [
//            {code: '1', name: 'Original Claim'},
            {code: '6', name: 'Corrected Claim'},
            {code: '7', name: 'Labled Replacement'},
            {code: '8', name: 'Mark as void'}
        ];
        if (window.opener) {
//            inside a pop-up window or target=_blank window
            ctrl.submit = function () {
                if (window.opener.$('#resubmissionCode')) {
                    window.opener.$('#resubmissionCode').val(ctrl.selectedCode);
                    window.opener.$('#resubmissionCode').trigger('input');
                }
                window.close();
            };
            ctrl.close = function () {
                window.close();
            };

        } else if (window.top !== window.self) {
//            inside an iframe
            $state.go('app.dashboard');
        } else {
//            this is a top level window
            $state.go('app.dashboard');
        }
    }
    angular.module('xenon.controllers').controller('ResubmissionLookupCtrl', ["$rootScope", "$scope", "$http", "$state", "$timeout", "Page", ResubmissionLookupCtrl]);
})();