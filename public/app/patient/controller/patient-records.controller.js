(function () {
    function PatientRecordsCtrl(
        $state,
        PatientDAO,
        PatientRecordDAO,
        Page,
        $rootScope,
        $timeout,
        $modal,
        $stateParams,
        $http
    ) {
        var ctrl = this;
        ctrl.patientList = [];
        ctrl.search = { pageSize: 10, pageNumber: 1, name: '' };
        ctrl.search.title = $state.current.data && $state.current.data.title ? $state.current.data.title : null;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.patientRecordOrigin = ontime_data.patientRecordOrigin;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.patientId = $stateParams.patientId;
        ctrl.navigateToTab = navigateToTab;
        ctrl.getRecordTitle = getRecordTitle;
        ctrl.patientRecordsType = angular.copy(ontime_data.patientRecordsObj)
        ctrl.patientRecordsRoutes = angular.copy(ontime_data.patientRecordsRoutes);


        function navigateToTab() {
            $state.go('app.patient_records_patient', { patientId: ctrl.search.patientId });
        }

        function getRecordTitle(type) {
            const record = ctrl.patientRecordsType.find(function (rec) {
                return rec.value == type;
            });

            return record ? record.option : '';
        };


        PatientDAO.retrieveForSelect({ 'status': 'all' }).then(function (res) {
            ctrl.patientList = res;
            if ($state.params.patientId && $state.params.patientId !== '') {
                ctrl.search.patientId = parseInt($state.params.patientId);
                $timeout(function () {
                    $("#sboxit-2").select2({
                        placeholder: 'Select Patient...',
                    }).on('select2-open', function () {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                }, 300);
            }
        }).catch(function () {
            toastr.error("Failed to retrieve patient list.");
        });

        getPatientsRecord();

        ctrl.openPatientAddRecord = function () {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('patient', 'patient-record-add'),
                size: "md",
                backdrop: false,
                keyboard: false,
                controller: 'PatientRecordAddCtrl as PatientRecordAddCtrl',
                resolve: {
                }
            });
            modalInstance.id = ctrl.patient.id;
        };

        ctrl.goToEditForm = function (record, action) {
            if (record.type in ctrl.patientRecordsRoutes) {
                var params = {
                    patientId: record.patientId,
                    recordType: record.type,
                    id: record.id
                };

                $state.go(ctrl.patientRecordsRoutes[record.type], params);
            }
        };

        ctrl.openDeleteModal = function (record, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteRecordModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            record.recordName = getRecordTitle(record.type);
            record.patientName = ctrl.patientList.find(patient => patient.id == record.patientId).label;
            $rootScope.deleteRecordModel.record = record;

            $rootScope.deleteRecordModel.delete = function (record) {
                $rootScope.maskLoading();
                PatientRecordDAO.delete({patientId: record.patientId, id: record.id})
                .then(function (res) {
                    toastr.success("Record deleted successfully");
                    getPatientsRecord();
                }).catch(function (err) {
                    toastr.error("Failed to delete the patient record");
                }).finally(function () {
                    $rootScope.unmaskLoading();
                    $rootScope.deleteRecordModel.close();
                })
            };
        };

        ctrl.pageChanged = function (pagenumber) {
            ctrl.search.pageNumber = pagenumber;
            getPatientsRecord();
        };

        ctrl.printForm = function (record) {
            if (record.isDraft || record.isDraft == null) {
                return toastr.info("Document is in draft state and cannot be viewed or downloaded");
            }
            if (record.type === 'Pdf_Record') {
                $rootScope.maskLoading();
                PatientRecordDAO.getById(record.patientId, record.id).then((res)=>{
                    var data = JSON.parse(res.responses);
                    var downloadBtn = document.createElement('a');
                    downloadBtn.href = `${ctrl.baseUrl}file/download/${ctrl.companyCode}/p/${data.file}`;
                    downloadBtn.click();
                    downloadBtn.remove();
                    toastr.success('Record downloaded successfully')
                }).catch((err) => {
                    toastr.error('File not downloaded. Please try again');
                }).then(()=>{
                    $rootScope.unmaskLoading();
                })
            } else {
                $rootScope.maskLoading();
                var path = $rootScope.serverPath + 'patients/' + record.patientId + '/records/' + record.id + '/download?company_code=' + ontime_data.company_code;

                var filename = record.type + ".pdf";
                $http
                    .get(path, { responseType: "arraybuffer" })
                    .then(function (response) {
                        var blob = new Blob([response.data], { type: "application/pdf" });
                        var url = URL.createObjectURL(blob);
                        var a = document.createElement("a");
                        a.href = url;
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(url);
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
            }

        }

        ctrl.openPdf = function (record) {
            if (record.isDraft || record.isDraft == null) {
                return toastr.info("Document is in draft state and cannot be viewed or downloaded");
            }
            if (record.type === 'Pdf_Record') {
                $rootScope.maskLoading();
                PatientRecordDAO.getById(record.patientId, record.id).then((res)=>{
                    var data = JSON.parse(res.responses);
                    var fileUrl = `${ctrl.baseUrl}file/download/${ctrl.companyCode}/p/${data.file}?viewDownload=true`;
                    window.open(fileUrl, '_blank');                  
                }).catch((err) => {
                    toastr.error('File not downloaded. Please try again');
                }).then(()=>{
                    $rootScope.unmaskLoading();
                })
            } else {
                var path = $rootScope.serverPath + 'patients/' + record.patientId + '/records/' + record.id + '/download?company_code=' + ontime_data.company_code + '&viewDownload=true';           
                window.open(path, '_blank');
            }

        }

        function getPatientsRecord() {
            if ($state.params.patientId && $state.params.patientId !== '') {
                if (isNaN(parseFloat($state.params.patientId))) {
                    $state.transitionTo(ontime_data.defaultState);
                }
                $rootScope.maskLoading();
                PatientDAO.get({ id: $state.params.patientId }).then(function (res) {
                    ctrl.patient = res;
                    ctrl.search.title = `<strong>Patient Name: </strong>${ctrl.patient.lName}, ${ctrl.patient.fName}, ${ctrl.patient.middleInitial} &nbsp;&nbsp;<strong>DOB: </strong>${ctrl.patient.dateOfBirth} &nbsp;&nbsp;<strong>MRN: </strong> ${ctrl.patient.mrnNumber}`;
                    Page.setTitle(`Patient Record - ${ctrl.patient.lName}, ${ctrl.patient.fName}`);

                    PatientRecordDAO.retrieveAll({ 'patientId': ctrl.patient.id, pageNumber: ctrl.search.pageNumber, pageSize: ctrl.search.pageSize }).then(function (res) {
                        ctrl.patientRecords = res;
                    }).catch(function (data, status) {
                        showLoadingBar({
                            delay: .5,
                            pct: 100,
                            finish: function () {
                            }
                        }); // showLoadingBar
                        toastr.error("Failed to retrieve patient");
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }).catch(function (data, status) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    toastr.error("Failed to retrieve patient");
                    $rootScope.unmaskLoading();
                });
                ctrl.listPage = true;
            } else {
                ctrl.listPage = false;
            }
        }

    }
    angular.module('xenon.controllers').controller('PatientRecordsCtrl', [
        "$state",
        "PatientDAO",
        "PatientRecordDAO",
        "Page",
        "$rootScope",
        "$timeout",
        "$modal",
        "$stateParams",
        "$http",
        PatientRecordsCtrl
    ]);
})();
