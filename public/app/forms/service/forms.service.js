(function () {
    'use strict';
    var FormsDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'complaint/:action/:subAction/:subAction1', {}, {
            addComplaint: {
                method: 'POST',
                params: {
                    action: 'new'
                }
            },
            getAllComplaints: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'getAllComplaints'
                }
            },
            setCompResolutionDays: {
                method: 'POST',
                params: {
                    action: 'saveComplaintPolicyResolutionTime',
                }
            },
            getComplaintPolicyResolutionTime: {
                method: 'GET',
                params: {
                    action: 'getComplaintPolicyResolutionTime'
                }
            },
            getComplaintById: {
                method: 'GET',
                params: {
                    action: 'getComplaint'
                }
            },
            updateComplaint: {
                method: 'PUT',
                params: {
                    action: 'updateComplaint'
                }
            },
            deleteComplaint: {
                method: 'DELETE',
                params: {
                    action: 'deleteComplaint'
                }
            },
            getComplaintStatistics: {
                method: 'GET',
                params: {
                    action: 'getComplaintStatistics'
                }
            },
            closeComplaint: {
                method: 'POST',
                params: {
                    action: 'closeComplaint'
                }
            }
        });




        return {
            addComplaint: function (data) {
                return api.addComplaint(data).$promise;
            },
            getAllComplaints: function (data) {
                return api.getAllComplaints(data).$promise;
            },
            setCompResolutionDays: function (data){
                return api.setCompResolutionDays(data).$promise
            },
            getComplaintPolicyResolutionTime: function (){
                return api.getComplaintPolicyResolutionTime().$promise
            },
            getComplaintById: function (id) {
                return api.getComplaintById(id).$promise
            },
            updateComplaint: function (data) {
                return api.updateComplaint({subAction: data.id}, data).$promise
            },
            deleteComplaint: function (id) {
                return api.deleteComplaint(id).$promise
            },
            getComplaintStatistics: function () {
                return api.getComplaintStatistics().$promise
            },
            closeComplaint: function(data) {
                return api.closeComplaint({subAction: data.id}, data).$promise;
            }

        };
    };
    angular.module("xenon.factory").factory('FormsDAO', ['$resource', FormsDAO]);
})();