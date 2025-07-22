(function () {
    'use strict';
    var EventTypeDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'events/:action/:subAction/:subAction1', {}, {
            retrieveEventType: {
                method: 'GET',
                isArray: false
            },
            saveEventType: {
                method: 'POST'
            },
            updateEventType: {
                method: 'PUT'
            },
            retrieveBySchedule: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'all'
                }
            },
            retrieveSchedules: {
                method: 'GET',
                params: {
                    action: 'schedule'
                },
                transformResponse: function (data, headers) {
                    var response = {};
                    response.data = data;
                    response.headers = headers();
                    return response;
                }
            },
            delete: {
                method: 'DELETE'
            }
        });
        return {
            retrieveEventType: function (data) {
                return api.retrieveEventType(data).$promise;
            },
            saveEventType: function (data) {
                return api.saveEventType({action: data.action}, data.data).$promise;
            },
            updateEventType: function (data) {
                return api.updateEventType({action: data.action, subAction: data.subAction, isPast: data.isPast}, data.data).$promise;
            },
            retrieveBySchedule: function (data) {
                return api.retrieveBySchedule(data).$promise;
            },
            retrieveSchedules: function (data) {
                return api.retrieveSchedules(data).$promise;
            },
            delete: function (data) {
                return api.delete(data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('EventTypeDAO', ['$resource', EventTypeDAO]);
})();