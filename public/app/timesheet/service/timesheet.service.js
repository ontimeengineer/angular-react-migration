(function () {
    'use strict';
    var TimesheetDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'timesheets/:action/:subAction/:subAction1/:id', {}, {
            retrieveAllDailyAttendance: {
                method: 'GET',
//                isArray: true,
                params: {
                    action: 'dailyattendance'
                },
                transformResponse: function (data, headers) {
                    var response = {}
                    response.data = data;
                    response.headers = headers();
                    return response;
                }
            },
            query: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'all'
                }
            },
            addPunchRecord: {
                method: 'POST',
                params: {
                    action: 'addpunch'
                }
            },
            addMissedPunchRecord: {
                method: 'POST',
                params: {
                    action: 'missedpunch'
                }
            },
            retrievePatientTimeSheet: {
                method: 'GET',
//                isArray: true,
                transformResponse: function (data, headers) {
                    var response = {}
                    response.data = data;
                    response.headers = headers();
                    return response;
                },
                params: {
                    action: 'withindate'
                }
            },
            retrieveEmployeeTimeSheet: {
                method: 'GET',
//                isArray: true,
                transformResponse: function (data, headers) {
                    var response = {}
                    response.data = data;
                    response.headers = headers();
                    return response;
                },
                params: {
                    action: 'withindate'
                }
            },
            delete: {
                method: 'DELETE'
            },
            deleteMissedPunch: {
                method: 'DELETE'
            },
            get: {
                params: {
                    action: 'get'
                }
            },
            getMissedPunch: {
                params: {
                    action: 'missedpunch'
                }
            },
            getEffectiveMissedPunchesByEmployeeWithinDate: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'missedpunches'
                }
            },
            update: {
                method: 'PUT',
                params: {
                    action: 'update'
                }
            },
            updateMissedPunch: {
                method: 'PUT',
                params: {
                    action: 'missedpunch'
                }
            },
            approveUT: {
                method: 'POST',
                params: {
                    action: 'approveut'
                }
            },
            approveUTMissedPunch: {
                method: 'POST',
                params: {
                    action: 'approveutmissedpunch'
                }
            }
        });

        var signatureFileApi = resource(ontime_data.weburl + 'file/presign', {}, {
            getSignatureFile: {
                method: 'GET',
                params: {
                    fileName: 'signatureFile',
                    fileType: 'type'
                }
            }
        });
        return {
            downloadSignature: function (filter) {
                return signatureFileApi.getSignatureFile(filter).$promise;
            },
            retrieveAllDailyAttendance: function (filter) {
                return api.retrieveAllDailyAttendance(filter).$promise;
            },
            retrievePatientTimeSheet: function (filter) {
                return api.retrievePatientTimeSheet(filter).$promise;
            },
            retrieveEmployeeTimeSheet: function (filter) {
                return api.retrieveEmployeeTimeSheet(filter).$promise;
            },
            query: function (filter) {
                return api.query(filter).$promise;
            },
            addPunchRecord: function (data) {
                return api.addPunchRecord(data).$promise;
            },
            addMissedPunchRecord: function (data) {
                return api.addMissedPunchRecord(data).$promise;
            },
            delete: function (data) {
                return api.delete({action: 'delete', subAction: data.id}).$promise;
            },
            deleteMissedPunch: function (data) {
                return api.deleteMissedPunch({action: 'missedpunch', subAction: data.id}).$promise;
            },
            get: function (data) {
                return api.get(data).$promise;
            },
            getMissedPunch: function (data) {
                return api.getMissedPunch(data).$promise;
            },
            getEffectiveMissedPunchesByEmployeeWithinDate: function (data) {
                return api.getEffectiveMissedPunchesByEmployeeWithinDate(data).$promise;
            },
            update: function (data) {
                return api.update(data).$promise;
            },
            updateMissedPunch: function (data) {
                return api.updateMissedPunch(data).$promise;
            },
            approveUT: function (data) {
                if (data.isMissedPunch) {
                    delete data.isMissedPunch;
                    return api.approveUTMissedPunch(data).$promise;
                } else {
                    delete data.isMissedPunch;
                    return api.approveUT(data).$promise;
                }
            }
        };
    };
    angular.module("xenon.factory").factory('TimesheetDAO', ['$resource', TimesheetDAO]);
})();