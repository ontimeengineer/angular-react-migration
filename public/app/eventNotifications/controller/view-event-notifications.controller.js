/* global ontime_data, _ */

(function () {
    function EventNotificationsCtrl(EventNotificationsDAO, $rootScope, $modal, $timeout, Page) {
        var ctrl = this;

        function initialize() {
            $rootScope.maskLoading();
            Page.setTitle("Event Notifications");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.eventList = [];

            ctrl.retrieveEvents = retrieveEventsData;
            ctrl.setEmails = setEmails;
            ctrl.retrieveEvents();
        }

        function validateEmail(email) {
            var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(email);
        }


        function retrieveEventsData() {

            EventNotificationsDAO.retrieve().then(function (events) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.eventList = angular.copy(events);
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve events.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving events');
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function setEmails(event) {            
            $rootScope.eventModel = $modal.open({
                templateUrl: 'eventModel',
                size: "lg",
                backdrop: true,
                keyboard: false
            });
            $rootScope.eventModel.event = angular.copy(event);
            $timeout(function () {
                $('#Emails').tagsinput("add", $rootScope.eventModel.event.emails);
            });
            $rootScope.eventModel.closePopup = function () {
                $rootScope.eventModel.close();
            };

            $rootScope.eventModel.save = function () {
                console.log("$rootScope.eventModel.event",$rootScope.eventModel.event);
                if ($rootScope.eventModel.event_form.$valid && $rootScope.eventModel.event.emails) {                    
                    var invalidEmails = [];
                    _.each($rootScope.eventModel.event.emails.split(','), function(email){
                        if(!validateEmail(email))
                            invalidEmails.push(email);
                    });
                    if(invalidEmails.length > 0){
                        toastr.error(invalidEmails.toString() + " not valid email id(s).");
                    } else {
                        $rootScope.maskLoading();
                        EventNotificationsDAO.update($rootScope.eventModel.event).then(function (events) {
                            toastr.success("Event Notifications updated.");
                            event.emails = $rootScope.eventModel.event.emails;
                        }).catch(function (data, status) {
                            toastr.error("Error Updating Event Notifications.");
                        }).then(function () {
                            $rootScope.unmaskLoading();
                            $rootScope.eventModel.closePopup();
                        });
                    }
                } else{
                    toastr.warning("Please fill email ids.");
                }
            };
            setTimeout(function () {
                cbr_replace();
            }, 100);
        }

        

        initialize();
    }
    ;

    angular.module('xenon.controllers').controller('EventNotificationsCtrl', ["EventNotificationsDAO", "$rootScope", "$modal", "$timeout", "Page", EventNotificationsCtrl]);
})();