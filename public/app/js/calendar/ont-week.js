angular
        .module('mwl.calendar')
        .directive('mwlCalendarWeek', function () {

            var controller = ["$scope", "$sce", "moment", "calendarHelper", "calendarConfig", "$rootScope", "$filter", function ($scope, $sce, moment, calendarHelper, calendarConfig, $rootScope, $filter) {
                    $scope.$sce = $sce;

                    $scope.$on('calendar.refreshView', function () {
                        $scope.view = calendarHelper.getWeekView($scope.events, $scope.currentDay, $scope.list, $scope.type);
                    });

                    $scope.eventClickCalled = false;
                    $scope.onEventClick = function (eventCell, object, onClickDate) {
                        if (!eventCell) {
                            if($rootScope.currentUser.allowedFeature.indexOf('ADD_SCHEDULE') === -1){
                                return;
                            }
                            if (!$scope.eventClickCalled) {                                
                                var day = new Date(onClickDate.date);
                                var day1 = moment(day);
                                var diff = moment().diff(day1, 'days');
                                if (diff <= 0) {
                                    eventCell = {data: object, startDate: day};
                                } else {
                                    eventCell = {data: object, startDate: day, askPassword: true};
                                }
                            } else {
                                $scope.eventClickCalled = false;
                            }
                        } else {
                            $scope.eventClickCalled = true;
                        }
                        if (eventCell) {
                            $scope.eventClickCallback(angular.copy(eventCell));
//                            $rootScope.openModalCalendar1(angular.copy(eventCell), 'calendar-modal', 'lg', 'static');
                        }
                    };

                    $scope.onLinkClick = function (obj) {
                        $rootScope.navigateToMonthPage(angular.copy(obj));
                    };
                    $scope.onViewInfoClick = function (obj) {
                        $rootScope.openEditModal(angular.copy(obj), 'modal-5');
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
                                    + "<br> Supervisor: "+eventObj.coordinatorName
                                    + "<br> Address: " + eventObj.workSite.address1 + (eventObj.workSite.address2 != null ? "<br>" + eventObj.workSite.address2 : '') + "<br>" + eventObj.workSite.city + ', ' + eventObj.workSite.state + '- ' + eventObj.workSite.zipcode;
                        } else {
                            if ($scope.type == 'patient') {
                                return "<div>Name:" + eventObj.employee.lName + "," + eventObj.employee.fName 
                                        + "<br> Phone Number:" + $filter("tel")(eventObj.employee.phone) 
                                        + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime) 
                                        + "<br> Address: " + eventObj.employee.address1 + (eventObj.employee.address2 != null ? "<br>" + eventObj.employee.address2 : '') + "<br>" + eventObj.employee.city + ', ' + eventObj.employee.state + '- ' + eventObj.employee.zipcode;
                            } else {
                                return "<div>Name:" + eventObj.patient.lName + "," + eventObj.patient.fName 
                                        + "<br> Phone Number:" + $filter("tel")(eventObj.patient.phone) 
                                        + "<br> Schedule Time:" + $filter("ampm")(eventObj.startTime) + " - " + $filter("ampm")(eventObj.endTime) 
                                        + "<br> Coordinator: "+eventObj.coordinatorName
                                        + "<br> Address: " + eventObj.patient.patientAddress.address1 
                                        + "<br>" + eventObj.patient.patientAddress.city + ', ' + eventObj.patient.patientAddress.state + '- ' + eventObj.patient.patientAddress.zipcode;
                            }
                        }
                    };
                }];
            return {
                templateUrl: 'templates/calendarWeekView.html',
                restrict: 'EA',
                require: '^mwlCalendar',
                scope: {
                    events: '=',
                    currentDay: '=',
                    onEventClick: '=',
                    onLinkClick: '=',
                    list: '=',
                    type: '=',
                    showTime: '=',
                    eventClickCallback: '='
                },
                controller: controller
            };

        });
