(function () {
    'use strict';
    var ApplicationPublicDAO = function (resource) {
        var api = resource(ontime_data.weburl + 'public/applications/:action/:subAction/:id/:companyCode', {}, {
            retrieveByApplicationId: {
                method: 'GET'
            },
            saveApplication: {
                method: "POST"
            },
            verifyExistingApplication: {
                method: "POST",
                params: {
                    action: "verify"
                }
            },
            startApplication: {
                method: "POST",
                params: {
                    action: "start",
                    appPath: window.location.toString()
                }
            },
            resendApplicationDetails: {
                method: "POST",
                params: {
                    action: "resend",
                    appPath: window.location.toString()
                }
            },
            retrieveApplication: {
                method: "POST",
                params: {
                    action: "retrieve"
                }
            },
            updateApplication: {
                method: 'PUT'
            },
            updateApplicationEducation: {
                method: 'PUT',
                params: {
                    subAction: "educations"
                }
            },
            deleteApplicationEducation: {
                method: 'DELETE',
                params: {
                    subAction: "educations"
                }
            },
            updateApplicationWorkExperience: {
                method: 'PUT',
                params: {
                    subAction: "work-experiences"
                }
            },
            deleteApplicationWorkExperience: {
                method: 'DELETE',
                params: {
                    subAction: "work-experiences"
                }
            },
            updateApplicationProfessionalReference: {
                method: 'PUT',
                params: {
                    subAction: "professional-references"
                }
            },
            deleteApplicationProfessionalReference: {
                method: 'DELETE',
                params: {
                    subAction: "professional-references"
                }
            },
            submitApplication: {
                method: 'PUT'
            }
        });
        return {
            saveApplication: function (data) {
                return api.saveApplication(data).$promise;
            },
            verifyExistingApplication: function (data) {
                return api.verifyExistingApplication(data).$promise;
            },
            startApplication: function (data) {
                return api.startApplication(data).$promise;
            },
            resendApplicationDetails: function (data) {
                return api.resendApplicationDetails(data).$promise;
            },
            retrieveApplication: function (data) {
                return api.retrieveApplication(data).$promise;
            },
            retrieveByApplicationId: function (data) {
                return api.retrieveByApplicationId(data).$promise;
            },
            updateApplication: function (data) {
                return api.updateApplication({action: data.applicationId}, data).$promise;
            },
            updateApplicationEducation: function (data) {
                return api.updateApplicationEducation({action: data.applicationId}, data.data).$promise;
            },
            deleteApplicationEducation: function (data) {
                return api.deleteApplicationEducation({action: data.applicationId, id: data.educationId}, {}).$promise;
            },
            updateApplicationWorkExperience: function (data) {
                return api.updateApplicationWorkExperience({action: data.applicationId}, data.data).$promise;
            },
            deleteApplicationWorkExperience: function (data) {
                return api.deleteApplicationWorkExperience({action: data.applicationId, id: data.workExperienceId}, {}).$promise;
            },
            updateApplicationProfessionalReference: function (data) {
                return api.updateApplicationProfessionalReference({action: data.applicationId}, data.data).$promise;
            },
            deleteApplicationProfessionalReference: function (data) {
                return api.deleteApplicationProfessionalReference({action: data.applicationId, id: data.referenceId}, {}).$promise;
            },
            submitApplication: function (data) {
                return api.submitApplication({action: data.applicationId, subAction: 'submit'}, data.data).$promise;
            }
        };
    };
    angular.module("xenon.factory").factory('ApplicationPublicDAO', ['$resource', ApplicationPublicDAO]);
})();