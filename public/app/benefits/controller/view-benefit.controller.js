/* global ontime_data */

(function () {
    function ViewBenefitsCtrl($rootScope, $modal, Page, BenefitDAO) {
        var ctrl = this;
        $rootScope.maskLoading();
        Page.setTitle("View Benefits");
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;

        ctrl.retrieveBenefitList = retrieveBenefitList;

        function retrieveBenefitList() {
            $rootScope.paginationLoading = true;
            BenefitDAO.retrieveAll({subAction:"all"}).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                        if (res) {
                        }
                    }
                }); // showLoadingBar
                ctrl.benefitList = res;
            }).catch(function (data, status) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                toastr.error("Failed to retrieve Benefits.");
            }).then(function () {
                $rootScope.unmaskLoading();
                $rootScope.paginationLoading = false;
            });
        }

        ctrl.retrieveBenefitList();

        ctrl.openStatusModal = function (benefit, status)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'confirmation_modal'),
                controller: 'ConfirmModalController as confirmModal',
                size: 'md',
                resolve: {
                    message: function () {
                        return "Are you sure you want to " + (status === "a" ? "activate" : "deactivate") + " this Benefit?";
                    },
                    title: function () {
                        return benefit.packageName;
                    },
                    subtitle: function () {
                        return;
                    }
                }
            });
            modalInstance.result.then(function (res) {
                $rootScope.maskLoading();
                BenefitDAO.changestatus({id: benefit.id, status: status === "a" ? "activate" : "deactivate"}).then(function () {
                    var length = ctrl.benefitList.length;
                    for (var i = 0; i < length; i++) {
                        if (ctrl.benefitList[i].id === benefit.id) {
                            ctrl.benefitList[i].status = status;
                            break;
                        }
                    }
                    toastr.success("Benefit " + (status === "active" ? "activated." : "deactivated."));
//                    ctrl.rerenderDataTable();
                }).catch(function (data, status) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }, function () {
            });
        }

    }
    ;
    angular.module('xenon.controllers').controller('ViewBenefitsCtrl', ["$rootScope", "$modal", "Page", "BenefitDAO", ViewBenefitsCtrl]);
})();