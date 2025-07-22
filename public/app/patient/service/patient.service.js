(function () {
    'use strict';
    var PatientDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'patient/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'view'
                }
            },
            retrieveForCareType: {
                method: 'GET',
                isArray: false,
                params: {
                    action: 'view'
                },
                transformResponse: function (data, headers) {
                    var response = {};
                    response.data = JSON.parse(data);
                    response.headers = headers();
                    return response;
                }
            },
            updateEmergencyInfo: {
                method: 'POST',
                params: {
                    subAction: 'updateEmergencyInfo'
                }
            },
            getPatientsByDistance: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'bydistance'
                }
            },
            retrieveForSelect: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'select'
                }
            },
            //this method will be used for patient save or update based on the action passed
            update: {
                method: 'POST'
            },
            delete: {
                method: 'GET'
            },
            changestatus: {
                method: 'GET'
            },
            getPatientsForSchedule: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'forschedule'
                }
            },
            checkSchedule: {
                method: 'GET',
                params: {
                    action: 'checkschedule'
                },
                transformResponse: function (data, headers) {
                    var response = {};
                    response.data = data;
                    return response;
                }
            },
            retrieveEnumType: {
                method: 'GET'
            },
            addNotes: {
                method: 'POST',
                params: {
                    subAction: 'note'
                }
            },
            getNotes: {
                method: 'GET',
                isArray: true
            },
            updateNotes: {
                method: 'PUT'
            },
            deleteNotes: {
                method: 'DELETE'
            },
            readNotes: {
                method: 'PUT'
            },
            rejectCareGivers: {
                method: 'PUT'
            },
            rejectedCareGivers: {
                method: 'GET',
                isArray: true
            }
        });
        return {
            retrieveAll: function (data) {
                return api.retrieveAll(data).$promise;
            },
            retrieveForCareType: function (data) {
                return api.retrieveForCareType(data).$promise;
            },
            getPatientsByDistance: function (data) {
                return api.getPatientsByDistance(data).$promise;
            },
            retrieveForSelect: function (filter) {
                return api.retrieveForSelect(filter).$promise;
            },
            updateEmergencyInfo: function (data) {
                return api.updateEmergencyInfo({action: data.id}, data.data).$promise;
            },
            get: function (params) {
                return api.get({action: params.id}).$promise;
            },
            update: function (data) {
                return api.update({action: data.action, changeSchedule: data.changeSchedule}, data.data).$promise;
            },
            delete: function (data) {
                return api.delete({action: 'delete', subAction: data.id}).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status, reason: data.reason, dischargeDate:data.dischargeDate, dischargedTo:data.dischargedTo}).$promise;
            },
            getPatientsForSchedule: function (data) {
                return api.getPatientsForSchedule(data).$promise;
            },
            checkSchedule: function (data) {
                return api.checkSchedule(data).$promise;
            },
            retrieveEnumType: function (data) {
                return api.retrieveEnumType({action:data.type}).$promise;
            },
            addNotes: function (data) {
                return api.addNotes({action: data.userId}, data.note).$promise;
            },
            updateNotes: function (data) {
                return api.updateNotes({action: data.userId, subAction: 'notes', subAction1: data.noteId}, data.note).$promise;
            },
            deleteNotes: function (data) {
                return api.deleteNotes({action: data.userId, subAction: 'notes', subAction1: data.noteId}, {}).$promise;
            },
            getNotes: function (params) {
                params.patientId = params.userId;
                delete params.userId;
                return api.getNotes(params).$promise;
            },
            readNotes: function (params) {
                return api.readNotes({action: params.userId, subAction: 'notes', subAction1: 'read'},{}).$promise;
            },
            rejectCareGivers: function (data) {
                return api.rejectCareGivers({action: data.patientId, subAction: 'caregivers'}, data.employeeIds).$promise;
            },
            rejectedCareGivers: function (data) {
                return api.rejectedCareGivers({action: data.patientId, subAction: 'caregivers'}).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('PatientDAO', ['$resource', PatientDAO]);
})();
