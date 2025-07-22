(function () {
    function LocationLookupCtrl($rootScope, $scope, $http, $state, $timeout, Page) {
        var ctrl = this;
        Page.setTitle("Location Lookup");
        $rootScope.layoutOptions.sidebar.hideMenu = true;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.locations = [
            {code: '1', name: 'Pharmacy**'}, 
            {code: '3', name: 'School'}, 
            {code: '4', name: 'Homeless Shelter'}, 
            {code: '5', name: 'Indian Health Service Free-standing Facility'},
            {code: '6', name: 'Indian Health Service Provider-based Facility'},
            {code: '7', name: 'Tribal 638 Free-standing Facility'},
            {code: '8', name: 'Tribal 638 Provider-based Facility'},
            {code: '9', name: 'Prison-Correctional Facility***'},
            {code: '11', name: 'Office'},
            {code: '12', name: 'Home'},
            {code: '13', name: 'Assisted Living Facility'},
            {code: '14', name: 'Group Home*'},
            {code: '15', name: 'Mobile Unit'},
            {code: '16', name: 'Temporary Lodging'},
            {code: '17', name: 'Walk-in Retail Health Clinic'}
        ];
        if (window.opener) {
//            inside a pop-up window or target=_blank window
            ctrl.submit = function () {
                if (localStorage.getItem('locationLookup')) {
                    if (window.opener.$('#' + localStorage.getItem('locationLookup'))) {
                        window.opener.$('#' + localStorage.getItem('locationLookup')).val(ctrl.selectedLocation);
                        window.opener.$('#' + localStorage.getItem('locationLookup')).trigger('input');
                    }
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
    angular.module('xenon.controllers').controller('LocationLookupCtrl', ["$rootScope", "$scope", "$http", "$state", "$timeout", "Page", LocationLookupCtrl]);
})();