(function () {
    'use strict';
    var PatientRecordDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'patients/:patientId/records/:id/:action/:subAction', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
            },
            getById: {
                method: 'GET',
            },
            save: {
                method: "POST"
            },
            update: {
                method: 'PUT'
            },
            delete: {
                method: 'DELETE'
            },
            fetchFormDownloadInfo: {
                method: 'HEAD',
                params: {
                    action: 'download',
                    company_code: ontime_data.company_code
                },
            },
            getLatestRecord: {
                method: 'GET',
                params: {
                    action: 'latest'
                }
            },
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            getById: function (patientId, recordId, fetchPatientAddress = false) {
                return api.getById({ patientId: patientId, id: recordId, fetchPatientAddress }).$promise
            },
            save: function (data) {
                return api.save({patientId: data.patientId}, data).$promise;
            },
            update: function (data) {
                return api.update({ patientId: data.patientId, id: data.id }, data).$promise;
            },
            delete: function (data) {               
                return api.delete(data).$promise;
            },
            fetchFormDownloadInfo: function (data) {
                return api.fetchFormDownloadInfo({patientId: data.patientId, id: data.id}).$promise;
            },
            getLatestRecord: function (req) {
                return api.getLatestRecord(req).$promise
            }
        };
    };
    angular.module("xenon.factory").factory('PatientRecordDAO', ['$resource', PatientRecordDAO]);
})();
