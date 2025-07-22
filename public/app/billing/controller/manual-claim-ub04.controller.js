(function () {
    function ManualClaimUB04Ctrl($rootScope, $http, $state, $timeout, $filter, InsurerDAO, BillingDAO, PatientDAO, Page) {
        var ctrl = this;
        Page.setTitle("Manual Claim UB04");
        //Constants i.e. we need to fill the form
        ctrl.manualClaimObj = {serviceLines: [{}], billingCreationDate: $filter('date')(new Date(), $rootScope.dateFormat)};
        ctrl.reviewMode = false;
        ctrl.showPatientError = false;
        ctrl.claimId = undefined;

        var loadInsurerLines = function () {
            $rootScope.paginationLoading = true;
            InsurerDAO.get({id: ctrl.manualClaimObj.payorId}).then(function (res) {
                ctrl.insurerObj = res;
                if (ctrl.insurerObj.insuranceCareTypeCollection == null) {
                    ctrl.insurerObj.insuranceCareTypeCollection = [];
                }
                if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        if (serviceLine.serviceDate) {
                            serviceLine.serviceDate = $filter('date')(Date.parse(serviceLine.serviceDate), $rootScope.dateFormat);
                        }

                        serviceLine.selectedServiceCareType = _.find(ctrl.insurerObj.insuranceCareTypeCollection, function (insuranceCareType) {
                            return insuranceCareType.serviceDescription === serviceLine.serviceDescription;
                        })

                    });
                } else {
                    ctrl.manualClaimObj.serviceLines = [{}];
                }


            }).catch(function (data, status) {
                toastr.error("Failed to retrieve Payer.");
            }).then(function () {
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.calculateTotalCharges = function () {
            var totalCharges = 0;
            if (ctrl.manualClaimObj && ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                angular.forEach(ctrl.manualClaimObj.serviceLines, function (item) {
                    if (!isNaN(item.totalCharges)) {
                        totalCharges += parseFloat(item.totalCharges);
                    }
                });
                ctrl.manualClaimObj.totalCharges = $filter('number')(totalCharges, 2).replace(/,/g, "");
            } else {
                if (!ctrl.manualClaimObj)
                    ctrl.manualClaimObj = {};
                ctrl.manualClaimObj.totalCharges = $filter('number')(totalCharges, 2).replace(/,/g, "");
            }
            ctrl.manualClaimObj.amountInDueA = ctrl.manualClaimObj.totalCharges;
        };

        if ($state.params.id && $state.params.id !== '') {
            ctrl.reviewMode = true;
            if ($state.current.name === 'app.manual_claim_ub04_edit') {
                ctrl.editMode = true;
            }
            console.log('=====' + JSON.stringify($state.params))
            Page.setTitle("Claim UB04");
            $rootScope.layoutOptions.sidebar.hideMenu = true;
            var claimUB04 = JSON.parse(localStorage.getItem('claimUB04'));
            if (claimUB04 && claimUB04[$state.params.id]) {
                ctrl.manualClaimObj = claimUB04[$state.params.id];
                ctrl.calculateTotalCharges();
                if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        if (!isNaN(serviceLine.totalCharges))
                            serviceLine.totalCharges = $filter('number')(serviceLine.totalCharges, 2);
                        if (serviceLine.serviceDate)
                            serviceLine.serviceDate = $filter('date')(Date.parse(serviceLine.serviceDate), $rootScope.dateFormat);
                    });
                    ctrl.manualClaimObj.serviceLines.sort(function (a, b) {
                        return Date.parse(a.serviceDate) - Date.parse(b.serviceDate);
                    });
                }
                loadInsurerLines();
            } else {
                $rootScope.maskLoading();
                BillingDAO.getClaimById({paramId: $state.params.id}).then(function (res) {
                    ctrl.billingClaimObj = res;
                    $rootScope.unmaskLoading();
                    ctrl.claimId = res.id;
                    ctrl.isRejected = res.isRejected;
                    ctrl.manualClaimObj = JSON.parse(res.claim1500Data);
                    if (ctrl.editMode === true && ctrl.billingClaimObj.insurerClaimNumber !== null
                            && ctrl.manualClaimObj.documentControlNumberA == null) {
                        ctrl.manualClaimObj.documentControlNumberA = ctrl.billingClaimObj.insurerClaimNumber;
                    }
                    ctrl.calculateTotalCharges();
                    if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                        angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                            if (!isNaN(serviceLine.totalCharges))
                                serviceLine.totalCharges = $filter('number')(serviceLine.totalCharges, 2);
                            if (serviceLine.serviceDate)
                                serviceLine.serviceDate = $filter('date')(Date.parse(serviceLine.serviceDate), $rootScope.dateFormat);
                        });
                        ctrl.manualClaimObj.serviceLines.sort(function (a, b) {
                            return Date.parse(a.serviceDate) - Date.parse(b.serviceDate);
                        });
                    }
                    loadInsurerLines();
                }).catch(function (err) {
                    $rootScope.unmaskLoading();
                    toastr.error("Unable to retrieve claim details");
                    $state.go('app.manual_claim_ub04');
                });
            }
        } else {
            $rootScope.maskLoading();
            PatientDAO.retrieveForSelect({'billingType': 'UB04', 'status': 'all'}).then(function (res) {
                ctrl.patientList = res;
            }).catch(function (data, status) {
//                ctrl.patientList = ontime_data.patients;
            }).then(function () {
                $rootScope.unmaskLoading();
            });
            ctrl.manualClaimObj.serviceLines = [{}];
        }

        ctrl.checkReviewMode = function () {
            if (ctrl.reviewMode && !ctrl.editMode) {
                $("#manual_claim_form :input").prop("disabled", true);
            }
            $("#manual_claim_form :input").css('background-color', '#fff');
        };

        var formatBillingClaim = function (res) {
            if (res && res.claim1500Data) {
                ctrl.patientIdSelected = res.patientId;
                ctrl.billingClaimObj = res;
                ctrl.manualClaimObj = JSON.parse(res.claim1500Data);
                if (ctrl.billingClaimObj.insurerClaimNumber !== null
                        && ctrl.manualClaimObj.documentControlNumberA == null) {
                    ctrl.manualClaimObj.documentControlNumberA = ctrl.billingClaimObj.insurerClaimNumber;
                }
                ctrl.calculateTotalCharges();

                ctrl.manualClaimObj.billingCreationDate = $filter('date')(new Date(), $rootScope.dateFormat);
                loadInsurerLines()
            }
        }

        ctrl.getPatientDetail = function (patientId) {
            $rootScope.paginationLoading = true;
            BillingDAO.getPatientDetails({patientId: patientId, paramId: 'UB04'}).then(function (res) {
                formatBillingClaim(res);
            }).catch(function () {
                toastr.error("Failed to retrieve patient details.");
            }).then(function () {
                $rootScope.paginationLoading = false;
            });
        };

        ctrl.getClaimDataByInsuranceClaimNumber = function (insurerClaimNumber) {
            $rootScope.paginationLoading = true;
            BillingDAO.getClaimByInsuranceClaimNumber({insurerClaimNumber: insurerClaimNumber, paramId: 'UB04'}).then(function (res) {
                delete res.id;
                formatBillingClaim(res);
            }).catch(function (data) {
                if (data.status === 404) {
                    toastr.error("No claim exists by provided Insurance or Billing claim number.");
                } else {
                    toastr.error("Failed to retrieve patients.");
                }
            }).then(function () {
                $rootScope.paginationLoading = false;
            });
        };

        ctrl.updateServiceLine = function (serviceLine) {
            serviceLine.serviceDescription = serviceLine.selectedServiceCareType.serviceDescription;
            serviceLine.revenueCode = serviceLine.selectedServiceCareType.revenueCode;
            serviceLine.CPTCode = serviceLine.selectedServiceCareType.billingCode;
            serviceLine.modifiers = serviceLine.selectedServiceCareType.modifiers;
            if (serviceLine.selectedServiceCareType.unitType === 'unit') {
                serviceLine.unitType = 'UN';
            } else {
                serviceLine.unitType = 'DA';
            }
        };

        ctrl.addServiceLine = function () {
            if (!ctrl.manualClaimObj.serviceLines) {
                ctrl.manualClaimObj.serviceLines = [];
            }
            ctrl.manualClaimObj.serviceLines.push({});
            ctrl.calculateTotalCharges();
        };
        ctrl.removeServiceLine = function (index) {
            if (ctrl.manualClaimObj.serviceLines.length === 1) {
                ctrl.manualClaimObj.serviceLines[0] = {};
            } else {
                ctrl.manualClaimObj.serviceLines.splice(index, 1);
            }
            ctrl.calculateTotalCharges();
        };

        ctrl.formatNumber = function (index, model) {
            ctrl.manualClaimObj.serviceLines[index][model] = $filter('number')(ctrl.manualClaimObj.serviceLines[index][model], 2);
        };

        ctrl.processManualClaim = function () {
            var fromDate, toDate;
            if ($('#manual_claim_form')[0].checkValidity()) {
//                console.log('valid');
                if (!ctrl.manualClaimObj.serviceLines || ctrl.manualClaimObj.serviceLines.length === 0) {
                    toastr.error("Please add atleast one service line.");
                    return;
                }
                $rootScope.maskLoading();
                if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                    ctrl.billingClaimObj.totalServiceLines = ctrl.manualClaimObj.serviceLines.length;
                    ctrl.billingClaimObj.totalCosts = ctrl.manualClaimObj.totalCharges;
                    ctrl.billingClaimObj.paidAmount = ctrl.manualClaimObj.totalCharges - ctrl.manualClaimObj.amountInDueA;
                    ctrl.billingClaimObj.authorizedCodes = [];
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        if (fromDate == null || new Date(serviceLine.serviceDate).getTime() <= new Date(fromDate).getTime()) {
                            fromDate = serviceLine.serviceDate;
                        }
                        if (toDate == null || new Date(serviceLine.serviceDate).getTime() >= new Date(toDate).getTime()) {
                            toDate = serviceLine.serviceDate;
                        }
                        if (ctrl.billingClaimObj.authorizedCodes.indexOf(serviceLine.CPTCode) === -1) {
                            ctrl.billingClaimObj.authorizedCodes.push(serviceLine.CPTCode);
                        }
                    });
                    ctrl.billingClaimObj.authorizedCodes = ctrl.billingClaimObj.authorizedCodes.join(',');
                }
                if (ctrl.editMode != true) {
                    ctrl.manualClaimObj.billingCreationDate = $filter('date')(new Date(), $rootScope.dateFormat);
                }
                $rootScope.removeNullKeys(ctrl.manualClaimObj);
                var claimCopy = angular.copy(ctrl.manualClaimObj);
                ctrl.billingClaimObj.isRejected = false;
                //delete composite care type object
                angular.forEach(claimCopy.serviceLines, function (serviceLine) {
                    delete serviceLine.selectedServiceCareType;
                });
                ctrl.billingClaimObj.claim1500Data = JSON.stringify(claimCopy);
                if (ctrl.editMode === true) {
                    BillingDAO.updateClaim({paramId: ctrl.billingClaimObj.id}, ctrl.billingClaimObj)
                            .then(function (res) {
                                $rootScope.unmaskLoading();
                                toastr.success("Manual claim saved.");
                                $timeout(function () {
                                    window.opener.focus();
                                    window.close();
                                }, 500);
                            })
                            .catch(function () {
                                $rootScope.unmaskLoading();
                                toastr.error("Can not process manual claim.");
                            });
                } else {
                    BillingDAO.processManualClaim({patientId: ctrl.patientIdSelected, processedOn: $filter('date')(new Date(), $rootScope.dateFormat), fromDate: fromDate, toDate: toDate}, ctrl.billingClaimObj)
                            .then(function (res) {
                                $rootScope.unmaskLoading();
                                toastr.success("Manual claim processed.");
                                window.location.href = $rootScope.serverPath + 'billing/session/' + res.id + '/edi/download';
                                ctrl.manualClaimObj = {serviceLines: [{}], billingCreationDate: $filter('date')(new Date(), $rootScope.dateFormat)};
                                ctrl.insurerObj = undefined;
                                $('input,textarea,select').filter('[required]:visible').removeClass('danger-input');
                                $("#sboxit-1").select2("val", null);
                            })
                            .catch(function () {
                                $rootScope.unmaskLoading();
                                toastr.error("Can not process manual claim.");
                            });
                }
            } else {
//                console.log('invalid');
                $('input,textarea,select').filter('[required]:visible').addClass('danger-input');
                $('input,textarea,select').filter('.ng-invalid:first').focus();
            }
        };

//        ctrl.openLookup = function (type, elemId) {
//            var url, title;
//            if (type === 'location') {
//                localStorage.setItem('locationLookup', elemId);
//                url = $state.href('app.location_lookup');
//                title = "LocationLookup";
//            }
//            if (type === 'resubmission') {
//                url = $state.href('app.resubmission_lookup');
//                title = "ResubmissionLookup";
//            }
//            var params = [
//                'height=' + screen.height / 1.5,
//                'width=' + screen.width / 1.5,
//                'location=0'
//            ].join(',');
//            var newwindow = window.open(url, title, params);
//            if (window.focus) {
//                newwindow.moveTo(50, 50);
//                newwindow.focus();
//            }
//        };

        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.payorList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        ctrl.printPdf = function () {
            window.location.href = ontime_data.weburl + 'billing/download/claim/' + $state.params.id;
        }

    }
    angular.module('xenon.controllers').controller('ManualClaimUB04Ctrl', ["$rootScope", "$http", "$state", "$timeout", "$filter", "InsurerDAO", "BillingDAO", "PatientDAO", "Page", ManualClaimUB04Ctrl]);
})();
