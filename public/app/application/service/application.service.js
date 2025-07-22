(function () {
    'use strict';
    var ApplicationDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'applications/:action/:subAction/:subAction1/:id', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'view'
                }
            },
            retrieveAllPostTitles: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'post-titles'
                }
            },
            delete: {
                method: 'DELETE'
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
            approveApplication: {
                method: 'PUT'
            },
            reviewApplication: {
                method: 'PUT'
            },
            readyForOrientationApplication: {
                method: 'PUT'
            },
            retrieveJobApplicationLink: {
                method: 'GET',
                params: {
                    action: 'default-job-post-link'
                }
            },
        });
        return {
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            retrieveAllPostTitles: function (filter) {
                return api.retrieveAllPostTitles(filter).$promise;
            },
            delete: function (data) {
                return api.delete(data).$promise;
            },
            addNotes: function (data) {
                return api.addNotes({action: data.userId}, data.note).$promise;
            },
            updateNotes: function (data) {
                return api.updateNotes({action: data.userId, subAction: 'notes', subAction1: data.noteId}, data.note).$promise;
            },
            approveApplication: function (data) {
                return api.approveApplication({action: data.applicationId, subAction: 'approve'}, data.additionalDetails).$promise;
            },
            reviewApplication: function (data) {
                return api.reviewApplication({action: data.applicationId, subAction: data.reviewAction}, data.nmiDetails).$promise;
            },
            readyForOrientationApplication: function (data) {
                return api.readyForOrientationApplication({action: data.applicationId, subAction: 'mark-ready-for-orientation'}, data.rfoDetails).$promise;
            },
            deleteNotes: function (data) {
                return api.deleteNotes({action: data.userId, subAction: 'notes', subAction1: data.noteId}, {}).$promise;
            },
            getNotes: function (params) {
                params.applicationId = params.userId;
                delete params.userId;
                return api.getNotes(params).$promise;
            },
            readNotes: function (params) {
                return api.readNotes({action: params.userId, subAction: 'notes', subAction1: 'read'},{}).$promise;
            },
            retrieveJobApplicationLink: function() {
                return api.retrieveJobApplicationLink().$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('ApplicationDAO', ['$resource', ApplicationDAO]);
})();