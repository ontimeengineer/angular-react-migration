(function () {
    function ViewDocumentsCtrl(DocumentDao, $rootScope, $stateParams, $state, $modal, Page, $debounce, $timeout, $formService, PositionDAO) {
        var ctrl = this;

        function initialize() {
            //$rootScope.maskLoading();
            Page.setTitle("Document Library");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.companyDocuments = [];
            ctrl.positions = [];
            ctrl.test = '';

            ctrl.retrieveDocuments = retrieveDocuments;
            ctrl.addEditPopup = ctrl.openEditDocumentModal;
            ctrl.deleteDocumentModal = deleteDocumentModal;
            ctrl.retrieveDocuments();
        }

        function retrieveDocuments() {
            DocumentDao.retrieveAll({}).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.companyDocuments = res;
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve documents.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        ctrl.openEditDocumentModal = function (document, mode) {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('documentlibrary', 'add_document'),
                controller: 'AddDocumentController as documentModel',
                resolve: {
                    document: function () {
                        return document;
                    }
                }
            });
            modalInstance.result.then(function (success) {
                if (success) {
                    ctrl.retrieveDocuments();
                }
                console.log("popup closed");
            });
        };

        function deleteDocumentModal(document)
        {
            $rootScope.documentDeleteModal = $modal.open({
                templateUrl: 'documentDeleteModal',
                size: 'md',
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.documentDeleteModal.document = document;

            $rootScope.documentDeleteModal.confirm = function (document) {
                DocumentDao.delete({id: document.id}).then(function (res) {
                    toastr.success("Care Type deleted.");
                    ctrl.retrieveDocuments();
                }).catch(function (data, status) {
                    toastr.error("Care Type cannot be deleted.");
                }).then(function () {
                    $rootScope.documentDeleteModal.close();
                    $rootScope.unmaskLoading();
                });
            };

            $rootScope.documentDeleteModal.dismiss = function () {
                $rootScope.documentDeleteModal.close();
            }

        }

        initialize();
    }
    ;

    angular.module('xenon.controllers').controller('ViewDocumentsCtrl', ["DocumentDao", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "$timeout", "$formService", "PositionDAO", ViewDocumentsCtrl]);
})();