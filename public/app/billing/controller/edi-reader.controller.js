/* global ontime_data, _, appHelper, parseFloat */

(function () {
    function EdiReaderCtrl(Page, InsurerDAO, BillingDAO, $rootScope, $modal) {
        var ctrl = this;
        ctrl.ediUploadData = {};
        Page.setTitle("EDI reader");
        ctrl.datatableObj = {};
        ctrl.limit = 10;
        ctrl.ediData = [];
        ctrl.viewRecords = 10;
        var defaultSearchParams = {limit: 10, pageNo: 1, sortBy: 'id', order: 'desc'};
        ctrl.searchParams = angular.copy(defaultSearchParams);
        ctrl.criteriaSelected = false;
        ctrl.errorMsg = {};
        ctrl.insuranceProviderList = [];
        ctrl.insuranceProviderMap = {};
        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.insuranceProviderList = res;
            angular.forEach(res, function (insuranceProvier) {
                ctrl.insuranceProviderMap[insuranceProvier.id] = insuranceProvier.insuranceName;
            });
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        ctrl.reviewClaims = function (billingSessionId) {
            $state.go('app.billing_batch', {id: billingSessionId});
        };
        ctrl.pageChanged = function (pagenumber) {
            ctrl.searchParams.pageNo = pagenumber;
            ctrl.retrieveEdiDatas();
        };
        ctrl.resetFilters = function () {
            ctrl.ediData = [];
            ctrl.criteriaSelected = false;
            ctrl.searchParams = angular.copy(defaultSearchParams);
            $("#insuranceProviderId").select2("val", null);
        };
        ctrl.filterEdiDatas = function () {
            ctrl.errorMsg = {};
            ctrl.searchParams.pageNo = 1;
            if (ctrl.searchParams.insuranceProviderId != null || ctrl.searchParams.ediDataSequenceId != null || ctrl.searchParams.fileName != null) {
                ctrl.criteriaSelected = true;
                ctrl.retrieveEdiDatas();
            }
        };
        ctrl.retrieveEdiDatas = function () {
            if (ctrl.criteriaSelected) {
                $rootScope.paginationLoading = true;
                $rootScope.maskLoading();
                ctrl.dataRetrieved = false;
                BillingDAO.searchEdiData(ctrl.searchParams).then(function (res) {
                    ctrl.dataRetrieved = true;
                    ctrl.ediData = res;
                }).catch(function (e) {
                    if (e.data != null) {
                        toastr.error(e.data);
                    } else {
                        toastr.error("EDI data cannot be retrieved.");
                    }
                }).then(function () {
                    $rootScope.paginationLoading = false;
                    $rootScope.unmaskLoading();
                });
            }
        };

        ctrl.resetUploadData = function () {
            ctrl.ediUploadData = {};
            $("#insuranceProviderId1").select2("val", null);
        }

        ctrl.saveEdiUploadData = function () {
            if (ctrl.ediUploadData.insuranceProviderId == null) {
                ctrl.fileObj.errorMsg = "Please select Payer and then try again.";
            } else if (ctrl.ediUploadData.fileName == null) {
                ctrl.fileObj.errorMsg = "Please upload a text/835 file.";
            } else {
                BillingDAO.saveEdiSequence({sequenceId: ctrl.ediUploadData.sequenceId}).then(function () {
                    ctrl.resetUploadData();
                    toastr.success("EDI batch is created, search proposed reconciliation and start creating billing reconciliation.");
                }).catch(function () {
                    toastr.error("Error in saving EDI batch.");
                });
            }
        }

        function uploadPopup() {
            $rootScope.uploadEDIModel = $modal.open({
                templateUrl: 'uploadEDIModel'
            });

            $rootScope.uploadEDIModel.ediUploadData = {};
            $rootScope.uploadEDIModel.insuranceProviderList = angular.copy(ctrl.insuranceProviderList);

            setTimeout(function () {
                $("#insuranceProviderId1").select2({
                    placeholder: 'Select Payer...',
                }).on('select2-open', function ()
                {
                    // Adding Custom Scrollbar
                    $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                });
            }, 100);

            $rootScope.uploadEDIModel.fileObj = {};

            // for file upload
            $rootScope.uploadEDIModel.uploadFile = {
                target: ontime_data.weburl + 'billing/edi/upload',
                chunkSize: 1024 * 1024 * 1024,
                testChunks: false,
                fileParameterName: "fileUpload",
                singleFile: true,
                headers: {
                    company_code: ontime_data.company_code,
                    requestToken: getCookie('taken'),
                    userName: getCookie('un')
                }
            };
            //When file is selected from browser file picker
            $rootScope.uploadEDIModel.fileSelected = function (file, flow) {
                $rootScope.uploadEDIModel.fileObj.flowObj = flow;
                $rootScope.uploadEDIModel.fileObj.flowObj.upload();
            };
            //When file is uploaded this method will be called.
            $rootScope.uploadEDIModel.fileUploaded = function (response, file, flow) {
                $rootScope.uploadEDIModel.ediUploadData.fileName = file.name;
                $rootScope.uploadEDIModel.ediUploadData.sequenceId = response;
                $rootScope.uploadEDIModel.fileObj.flowObj.cancel();
            };
            $rootScope.uploadEDIModel.fileError = function ($file, $message, $flow) {
                $flow.cancel();
                delete $rootScope.uploadEDIModel.ediUploadData.fileName;
                delete $rootScope.uploadEDIModel.ediUploadData.sequenceId;
                $rootScope.uploadEDIModel.fileObj.errorMsg = "File cannot be uploaded";
            };
            //When file is added in file upload
            $rootScope.uploadEDIModel.fileAdded = function (file, flow) { //It will allow all types of attachments'
                if ($rootScope.uploadEDIModel.ediUploadData.insuranceProviderId == null) {
                    $rootScope.uploadEDIModel.fileObj.errorMsg = "Please select Payer and then try again.";
                    return false;
                }
                if (file.getExtension() !== 'edi' && file.getExtension() !== 'txt' && file.getExtension() !== '835') {
                    $rootScope.uploadEDIModel.fileObj.errorMsg = "Please upload a valid text file.";
                    return false;
                }
                $rootScope.uploadEDIModel.uploadFile.headers.insuranceProviderId = $rootScope.uploadEDIModel.ediUploadData.insuranceProviderId;
                delete $rootScope.uploadEDIModel.ediUploadData.sequenceId;
                $rootScope.uploadEDIModel.showfileProgress = true;
                delete $rootScope.uploadEDIModel.fileObj.errorMsg;
                $rootScope.uploadEDIModel.fileObj.flow = flow;
                $rootScope.uploadEDIModel.ediUploadData.fileName = file.name;
                return true;
            };


            $rootScope.uploadEDIModel.closePopup = function () {
                $rootScope.uploadEDIModel.close();
            }

            $rootScope.uploadEDIModel.saveEDIData = function () {
                if ($rootScope.uploadEDIModel.uploadEDIForm.$valid) {
                    BillingDAO.saveEdiSequence({sequenceId: $rootScope.uploadEDIModel.ediUploadData.sequenceId}).then(function () {
                        toastr.success("EDI batch is created, search proposed reconciliation and start creating billing reconciliation.");
                        $rootScope.uploadEDIModel.close();
                    }).catch(function () {
                        toastr.error("Error in saving EDI batch.");
                    });
                }
            }
        }

        ctrl.uploadPopup = uploadPopup;

        function deletePopup() {
            $rootScope.deleteEDIModel = $modal.open({
                templateUrl: 'deleteEDIModel'
            });

            setTimeout(function () {
                cbr_replace();
            }, 100);

            $rootScope.deleteEDIModel.deleteData = {};

            $rootScope.deleteEDIModel.closePopup = function () {
                $rootScope.deleteEDIModel.close();
            };

            $rootScope.deleteEDIModel.deleteEDIData = function () {
                if ($rootScope.deleteEDIModel.deleteEDIForm.$valid) {
                    $rootScope.maskLoading();
                    BillingDAO.deleteEdi($rootScope.deleteEDIModel.deleteData).then(function () {
                        toastr.success("EDI data batch deleted.");
                        $rootScope.deleteEDIModel.close();
                    }).catch(function (data) {
                        if (data.status === 400) {
                            toastr.error(data.data);
                        } else {
                            toastr.error("Someting went wrong on server")
                        }
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }
            };
        }

        ctrl.deletePopup = deletePopup;

    }
    angular.module('xenon.controllers')
            .controller('EdiReaderCtrl', ["Page", "InsurerDAO", "BillingDAO", "$rootScope", "$modal", EdiReaderCtrl])
})();
