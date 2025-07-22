(function () {
    function ManualClaimCtrl($rootScope, $http, $state, $timeout, $filter, InsurerDAO, BillingDAO, PatientDAO, Page) {
        var ctrl = this;
        Page.setTitle("Manual Claim");
        //Constants i.e. we need to fill the form
        ctrl.manualClaimObj = {};
        ctrl.reviewMode = false;
        ctrl.showPatientError = false;
        ctrl.claimId = undefined;
        ctrl.parseModifiers = function (serviceLineObj) {
            if (serviceLineObj.seviceProcedureModifiers != null) {
                serviceLineObj.seviceProcedureModifiers = JSON.parse(serviceLineObj.seviceProcedureModifiers);
            }
        }
        ctrl.stringifyModifiers = function (serviceLineObj) {
            if (serviceLineObj.seviceProcedureModifiers != null) {
                serviceLineObj.seviceProcedureModifiers = JSON.stringify(serviceLineObj.seviceProcedureModifiers);
            }
        }


        ctrl.unbindPatientCondition = function () {
            if (ctrl.manualClaimObj.patientConditionRelated) {
                if (ctrl.manualClaimObj.patientConditionRelated === 'EM') {
                    ctrl.manualClaimObj.patientConditionRelatedEM = 'true';
                    ctrl.manualClaimObj.patientConditionRelatedAA = 'false';
                    ctrl.manualClaimObj.patientConditionRelatedOA = 'false';
                } else if (ctrl.manualClaimObj.patientConditionRelated === 'OA') {
                    ctrl.manualClaimObj.patientConditionRelatedOA = 'true';
                    ctrl.manualClaimObj.patientConditionRelatedEM = 'false';
                    ctrl.manualClaimObj.patientConditionRelatedAA = 'false';
                } else if (ctrl.manualClaimObj.patientConditionRelated.indexOf('AA:') > -1) {
                    ctrl.manualClaimObj.patientConditionRelatedAA = 'true';
                    ctrl.manualClaimObj.patientConditionRelatedEM = 'false';
                    ctrl.manualClaimObj.patientConditionRelatedOA = 'false';
                    ctrl.manualClaimObj.patientConditionRelatedAAState = ctrl.manualClaimObj.patientConditionRelated.split(':')[1];
                }
            } else {
                ctrl.manualClaimObj.patientConditionRelatedEM = 'false';
                ctrl.manualClaimObj.patientConditionRelatedAA = 'false';
                ctrl.manualClaimObj.patientConditionRelatedOA = 'false';
            }
        };

        ctrl.bindPatientCondition = function (type) {
            switch (type) {
                case 'EM':
                    if (ctrl.manualClaimObj.patientConditionRelatedEM === 'true') {
                        if (ctrl.manualClaimObj.patientConditionRelatedAA === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedAA = 'false';
                        if (ctrl.manualClaimObj.patientConditionRelatedOA === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedOA = 'false';
                        ctrl.manualClaimObj.patientConditionRelated = 'EM';
                    } else {
                        ctrl.manualClaimObj.patientConditionRelated = null;
                    }
                    break;
                case 'AA':
                    if (ctrl.manualClaimObj.patientConditionRelatedAA === 'true') {
                        if (ctrl.manualClaimObj.patientConditionRelatedEM === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedEM = 'false';
                        if (ctrl.manualClaimObj.patientConditionRelatedOA === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedOA = 'false';
                        ctrl.manualClaimObj.patientConditionRelated = 'AA' + ctrl.manualClaimObj.patientConditionRelatedAAState ? ':' + ctrl.manualClaimObj.patientConditionRelatedAAState : '';
                    } else {
                        ctrl.manualClaimObj.patientConditionRelated = null;
                    }
                    break;
                case 'OA':
                    if (ctrl.manualClaimObj.patientConditionRelatedOA === 'true') {
                        if (ctrl.manualClaimObj.patientConditionRelatedEM === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedEM = 'false';
                        if (ctrl.manualClaimObj.patientConditionRelatedAA === 'true')
                            ctrl.manualClaimObj.patientConditionRelatedAA = 'false';
                        ctrl.manualClaimObj.patientConditionRelated = 'OA';
                    } else {
                        ctrl.manualClaimObj.patientConditionRelated = null;
                    }
                    break;
                case 'STATE':
                    ctrl.manualClaimObj.patientConditionRelated = 'AA:' + ctrl.manualClaimObj.patientConditionRelatedAAState;
            }
        };

        ctrl.calculateTotalCharges = function () {
            var totalCharges = 0;
            if (ctrl.manualClaimObj && ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                angular.forEach(ctrl.manualClaimObj.serviceLines, function (item) {
                    if (!isNaN(item.serviceTotalBill)) {
                        totalCharges += parseFloat(item.serviceTotalBill);
                    }
                });
                ctrl.manualClaimObj.totalCharges = $filter('number')(totalCharges, 2).replace(/,/g, "");
            } else {
                if (!ctrl.manualClaimObj)
                    ctrl.manualClaimObj = {};
                ctrl.manualClaimObj.totalCharges = $filter('number')(totalCharges, 2).replace(/,/g, "");
            }
        };
        if ($state.params.id && $state.params.id !== '') {
            ctrl.reviewMode = true;
            if ($state.current.name === 'app.manual_claim_edit') {
                ctrl.editMode = true;
            }
            Page.setTitle("Claim 1500");
            $rootScope.layoutOptions.sidebar.hideMenu = true;
            var claim1500 = JSON.parse(localStorage.getItem('claim1500'));
            if (claim1500 && claim1500[$state.params.id]) {
                ctrl.manualClaimObj = claim1500[$state.params.id];
                ctrl.calculateTotalCharges();
                ctrl.unbindPatientCondition();
                if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        ctrl.parseModifiers(serviceLine);
                        if (serviceLine.serviceFromDate)
                            serviceLine.serviceFromDate = $filter('date')(Date.parse(serviceLine.serviceFromDate), $rootScope.dateFormat);
                        if (serviceLine.serviceToDate)
                            serviceLine.serviceToDate = $filter('date')(Date.parse(serviceLine.serviceToDate), $rootScope.dateFormat);
                    });
                    ctrl.manualClaimObj.serviceLines.sort(function (a, b) {
                        return Date.parse(a.serviceFromDate) - Date.parse(b.serviceFromDate);
                    });
                }
            } else {
                $rootScope.maskLoading();
                BillingDAO.getClaimById({paramId: $state.params.id}).then(function (res) {
                    $rootScope.unmaskLoading();
                    ctrl.billingClaimObj = res;
                    ctrl.claimId = res.id;
                    ctrl.isRejected = res.isRejected;
                    ctrl.manualClaimObj = JSON.parse(res.claim1500Data);
                    if (ctrl.editMode === true && ctrl.billingClaimObj.insurerClaimNumber !== null
                            && ctrl.manualClaimObj.originalRefNumber == null) {
                        ctrl.manualClaimObj.originalRefNumber = ctrl.billingClaimObj.insurerClaimNumber;
                    }
                    ctrl.calculateTotalCharges();
                    ctrl.unbindPatientCondition();
                    if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                        angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                            ctrl.parseModifiers(serviceLine);
                            if (serviceLine.serviceFromDate)
                                serviceLine.serviceFromDate = $filter('date')(Date.parse(serviceLine.serviceFromDate), $rootScope.dateFormat);
                            if (serviceLine.serviceToDate)
                                serviceLine.serviceToDate = $filter('date')(Date.parse(serviceLine.serviceToDate), $rootScope.dateFormat);
                        });
                        ctrl.manualClaimObj.serviceLines.sort(function (a, b) {
                            return Date.parse(a.serviceFromDate) - Date.parse(b.serviceFromDate);
                        });
                    }
                }).catch(function (err) {
                    $rootScope.unmaskLoading();
                    toastr.error("Unable to retrieve claim details");
                    $state.go('app.manual_claim');
                });
            }
        } else {
            $rootScope.maskLoading();
            PatientDAO.retrieveForSelect({'billingType': '1500', 'status': 'all'}).then(function (res) {
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
                        && ctrl.manualClaimObj.originalRefNumber == null) {
                    ctrl.manualClaimObj.originalRefNumber = ctrl.billingClaimObj.insurerClaimNumber;
                }
                ctrl.calculateTotalCharges();
//                    console.log(JSON.stringify(ctrl.billingClaimObj));
                ctrl.unbindPatientCondition();
                if (ctrl.manualClaimObj.serviceLines && ctrl.manualClaimObj.serviceLines.length > 0) {
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        ctrl.parseModifiers(serviceLine);
                        if (serviceLine.serviceFromDate)
                            serviceLine.serviceFromDate = $filter('date')(Date.parse(serviceLine.serviceFromDate), $rootScope.dateFormat);
                        if (serviceLine.serviceToDate)
                            serviceLine.serviceToDate = $filter('date')(Date.parse(serviceLine.serviceToDate), $rootScope.dateFormat);
                    });
                }
            }
        }

        ctrl.getPatientDetail = function (patientId) {
            $rootScope.paginationLoading = true;
            BillingDAO.getPatientDetails({patientId: patientId, paramId: '1500'}).then(function (res) {
                formatBillingClaim(res);
            }).catch(function () {
                toastr.error("Failed to retrieve patients.");
            }).then(function () {
                $rootScope.paginationLoading = false;
            });
        };

        ctrl.getClaimDataByInsuranceClaimNumber = function (insurerClaimNumber) {
            $rootScope.paginationLoading = true;
            BillingDAO.getClaimByInsuranceClaimNumber({insurerClaimNumber: insurerClaimNumber, paramId: '1500'}).then(function (res) {
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

        ctrl.addServiceLine = function () {
            if (!ctrl.manualClaimObj.serviceLines) {
                ctrl.manualClaimObj.serviceLines = [];
            }
            ctrl.manualClaimObj.serviceLines.push({'serviceNPI': ctrl.manualClaimObj.companyNPI});
        };
        ctrl.removeServiceLine = function (index) {
            ctrl.manualClaimObj.serviceLines.splice(index, 1);
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
                    ctrl.billingClaimObj.paidAmount = ctrl.manualClaimObj.amountPaid ? ctrl.manualClaimObj.amountPaid : 0;
                    ctrl.billingClaimObj.authorizedCodes = [];
                    angular.forEach(ctrl.manualClaimObj.serviceLines, function (serviceLine) {
                        if (fromDate == null || new Date(serviceLine.serviceFromDate).getTime() <= new Date(fromDate).getTime()) {
                            fromDate = serviceLine.serviceFromDate;
                        }
                        if (toDate == null || new Date(serviceLine.serviceToDate).getTime() >= new Date(toDate).getTime()) {
                            toDate = serviceLine.serviceToDate;
                        }
                        if (ctrl.billingClaimObj.authorizedCodes.indexOf(serviceLine.serviceProcedureCode) === -1) {
                            ctrl.billingClaimObj.authorizedCodes.push(serviceLine.serviceProcedureCode);
                        }
                        ctrl.stringifyModifiers(serviceLine);
                    });
                    ctrl.billingClaimObj.authorizedCodes = ctrl.billingClaimObj.authorizedCodes.join(',');
                }
                $rootScope.removeNullKeys(ctrl.manualClaimObj);
                ctrl.billingClaimObj.claim1500Data = JSON.stringify(ctrl.manualClaimObj);
                ctrl.billingClaimObj.isRejected = false;
                if (ctrl.editMode === true) {
                    BillingDAO.updateClaim({paramId: ctrl.billingClaimObj.id}, ctrl.billingClaimObj)
                            .then(function (res) {
                                $rootScope.unmaskLoading();
                                toastr.success("Manual claim saved.");
                                $timeout(function () {
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
                                ctrl.manualClaimObj = {};
                                ctrl.manualClaimObj.serviceLines = [{}];
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

        ctrl.openLookup = function (type, elemId) {
            var url, title;
            if (type === 'location') {
                localStorage.setItem('locationLookup', elemId);
                url = $state.href('app.location_lookup');
                title = "LocationLookup";
            }
            if (type === 'resubmission') {
                url = $state.href('app.resubmission_lookup');
                title = "ResubmissionLookup";
            }
            var params = [
                'height=' + screen.height / 1.5,
                'width=' + screen.width / 1.5,
                'location=0'
            ].join(',');
            var newwindow = window.open(url, title, params);
            if (window.focus) {
                newwindow.moveTo(50, 50);
                newwindow.focus();
            }
        };

        InsurerDAO.retrieveAll().then(function (res) {
            ctrl.payorList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });

    }
    ;
    angular.module('xenon.controllers').controller('ManualClaimCtrl', ["$rootScope", "$http", "$state", "$timeout", "$filter", "InsurerDAO", "BillingDAO", "PatientDAO", "Page", ManualClaimCtrl]);
})();
