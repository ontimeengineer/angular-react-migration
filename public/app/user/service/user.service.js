(function () {
    'use strict';
    var UserDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'admin/user/:action/:subAction/:subAction1', {}, {
            retrieveAll: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'view'
                }
            },
            //this method will be used for user save or update based on the action passed
            update: {
                method: 'POST',
                params: {
                    withoutEmployee: '@withoutEmployee',
                    appPath: window.location.toString()
                }
            },
            delete: {
                method: 'GET'
            },
            changestatus: {
                method: 'GET'
            },
            getAllRoles: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'allroles'
                }
            },
            changePassword: {
                method: 'POST',
                params: {
                    action: "changepassword",
                    oldPassword: "@oldPassword"
                }
            },
            resetUserPassword: {
                method: 'POST',
                params: {
                    action: "resetpassword",
                    userName: "@userName",
                    passwordType: "@passwordType",
                    appPath: window.location.toString()
                }
            },
            getUserFeatures: {
                method: 'GET',
                isArray: true,
                params: {
                    action: 'userfeatures'
                }
            }

        });
        var fileApi = resource(ontime_data.weburl + 'file/presign', {}, {
            getProfileImage: {
                method: 'GET',
                params: {
                    fileName: 'profileImage',
                    fileType: 'type'
                }
            }
        });
        return {
            downloadProfilePic: function (filter) {
                return fileApi.getProfileImage(filter).$promise;
            },
            retrieveAll: function (filter) {
                return api.retrieveAll(filter).$promise;
            },
            update: function (data) {
                return api.update({action: data.action}, data.data).$promise;
            },
            delete: function (data) {
                return api.delete({action: 'delete', subAction: data.id}).$promise;
            },
            changestatus: function (data) {
                return api.changestatus({action: 'changestatus', subAction: data.id, status: data.status, employeeStatus: data.employeeStatus}).$promise;
            },
            get: function (params) {
                return api.get({action: params.id}).$promise;
            },
            getAllRoles: function () {
                return api.getAllRoles().$promise;
            },
            changePassword: function (data) {
                return api.changePassword(data).$promise;
            },
            resetUserPassword: function (data) {
                return api.resetUserPassword(null, data).$promise;
            },
            getUserFeatures: function (data) {
                return api.getUserFeatures(data).$promise;
            }

        };
    };
    angular.module("xenon.factory").factory('UserDAO', ['$resource', UserDAO]);
})();
