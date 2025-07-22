(function() {
    function BillingTab1Ctrl($rootScope, $http) {
        var ctrl = this;
        this.patient = {'gender': 'M'};
        ctrl.forms = {};
        ctrl.savePatientTab1 = savePatientTab1Data;
        function savePatientTab1Data() {
            if ($('#add_patient_tab_1_form')[0].checkValidity()) {
                alert('Patient Object : ' + JSON.stringify(ctrl.patient));
            }
        };
    }
    ;
    angular.module('xenon.controllers').controller('BillingTab1Ctrl', ["$rootScope", "$http", BillingTab1Ctrl]);
})();