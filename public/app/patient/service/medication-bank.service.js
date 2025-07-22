(function () {
    'use strict';
    var MedicationBankRecordDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'medications/:action', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
            },
            saveRecord: {
                method: "POST"
            },
        });
        return {
            retrieveAll: function (data) {
                return api.retrieveAll(data).$promise;
            },
            saveRecord: function (data) {
                return api.saveRecord(data).$promise;
            },
        };
    };
    angular.module("xenon.factory").factory('MedicationBankRecordDAO', ['$resource', MedicationBankRecordDAO]);
})();
