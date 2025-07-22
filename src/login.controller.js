/* global ontime_data */

import { ontime_data } from "./common/ontime_data";
import { setCookie } from "./common/utils";

const $ = window.$;
const appData = {};

function loginCtrlr($scope, $rootScope, $http, $state, Page, UtilService) {
    $rootScope.stopIdle();
    $scope.username = "";
    $scope.password = "";
    $scope.ordCode = "";
    //    setCookie("changePassword", false, 7);
    $scope.submitHandler = function () {
        if ($("form#login").valid()) {
            // showLoadingBar(70); // Fill progress bar to 70% (just a given value)

            var opts = {
                "closeButton": true,
                "debug": false,
                "positionClass": "toast-top-full-width",
                "onclick": null,
                "showDuration": "300",
                "hideDuration": "1000",
                "timeOut": "5000",
                "extendedTimeOut": "1000",
                "showEasing": "swing",
                "hideEasing": "linear",
                "showMethod": "fadeIn",
                "hideMethod": "fadeOut"
            };
            $rootScope.maskLoading();
            $http({
                url: ontime_data.weburl + "login",
                method: 'POST',
                data: {
                    do_login: true,
                    username: $scope.username,
                    password: $scope.password,
                    orgCode: $scope.orgCode,
                },
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                transformRequest: function (data) {
                    return $.param(data); // jquery util
                }
            }).success(function (data, status, headers, config) {
                // showLoadingBar({
                //     delay: .5,
                //     pct: 100,
                //     finish: function () {
                        if (data.status == 's') {
                            appData.authResult = data;
                            if (appData.authResult != null) {
                                if (appData.authResult.token != null) {
                                    setCookie("token", appData.authResult.token, 7);
                                }
                                if (appData.authResult.changePassword != null) {
                                    setCookie("changePassword", appData.authResult.changePassword, 7);
                                }
                                if (appData.authResult.cc != null) {
                                    setCookie("cc", appData.authResult.cc, 7);
                                }
                                if (appData.authResult.company_country != null) {
                                    setCookie("company_country", appData.authResult.company_country, 7);
                                    $rootScope.states = ontime_data.statesByCountry[appData.authResult.company_country];
                                    $rootScope.terminologyBank = ontime_data.terminologyBank[appData.authResult.company_country];
                                }
                                if (appData.authResult.un != null) {
                                    setCookie("un", appData.authResult.un, 7);
                                    $rootScope.currentUser = { userName: appData.authResult.un };
                                }
                                if (appData.authResult) {
                                    setCookie("pos", appData.authResult.pos, 7);
                                    setCookie("fl", `${appData.authResult.firstName} ${appData.authResult.lastName}`, 7);
                                }
                                if (appData.authResult.allowedFeature != null) {
                                    $rootScope.currentUser.allowedFeature = appData.authResult.allowedFeature.split(",");
                                }
                                if (appData.authResult.firstName != null) {
                                    setCookie("fn", appData.authResult.firstName);
                                    $rootScope.currentUser.firstName = appData.authResult.firstName
                                }
                                if (appData.authResult.lastName != null) {
                                    setCookie("ln", appData.authResult.lastName);
                                    $rootScope.currentUser.lastName = appData.authResult.lastName
                                }
                            }
                            //                            window.location.hash = '#/app/dashboard';
                            $state.transitionTo(ontime_data.homepage);
                            Page.setTitle("Welcome");
                            $rootScope.startIdle();
                            $rootScope.unmaskLoading();
                            // window.location.hash = '#/app/add_patient_tab_1';
                        } else {
                            $rootScope.unmaskLoading();
                        }
                    // }
                // });
                Page.setTitle("Welcome");

                // Remove any alert
                $(".errors-container .alert").slideUp('fast');

                // Show errors
                if (data.status != 's') {
                    $(".errors-container").html('<div class="alert alert-danger">\
					<button type="button" class="close" data-dismiss="alert">\
						<span aria-hidden="true">&times;</span>\
						<span class="sr-only">Close</span>\
					</button>\
					' + data.msg + '\
				</div>');


                    $(".errors-container .alert").hide().slideDown();
                    //$(form).find('#password').select();
                    $("form#login")[0].reset();
                }
            }).error(function (data, status, headers, config) {
                alert("Error");
                // window.location.hash = '#/app/dashboard-variant-1';
            }); // end of http post
        } // end o form valid
    }; // end of submitHandler
} // end of controller

loginCtrlr.$inject = ['$scope', '$rootScope', '$http', '$state', 'Page', 'UtilService'];

export default loginCtrlr;
