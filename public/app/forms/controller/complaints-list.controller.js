(function () {
    function ComplaintsController($state, $rootScope, $stateParams, $modal, FormsDAO, $debounce,$sce, Page) {
        'use strict';
        Page.setTitle("Complaints")
        var ctrl = this;
        $rootScope.maskLoading();
        ctrl.searchParams = { pageSize: 10, pageNumber: 1, name: '' };
        ctrl.complaintType = $stateParams.status;
        ctrl.complaintsList = [];
        ctrl.pageInitCall = pageInit;
        ctrl.getComplaintsCall = getComplaints;
        ctrl.remainingDaysToCloseCall = remainingDaysToClose
        ctrl.getComplaintCloseDaysCall = getComplaintCloseDays
        ctrl.getTitleByValue = getTitleByValue;
        ctrl.currentDate = new Date();
        // ctrl.complaintTypes = angular.copy(ontime_data.complaintTypes)


        ctrl.pageInitCall()

        ctrl.openViewModal = function (complaint, modal_id, modal_size, modal_backdrop) {
            $rootScope.maskLoading();
            FormsDAO.getComplaintById({ id: complaint?.id }).then(function (complaintData) {
                
                var modalInstance = $modal.open({
                    templateUrl: appHelper.viewTemplatePath('common', 'complaint-info'),
                    size: modal_size ,
                    backdrop: typeof modal_backdrop === 'undefined' ? true : modal_backdrop,
                    keyboard: false,
                    controller: 'ComplaintInfoCtrl as ComplaintInfo',
                    resolve: {
                        complaint: function () {
                            return complaintData;
                        }
                    }
                });
                modalInstance.result.then(function () {
                    console.log("popup closed");
                });
            }).catch(function (error) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                    
                }); 
                $rootScope.unmaskLoading();// showLoadingBar
            }).then(()=>{
                $rootScope.unmaskLoading();
            });
        };
        
        function getTitleByValue (value, objectName) {
            const dataObject = angular.copy(ontime_data[objectName]);
            const foundItem = dataObject.find(function (item) {
                return item.value == value;
            });

            return foundItem !== undefined ? foundItem.title : value; 
        }

        ctrl.setComplaint = function(complaint){
            localStorage.setItem('complaint', JSON.stringify(complaint));
        }

        ctrl.navigateToComplaintDetails = function(complaint) {
            // Manually update the URL with the 'print' parameter
            $state.go('app.add-complaint', { id: complaint.id, print: true });
        };

        function remainingDaysToClose (proposedDate) {
            const dateInsertedObj = new Date();
            const proposedDateObj = new Date(proposedDate);
        
            const timeDiff = proposedDateObj - dateInsertedObj;
            const daysRemaining = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
        
            if (daysRemaining < 0) {
                return `<span style="color: #cc3f44">Overdue ${-1 * daysRemaining}</span>`;
            } else {
                return daysRemaining >= 0 ? `${daysRemaining + 1}` : '';
            }
        }

        function getComplaintCloseDays() {
            FormsDAO.getComplaintPolicyResolutionTime().then(res => {
                ctrl.complaintResDays = res.policyResolutionTime;
            }).catch(err => {
                debugger
                toastr.error(err.data)
            })
        }

        function pageInit() {
            ctrl.getComplaintCloseDaysCall()
            ctrl.getComplaintsCall()
        }

        ctrl.getRemainingDaysForClosing = function (complaint) {
            return ctrl.remainingDaysToCloseCall(complaint.dateProposedResolution);
        }

        ctrl.applySearch = function () {
            ctrl.searchParams.pageNo = 1;
            $debounce(getComplaints, 500);
        };

        function getComplaints() {
            $rootScope.paginationLoading = true;
            if(ctrl.complaintType == 'open'){
                ctrl.searchParams.isFollowUpNeeded = true;
            }else if(ctrl.complaintType == 'close'){
                ctrl.searchParams.isFollowUpNeeded = false;
            }

            FormsDAO.getAllComplaints(ctrl.searchParams).then((res) => {
                $rootScope.maskLoading();
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {}
                }); // showLoadingBar

                if (res) {
                    ctrl.complaintsList = res;
                    if(ctrl.searchParams.isFollowUpNeeded == true)
                    var complaintsMenu = $rootScope.getSidebarMenuItems().getItemByTitle('Complaints');
                    if (complaintsMenu) { // Check if complaintsMenu is defined
                        if ($rootScope.totalRecords > 0) {
                            complaintsMenu.setLabel($rootScope.totalRecords, 'secondary');
                        } else {
                            complaintsMenu.removeLabel();
                        }
                    } else {
                        console.error("complaintsMenu is undefined");
                    }
                    $rootScope.unmaskLoading();
                }
            }).catch(function (err) {
                toastr.error(err.data);
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {}
                }); // showLoadingBar
                $rootScope.unmaskLoading();
            }).then(function () {
                $rootScope.paginationLoading = false;
                $rootScope.unmaskLoading();
            });
        }

        ctrl.pageChanged = function (pagenumber) {
            ctrl.searchParams.pageNumber = pagenumber;
            getComplaints();
        };

        ctrl.sanitizeHtml = function (htmlContent) {
            return $sce.trustAsHtml(htmlContent)
        };
        
        ctrl.openDeleteModal = function (complaint, modal_id, modal_size, modal_backdrop)
        {
            $rootScope.deleteComplaintModel = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            $rootScope.deleteComplaintModel.complaint = complaint;

            $rootScope.deleteComplaintModel.delete = function (complaint) {
                $rootScope.maskLoading();
                FormsDAO.deleteComplaint({id: complaint.id}).then(function (res) {
                    const characterArray = Object.values(res).filter(value => typeof value === 'string');
                    toastr.success(Object.values(characterArray))
                    $rootScope.deleteComplaintModel.close();
                    getComplaints();
                }).catch(function (err) {
                    toastr.error(err.data);
                    $rootScope.deleteComplaintModel.close();
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };
        };

    }
    angular.module('xenon.controllers').controller('ComplaintsController', ["$state", "$rootScope", "$stateParams", "$modal", "FormsDAO", "$debounce","$sce", "Page", ComplaintsController]);
})();
