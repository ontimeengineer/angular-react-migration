angular
        .module('mwl.calendar')
        .directive('mwlCalendarMonth', function () {

            var controller = ["$scope", "moment", "calendarHelper", "calendarConfig", "$rootScope", "$filter", function ($scope, moment, calendarHelper, calendarConfig, $rootScope, $filter) {

                    $scope.calendarConfig = calendarConfig;
                    $scope.openRowIndex = null;

                    $scope.$on('calendar.refreshView', function () {

                        $scope.weekDays = calendarHelper.getWeekDayNames();
                        $scope.view = calendarHelper.getMonthView($scope.events, $scope.currentDay, $scope.typeId, $scope.type);
                        var rows = Math.floor($scope.view.length / 7);
                        $scope.monthOffsets = [];
                        for (var i = 0; i < rows; i++) {
                            $scope.monthOffsets.push(i * 7);
                        }

                    });
                    $scope.eventClickCalled = false;
                    $scope.onEventClick = function (calendarEvent, eventCell, dayClickedFirstRun, $event) {
                        $scope.eventClickCalled = true;
                        $rootScope.openModalCalendar1(angular.copy(eventCell), 'calendar-modal', 'lg', 'static');
                    };
                    $scope.dayClicked = function (date) {
                        if ($rootScope.currentUser.allowedFeature.indexOf('ADD_SCHEDULE') === -1) {
                            return;
                        }
                        if (!$scope.eventClickCalled) {
                            var eventCell;
                            var day = new Date(date.date);
                            var day1 = moment(day);
                            var diff = moment().diff(day1, 'days');
                            if (diff <= 0) {
                                eventCell = {startDate: day};
                            } else {
                                eventCell = {startDate: day, askPassword: true};
                            }
                            if (eventCell) {
                                $scope.eventClickCallback(angular.copy(eventCell));
//                                $rootScope.openModalCalendar1(angular.copy(eventCell), 'calendar-modal', 'lg', 'static');
                            }
                        } else {
                            $scope.eventClickCalled = false;
                        }
                    };

                    $scope.toggleEvent = function (e) {
                        $scope.eventClickCalled = true;
                        $(e.currentTarget).next().popover('show');
                        $(e.currentTarget).popover({
                            content: $(e.currentTarget).next().contents(),
                            html: true
                        });
                    };
                    $scope.getToolTipToDisplay = function (eventObj) {
                        if (eventObj.worksiteSchedule) {
                            return "<div>Name:" + eventObj.workSite.name
                                    + "<br> Phone Number:" + $filter("tel")(eventObj.workSite.phone)
                                    + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime)
                                    + "<br> Supervisor: " + eventObj.coordinatorName
                                    + "<br> Address: " + eventObj.workSite.address1 + (eventObj.workSite.address2 != null ? "<br>" + eventObj.workSite.address2 : '') + "<br>" + eventObj.workSite.city + ', ' + eventObj.workSite.state + '- ' + eventObj.workSite.zipcode;
                        } else {
                            if ($scope.type == 'patient') {
                                return "<div>Name:" + eventObj.employee.lName + "," + eventObj.employee.fName
                                        + "<br> Phone Number:" + $filter("tel")(eventObj.employee.phone)
                                        + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime)
                                        + "<br> Address: " + eventObj.employee.address1 + (eventObj.employee.address2 != null ? "<br>" + eventObj.employee.address2 : '') + "<br>" + eventObj.employee.city + ', ' + eventObj.employee.state + '- ' + eventObj.employee.zipcode;
                            } else if ($scope.type == 'coordinator') {
                                return "<div><b>Patient Details</b>"
                                        + "<br> Name:" + eventObj.patient.lName + "," + eventObj.patient.fName
                                        + "<br> Phone Number:" + $filter("tel")(eventObj.patient.phone)
                                        + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime)
                                        + "<br> Coordinator: " + eventObj.coordinatorName
                                        + "<br> Address: " + eventObj.patient.patientAddress.address1
                                        + "<br>" + eventObj.patient.patientAddress.city + ', ' + eventObj.patient.patientAddress.state + '- ' + eventObj.patient.patientAddress.zipcode;
                            } else {
                                return "<div>Name:" + eventObj.patient.lName + "," + eventObj.patient.fName
                                        + "<br> Phone Number:" + $filter("tel")(eventObj.patient.phone)
                                        + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime)
                                        + "<br> Coordinator: " + eventObj.coordinatorName
                                        + "<br> Address: " + eventObj.patient.patientAddress.address1
                                        + "<br>" + eventObj.patient.patientAddress.city + ', ' + eventObj.patient.patientAddress.state + '- ' + eventObj.patient.patientAddress.zipcode;
                            }
                        }
                    };
                }];

            return {
                templateUrl: "templates/calendarMonthView.html",
                restrict: 'EA',
                require: '^mwlCalendar',
                scope: {
                    events: '=',
                    currentDay: '=',
                    onEventClick: '=',
                    cellTemplateUrl: '@',
                    cellEventsTemplateUrl: '@',
                    typeId: '=',
                    type: '=',
                    showTime: '=',
                    eventClickCallback: '='
                },
                controller: controller
            };

        });