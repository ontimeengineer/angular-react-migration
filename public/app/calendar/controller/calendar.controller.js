/* global moment, ontime_data, _, parseFloat */

(function () {
    function CalendarCtrl(Page, EmployeeDAO, $rootScope, PositionDAO, $debounce, PatientDAO, EventTypeDAO, CareTypeDAO, $modal, $filter, $timeout, $state, $stateParams, DispatchDAO, WorksiteDAO, $scope, $formService) {
        var ctrl = this;
        ctrl.pageNo = 1;
        ctrl.retrieveAllPatients = function () {
            PatientDAO.retrieveAll({subAction: 'active', sortBy: 'lName', order: 'asc'}).then(function (res) {
                ctrl.patientList = res;
            });
        };
        ctrl.retrieveWorkSites = function () {
            WorksiteDAO.retreveWorksiteNames({sortBy: 'name', order: 'asc'}).then(function (res) {
                ctrl.workSiteList = res;
                if (res != null && res.length > 0) {
                    ctrl.searchParams.workSiteId = res[0].id;
                    $timeout(function () {
                        $("#worksiteDropdown").select2("val", res[0].id);
                    }, 100);
                    ctrl.retrieveEmployees();
                    ctrl.retrieveAllEmployees();
                    if ($rootScope.employeePopup != null) {
                        $rootScope.employeePopup.workSiteList = ctrl.workSiteList;
                        setWorkSiteData();
                    }
                }
            });
        };
        if ($state.current.name.indexOf('search-employee-calendar') >= 0) {
            Page.setTitle("Search Employee");
            ctrl.isEmployeeSearchPage = true;
        } else if ($state.current.name.indexOf('worksite-schedule') >= 0) {
            Page.setTitle("Worksite Calendar");
            ctrl.isWorksiteSchedulePage = true;
            ctrl.retrieveWorkSites();
        } else {
            Page.setTitle("Employee Calendar");
            ctrl.isWorksiteSchedulePage = false;
            ctrl.isEmployeeSearchPage = false;
        }
        ctrl.employee_list = [];
        $rootScope.selectEmployeeModel = {};
        ctrl.viewEmployee;
        ctrl.forShowTime = true;

        var timeFormat = 'HH:mm';


        ctrl.calendarView = 'week';
        setWeekDate();

        if ($stateParams.id != '') {
            ctrl.calendarView = 'month';
            setMonthDate();
        }

        ctrl.isOpen = false;
        ctrl.calendarDay = new Date();

        ctrl.changeToMonth = function () {
            ctrl.calendarView = 'month';
            setMonthDate();
            $rootScope.refreshCalendarView();
        }

        ctrl.showDatepicker = function (e) {
            if (e.currentTarget.className == "btn btn-default btn-sm btn-date") {
                if (ctrl.isOpen) {
                    ctrl.isOpen = false;
                } else {
                    ctrl.isOpen = true;
                }
            } else {
                ctrl.isOpen = false;
            }
        };

        ctrl.selectDate = function (e) {
//            ctrl.showDatepicker(e);
            setTimeout(function () {
                var a = $filter('date')($rootScope.weekStart, $rootScope.dateFormat);
                var b = $filter('date')($rootScope.weekEnd, $rootScope.dateFormat);
                if (a != ctrl.startRetrieved || b != ctrl.endRetrieved) {
                    ctrl.showDatepicker(e);
                    $rootScope.refreshCalendarView();
                }
            }, 200);
        };

        ctrl.changeToWeek = function () {
            ctrl.calendarView = 'week';
            setWeekDate();
            $rootScope.refreshCalendarView();
        }

        ctrl.searchParams = {skip: 0, limit: 10};
        if (ctrl.isEmployeeSearchPage) {
            ctrl.searchParams.distance = ontime_data.defaultDistance;
        }
        ctrl.pageChanged = function (pagenumber) {
            ctrl.pageNo = pagenumber;
            ctrl.retrieveEmployees();
        };

        ctrl.applySearch = function () {
            ctrl.pageNo = 1;
            $rootScope.paginationLoading = true;
            $debounce(ctrl.retrieveEmployees, 500);
        };

        ctrl.resetFilters = function () {
            var workSiteId;
            if (ctrl.isWorksiteSchedulePage && ctrl.searchParams.workSiteId != null) {
                workSiteId = ctrl.searchParams.workSiteId;
            }
            ctrl.searchParams = {limit: 10, skip: 0};
            if (workSiteId != null) {
                ctrl.searchParams.workSiteId = workSiteId;
                $("#worksiteDropdown").select2("val", workSiteId);
            }
            if (ctrl.isEmployeeSearchPage) {
                ctrl.searchParams.distance = ontime_data.defaultDistance;
            }
            ctrl.searchParams.availableStartDate = null;
            ctrl.searchParams.availableStartDate = null;
            $('#employeeIds').select2('val', null);
            $('#patientIdsForCompatibility').select2('val', null);
            $('#positions').select2('val', null);
            $('#languages').select2('val', null);
//            $('#worksiteDropdown').select2('val', null);
            $('#patientDropdown').select2('val', null);
            ctrl.applySearch();
        };

        $rootScope.refreshCalendarView = function () {
            $rootScope.paginationLoading = true;
            ctrl.retrieveEmployees();
            ctrl.retrieveAllEmployees();
        };
        ctrl.distanceChanged = function () {
            if (ctrl.searchParams.distance == null || ctrl.searchParams.distance.trim() == '') {
                ctrl.searchParams.distance = ontime_data.defaultDistance;
            }
        };

        ctrl.prepareSearchCriteria = function () {
            if (ctrl.pageNo > 1) {
                ctrl.searchParams.skip = (ctrl.pageNo - 1) * ctrl.searchParams.limit;
            } else {
                ctrl.searchParams.skip = 0;
            }
            var searchParams = angular.copy(ctrl.searchParams);
            if (searchParams.employeeIds != null) {
                searchParams.employeeIds = searchParams.employeeIds.toString();
            }
            if (searchParams.patientIdsForCompatibility != null) {
                searchParams.patientIdsForCompatibility = searchParams.patientIdsForCompatibility.toString();
            }
            if (searchParams.positionIds != null) {
                searchParams.positionIds = searchParams.positionIds.toString();
            }
            if (searchParams.languages != null) {
                searchParams.languages = searchParams.languages.toString();
            }
            if (searchParams.drives != null && !searchParams.drives) {
                delete searchParams.drives;
            }
            if (searchParams.newHires != null && !searchParams.newHires) {
                delete searchParams.newHires;
            }
            if (searchParams.includeInactive != null && !searchParams.includeInactive) {
                delete searchParams.includeInactive;
            }
            if (searchParams.scheduledOnly != null && searchParams.scheduledOnly) {
                searchParams.scheduleStartDate = $filter('date')($rootScope.weekStart, $rootScope.dateFormat);
                searchParams.scheduleEndDate = $filter('date')($rootScope.weekEnd, $rootScope.dateFormat);
            }
            return searchParams;
        }

        var preparePatientByDistanceSearchParams = function (searchParams) {
            var patientSearchParams = {};
            if (searchParams.longitude != null) {
                patientSearchParams['longitude'] = searchParams.longitude;
            }
            if (searchParams.latitude != null) {
                patientSearchParams['latitude'] = searchParams.latitude;
            }
            if (searchParams.patientId != null) {
                patientSearchParams['patientId'] = searchParams.patientId;
            }
            if (searchParams.distance != null) {
                patientSearchParams['distance'] = searchParams.distance;
            }
            return patientSearchParams;
        }

        ctrl.retrieveEmployees = function () {
            var searchParams = ctrl.prepareSearchCriteria();
            EmployeeDAO.getEmployeesForSchedule(searchParams).then(function (res) {
                ctrl.employee_list = res;
                if (ctrl.isEmployeeSearchPage) {
                    var patientSearchParams = preparePatientByDistanceSearchParams(searchParams);
                    PatientDAO.getPatientsByDistance(patientSearchParams).then(function (res) {
                        ctrl.patientsByDistance = res;
                        addMarkersToMap(ctrl.employee_list, res);
                    }).catch(function (data, status) {
                        ctrl.patientsByDistance = [];
                        addMarkersToMap(ctrl.employee_list, []);
                    });
                }
                if (!ctrl.viewEmployee) {
                    ctrl.viewEmployee = res[0];
                }
                var obj;
                if ($stateParams.id != '') {
                    angular.forEach(res, function (item) {
                        if (item.id == $stateParams.id) {
                            obj = angular.copy(item);
                        }
                    });
                    if (!obj) {
                        EmployeeDAO.getEmployeesForSchedule({employeeIds: $stateParams.id}).then(function (res1) {
                            ctrl.viewEmployee = angular.copy(res1[0]);
                            ctrl.employeeId = ctrl.viewEmployee.id;
                        });
                    } else {
                        ctrl.viewEmployee = angular.copy(obj);
                    }
                }
                if (ctrl.viewEmployee) {
                    ctrl.employeeId = ctrl.viewEmployee.id;
                }
                delete res.$promise;
                delete res.$resolved;
                /* Fetch all Employee id's to get related events */
                var ids = (_.map(ctrl.employee_list, 'id')).toString();
                if (ctrl.calendarView == 'month') {
                    ids = ctrl.employeeId;
                    if ($stateParams.id != '' && !obj) {
                        ids = $stateParams.id;
                    }
                }
                ctrl.getAllEvents(ids);
                ctrl.totalRecords = $rootScope.totalRecords;
            }).catch(function (data, status) {
                console.log("error--------", data, status);
            });
        };

        ctrl.loadEvents = function () {
            ctrl.pageNo = 0;
            ctrl.searchParams.limit = 10;
            ctrl.retrieveEmployees();
        };

        ctrl.getAllEvents = function (ids) {
            if (ids != null && ids != '') {
                var a = $filter('date')($rootScope.weekStart, $rootScope.dateFormat);
                var b = $filter('date')($rootScope.weekEnd, $rootScope.dateFormat);
                ctrl.startRetrieved = a;
                ctrl.endRetrieved = b;
                var eventParams = {employeeIds: ids, fromDate: a, toDate: b};
                if (ctrl.isWorksiteSchedulePage) {
                    eventParams.onlyWorkSites = true;
                    eventParams.workSiteId = ctrl.searchParams.workSiteId;
                }
                EventTypeDAO.retrieveBySchedule(eventParams).then(function (res) {
                    delete res.$promise;
                    delete res.$resolved;
                    _.forEach(res, function (content) {
                        if (_.find(ontime_data.employeeReasons, {key: content.reason}))
                            content.reasonDisplay = _.find(ontime_data.employeeReasons, {key: content.reason}).value;
                    })
                    ctrl.events = res;
                    $rootScope.paginationLoading = false;
                });
            } else {
                $rootScope.paginationLoading = false;
            }
        }

        ctrl.retrieveAllEmployees = function () {
            EmployeeDAO.retrieveByPosition({workSiteId: ctrl.searchParams.workSiteId}).then(function (res) {
                ctrl.searchParams.employeeIds = null;
                $('#employeeIds').select2('val', null);
                ctrl.employeeList = res;
            });
        };

        ctrl.retrieveAllPositions = function () {
            PositionDAO.retrieveAll({}).then(function (res) {
                ctrl.positions = res;
                ctrl.positionMap = {};
                if (res && res.length > 0) {
                    angular.forEach(res, function (position) {
                        ctrl.positionMap[position.id] = position.position;
                    });
                }
            });
            ctrl.officeStaffIds = [];
            PositionDAO.retrieveAll({positionGroup: ontime_data.positionGroups.OFFICE_STAFF}).then(function (res) {
                if (res && res.length > 0) {
                    angular.forEach(res, function (position) {
                        ctrl.officeStaffIds.push(position.id)
                    });
                }
            });
        };
        ctrl.actionBasedLogic = function (action, data, modal_id, modal_size, modal_backdrop) {
            if ($rootScope.hasAccess('EDIT_PAST_SCHEDULE')) {
                if (action === 'delete') {
                    $rootScope.employeePopup.deleteSchedule();
                } else if (action === 'edit') {
                    ctrl.saveEmployeePopupChanges($rootScope.employeePopup.data, true);
                } else if (action === 'add') {
                    $rootScope.openModalCalendar(data, modal_id, modal_size, modal_backdrop);
                }
            } else if (action !== 'add') {
                toastr.error('Not authorized to edit past events.');
            }
        };
        ctrl.eventClicked = function (eventObj) {
            $rootScope.openModalCalendar1(eventObj, 'calendar-modal', 'lg', 'static');
        };

        $rootScope.openModalCalendar1 = function (data, modal_id, modal_size, modal_backdrop)
        {
            if (data != null && data.eventType == null && data.askPassword) {
                ctrl.actionBasedLogic('add', data, modal_id, modal_size, modal_backdrop);
            } else {
                $rootScope.openModalCalendar(data, modal_id, modal_size, modal_backdrop);
            }
        };
        var setWorkSiteData = function () {
            if (ctrl.searchParams.workSiteId != null) {
                $rootScope.employeePopup.data.workSiteId = ctrl.searchParams.workSiteId;
                $rootScope.employeePopup.workSiteChanged($rootScope.employeePopup.data.workSiteId);
            }
            $timeout(function () {
                $scope.$apply(function () {
                    if ($rootScope.employeePopup.isWorksiteSchedulePage) {
                        $rootScope.employeePopup.data.worksiteSchedule = true;
                    }
                });
            });
        };
        $rootScope.openModalCalendar = function (data, modal_id, modal_size, modal_backdrop)
        {
            var data;
            var employeeObj;
            var patients;
            function open() {
                $rootScope.unmaskLoading();
                setTimeout(function () {
                    $("#eventEmployeeIds").select2({
                        // minimumResultsForSearch: -1,
                        placeholder: 'Select Employee...',
                        // minimumInputLength: 1,
                        // placeholder: 'Search',
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                    $("#patient").select2({
                        // minimumResultsForSearch: -1,
                        placeholder: 'Select Patient...',
                        // minimumInputLength: 1,
                        // placeholder: 'Search',
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                    $("#patient1").select2({
                        // minimumResultsForSearch: -1,
                        placeholder: 'Select Patient...',
                        // minimumInputLength: 1,
                        // placeholder: 'Search',
                    }).on('select2-open', function ()
                    {
                        // Adding Custom Scrollbar
                        $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                    });
                    cbr_replace();
                }, 800);
                $rootScope.employeePopup = $modal.open({
                    templateUrl: 'app/calendar/views/employee_calendar_modal.html',
                    size: modal_size,
                    backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                    keyboard: false
                });
                $rootScope.employeePopup.retrievingAvailabiltiy = false;
                $rootScope.employeePopup.isWorksiteSchedulePage = ctrl.isWorksiteSchedulePage;
                $rootScope.employeePopup.todayDate = new Date();
                if (data != null && data.eventType == null) {
                    $rootScope.employeePopup.todayDate = data.startDate;
                }
                $rootScope.employeePopup.calendarView = ctrl.calendarView;
                $rootScope.employeePopup.employeeList = ctrl.employeeList;
                $rootScope.employeePopup.patients = patients;
                $rootScope.employeePopup.eventTypes = ontime_data.eventTypes;
                $rootScope.employeePopup.recurranceTypes = ontime_data.recurranceTypes;
                $rootScope.employeePopup.employee = angular.copy(employeeObj);
                $rootScope.employeePopup.patientMandatory = true;

                $rootScope.employeePopup.types = {
                    'SICK': 'SIT',
                    'PSNL': 'PRT',
                    'VCTN': 'VCT'
                };
                $rootScope.employeePopup.validateDetails = function () {
                    var type = $rootScope.employeePopup.types[$rootScope.employeePopup.data.reason];
                    if ($rootScope.employeePopup.validationStartDate && $rootScope.employeePopup.validationStartDate[type]) {
                        if (moment($rootScope.employeePopup.validationStartDate[type]).toDate() > moment(new Date($rootScope.employeePopup.data.startDate)).toDate()) {
                            $rootScope.employeePopup.validStart = false;
                            $rootScope.employeePopup.data.isPaidDisabled = true;
                            $rootScope.employeePopup.data.isPaid = false;
                            $formService.uncheckCheckboxValue('paid');
                            delete $rootScope.employeePopup.data.noOfHours;
                        } else {
                            $rootScope.employeePopup.validStart = true;
                            $rootScope.employeePopup.data.isPaidDisabled = false;
                        }
                    } else {
                        $rootScope.employeePopup.validStart = true;
                        $rootScope.employeePopup.data.isPaidDisabled = false;
                    }
                    if ($rootScope.employeePopup.validationHours != null) {
                        $rootScope.employeePopup.checkHoursValidity($rootScope.employeePopup.validationHours, type);
                    } else {
                        $rootScope.employeePopup.validHours = true;
                        $rootScope.employeePopup.validHours2 = true;
                    }
                };

                $rootScope.employeePopup.setAvailability = function (empId, validateDetails) {
                    if (empId) {
                        $rootScope.employeePopup.retrievingAvailabiltiy = true;
                        $rootScope.employeePopup.validationStartDate = {};
                        $rootScope.employeePopup.validationHours = {};
                        EmployeeDAO.getTimeAvailability({employeeId: empId}).then(function (res) {
                            if (res) {
                                $rootScope.employeePopup.availablityDetails = angular.copy(res);
                                $rootScope.employeePopup.reasons = [];
                                for (var i = 0; i < ontime_data.employeeReasons.length; i++) {
                                    var key = ontime_data.employeeReasons[i].key;
                                    if (["SICK", "PSNL", "VCTN"].indexOf(key) > -1) {
                                        if (($rootScope.employeePopup.availablityDetails.vestingPeriodMap['SIT'] && key === 'SICK')
                                                || ($rootScope.employeePopup.availablityDetails.vestingPeriodMap['PIT'] && key === 'PSNL')
                                                || ($rootScope.employeePopup.availablityDetails.vestingPeriodMap['VCT'] && key === 'VCTN')) {
                                            $rootScope.employeePopup.reasons.push(ontime_data.employeeReasons[i]);
                                        }
                                    } else {
                                        $rootScope.employeePopup.reasons.push(ontime_data.employeeReasons[i]);
                                    }
                                }
                                if (res.hiringDate && $rootScope.employeePopup.availablityDetails.vestingPeriodMap) {
                                    angular.forEach($rootScope.employeePopup.availablityDetails.vestingPeriodMap, function (val, key) {
                                        $rootScope.employeePopup.validationStartDate[key] = moment(new Date(res.hiringDate)).add(val, 'Days').toDate();
                                    });
                                }
                                if (res.utilizationDate) {
                                    $rootScope.employeePopup.utilizationDate = new Date(res.utilizationDate);
                                }
                                $rootScope.employeePopup.canApplyPreviousYearLeaves = true;
                                if (res.applyDate) {
                                    $rootScope.employeePopup.canApplyPreviousYearLeaves = new Date(res.applyDate) > new Date();
                                }

                                if ($rootScope.employeePopup.availablityDetails.timeAvailabilityMap) {
                                    _.each($rootScope.employeePopup.availablityDetails.timeAvailabilityMap, function (year, details) {
                                        _.each(details, function (type) {
                                            if (type && details[type] !== null && !_.isInteger(details[type])) {
                                                details[type] = parseFloat(details[type]).toPrecision(2);
                                            }
                                        });
                                    });
                                    $rootScope.employeePopup.validationHours = $rootScope.employeePopup.availablityDetails.timeAvailabilityMap;
                                }
                                if ($rootScope.employeePopup.data && $rootScope.employeePopup.data.reason && $rootScope.employeePopup.data.isEdited
                                        && $rootScope.employeePopup.data.isPaid == true) {
                                    var reasonType = $rootScope.employeePopup.types[$rootScope.employeePopup.data.reason];
                                    _.each($rootScope.employeePopup.validationHours, function (details, year) {
                                        _.each(details, function (hours, type) {
                                            if (reasonType == type) {
                                                if (year == $rootScope.employeePopup.data.leaveYear && $rootScope.employeePopup.data.noOfHours != null) {
                                                    if (_.isInteger(hours) && _.isInteger($rootScope.employeePopup.data.noOfHours))
                                                        $rootScope.employeePopup.validationHours[year][type] = parseInt(hours) + parseInt($rootScope.employeePopup.data.noOfHours);
                                                    else
                                                        $rootScope.employeePopup.validationHours[year][type] = parseFloat((parseFloat(hours) + parseFloat($rootScope.employeePopup.data.noOfHours)).toPrecision(2));
                                                } else if (year == $rootScope.employeePopup.data.leaveYear2 && $rootScope.employeePopup.data.noOfHours2 != null) {
                                                    if (_.isInteger(hours) && _.isInteger($rootScope.employeePopup.data.noOfHours2))
                                                        $rootScope.employeePopup.validationHours[year][type] = parseInt(hours) + parseInt($rootScope.employeePopup.data.noOfHours2);
                                                    else
                                                        $rootScope.employeePopup.validationHours[year][type] = parseFloat((parseFloat(hours) + parseFloat($rootScope.employeePopup.data.noOfHours2)).toPrecision(2));
                                                }
                                            }
                                        });
                                    });
                                }
                            } else {
                                $rootScope.employeePopup.availablityDetails = {};
                            }
                            $rootScope.employeePopup.retrievingAvailabiltiy = false;
                            if (validateDetails) {
                                $rootScope.employeePopup.validateDetails();
                            }

                        }).catch(function (data, status) {
                            $rootScope.employeePopup.availablityDetails = {};
                        }).then(function (data, status) {
                            if (empId && $rootScope.employeePopup.data.eventType == 'U' && $rootScope.employeePopup.data.reason) {
                                $rootScope.employeePopup.validateDetails();
                            } else {
                                $rootScope.employeePopup.validHours = true;
                                $rootScope.employeePopup.validHours2 = true;
                                $rootScope.employeePopup.validStart = true;
                                $rootScope.employeePopup.utilizationDateFallsBtw = false;
                            }
                        });
                    }
                };
                if (data == null) {
                    $rootScope.employeePopup.isNew = true;
                    $rootScope.employeePopup.showEmployee = true;
                } else {
                    if (data.eventType == null) {
                        $rootScope.employeePopup.isNew = true;
                        $rootScope.employeePopup.showEmployee = false;
                    } else {
                        $rootScope.employeePopup.isNew = false;
                        $rootScope.employeePopup.showEmployee = false;
                        var a = moment(new Date(data.startDate));
                        var diff = moment().diff(a, 'days');
                        if (diff > 0) { // past date
                            data.isEdited1 = true;
                        }
                        data.isEdited = true;
                        $rootScope.employeePopup.data = data;
                        if (data.eventType != 'U')
                            $rootScope.employeePopup.data.applyTo = "SINGLE";
                    }
                }

                function setEmployeeValueInModal(employeeId) {
                    if (employeeId) {
                        setTimeout(function () {
                            $("#eventEmployeeIds").select2({val: employeeId});
                        }, 100);
                    }
                }


                var currentTime = $filter('date')(new Date().getTime(), timeFormat).toString();
                $rootScope.employeePopup.workSiteCareTypeChanged = function (careTypeId, employeeId) {
                    $rootScope.paginationLoading = true;
                    if (careTypeId == null && $rootScope.employeePopup.workSiteSelected != null
                            && $rootScope.employeePopup.workSiteSelected.insuranceProviderId != null) {
                        $rootScope.employeePopup.workSiteEmployeeList = [];
                    }
                    EmployeeDAO.retrieveByPosition({workSiteId: $rootScope.employeePopup.workSiteSelected.id,
                        careTypeId: careTypeId
                    }).then(function (res) {
                        $rootScope.employeePopup.workSiteEmployeeList = res;
                        $rootScope.paginationLoading = false;
                        setEmployeeValueInModal(employeeId);
                    });
                };

                $rootScope.employeePopup.workSitePunchInitiated = function (data) {
                    $rootScope.paginationLoading = true;
                    for (var i = 0; i < $rootScope.employeePopup.workSiteList.length; i++) {
                        var ws = $rootScope.employeePopup.workSiteList[i];
                        if (ws.id === data.workSiteId) {
                            $rootScope.employeePopup.workSiteSelected = ws;
                            if (ws.insuranceProviderId != null) {
                                CareTypeDAO.retrieveAll({insuranceProviderId: ws.insuranceProviderId}).then(function (res) {
                                    $rootScope.employeePopup.careTypes = res;
                                    $rootScope.employeePopup.workSiteCareTypeChanged(data.companyCareTypeId, data.employeeId);
                                    setEmployeeValueInModal(data.employeeId);
                                }).catch(function () {
                                    toastr.error("Failed to retrieve care types.");
                                });
                            } else {
                                EmployeeDAO.retrieveByPosition({workSiteId: data.workSiteId}).then(function (res) {
                                    $rootScope.employeePopup.workSiteEmployeeList = res;
                                    setEmployeeValueInModal(data.employeeId);
                                    $rootScope.paginationLoading = false;
                                });
                            }
                            break;
                        }
                    }
                }


                $rootScope.employeePopup.workSiteChanged = function (workSiteId) {
                    $rootScope.paginationLoading = true;
                    if (workSiteId == null) {
                        $rootScope.employeePopup.careTypes = [];
                        $rootScope.employeePopup.workSiteEmployeeList = [];
                    }
                    for (var i = 0; i < ctrl.workSiteList.length; i++) {
                        var ws = ctrl.workSiteList[i];
                        if (ws.id === workSiteId) {
                            $rootScope.employeePopup.workSiteSelected = ws;
                            if (ws.insuranceProviderId != null) {
                                CareTypeDAO.retrieveAll({insuranceProviderId: ws.insuranceProviderId}).then(function (res) {
                                    $rootScope.employeePopup.careTypes = res;
                                    $rootScope.paginationLoading = false;
                                }).catch(function () {
                                    toastr.error("Failed to retrieve care types.");
                                });
                            } else {
                                EmployeeDAO.retrieveByPosition({workSiteId: workSiteId}).then(function (res) {
                                    $rootScope.employeePopup.workSiteEmployeeList = res;
                                    $rootScope.paginationLoading = false;
                                });
                            }
                            break;
                        }
                    }
                };
                if (!angular.isDefined($rootScope.employeePopup.data)) {
                    $rootScope.employeePopup.data = {eventType: "S", recurranceType: "N", startTime: currentTime, endTime: currentTime, forLiveIn: false, startDate: $filter('date')($rootScope.employeePopup.todayDate, $rootScope.dateFormat), endDate: $filter('date')($rootScope.employeePopup.todayDate, $rootScope.dateFormat)};
                    setWorkSiteData();
                }
                if (data && data.eventType == null) {
                    var id;
                    if (data.data) {
                        id = data.data.id;
                        $rootScope.employeePopup.cellClickEmployeeId = id;
                    } else {
                        id = ctrl.viewEmployee.id;
                    }
                    $rootScope.employeePopup.data = {eventType: "S", recurranceType: "N", startTime: currentTime, endTime: currentTime, forLiveIn: false, startDate: $filter('date')(data.startDate, $rootScope.dateFormat), endDate: $filter('date')(data.startDate, $rootScope.dateFormat), employeeId: id};
                    setWorkSiteData();
                }
                $rootScope.employeePopup.closePopup = function () {
                    $rootScope.paginationLoading = false;
                    delete $rootScope.employeePopup.availablityDetails;
                    $rootScope.employeePopup.close();
                };
                $rootScope.employeePopup.save1 = function () {
                    $timeout(function () {
                        var name = '#' + "popupemployee" + $rootScope.employeePopup.data.eventType.toLowerCase();
                        if ($(name)[0].checkValidity()) {
                            var a = moment(new Date($rootScope.employeePopup.data.startDate));
                            var b = moment(new Date($rootScope.employeePopup.data.endDate));
                            var diff = b.diff(a, 'days');
                            if (diff > 6) {
                                toastr.error("Date range should be no more of 7 days.");
                            } else {
                                if ($rootScope.employeePopup.data.eventType == 'U') {
                                    var start = new Date($rootScope.employeePopup.data.startDate).getDay();
                                    var end = new Date($rootScope.employeePopup.data.endDate).getDay();
                                    if (end < start) {
                                        toastr.error("Both dates must fall in same week.");
                                    } else {
                                        $rootScope.employeePopup.response = true;
                                    }
                                } else {
                                    $rootScope.employeePopup.response = true;
                                }
                            }
                        } else {
                            console.log("invalid form");
                        }
                    });
                };
                $rootScope.employeePopup.save = function () {
                    delete $rootScope.employeePopup.response;
                    $rootScope.employeePopup.save1();
                    $timeout(function () {
                        if ($rootScope.employeePopup.response) {
                            ctrl.saveEmployeePopupChanges($rootScope.employeePopup.data);
                        }
                    });
                };
                $rootScope.employeePopup.retrievePatientBasedOnCare = function () {
                    delete $rootScope.employeePopup.data.patientId;
                    setTimeout(function () {
                        $("#patient").select2('data', null);
                        $("#patient1").select2('data', null);
                    }, 100);
                    $rootScope.employeePopup.patients = $rootScope.employeePopup.carePatientMap[$rootScope.employeePopup.data.companyCareTypeId];
                };
                $rootScope.employeePopup.changed = function (form, event) {
                    if (event != 'repeat') {
                        var currentTime = $filter('date')(new Date().getTime(), timeFormat).toString();
                        var old = $rootScope.employeePopup.data.eventType;
                        $rootScope.employeePopup.data = {eventType: old, recurranceType: "N", startDate: $filter('date')($rootScope.employeePopup.todayDate, $rootScope.dateFormat), endDate: $filter('date')($rootScope.employeePopup.todayDate, $rootScope.dateFormat)};
                        setWorkSiteData();
                        if (old == 'S') {
                            if (!angular.isDefined($rootScope.employeePopup.data.forLiveIn))
                                $rootScope.employeePopup.data.forLiveIn = false;
                        }
                        if (old != 'U') {
                            $rootScope.employeePopup.data.startTime = currentTime;
                            $rootScope.employeePopup.data.endTime = currentTime;
                        }
                        if (old == 'U') {
                            $rootScope.employeePopup.setAvailability($rootScope.employeePopup.employee.id, false);
                            if (!angular.isDefined($rootScope.employeePopup.data.isPaid))
                                $rootScope.employeePopup.data.isPaid = false;
                        }
                        setTimeout(function () {
                            $("#eventEmployeeIds").select2({
                                // minimumResultsForSearch: -1,
                                placeholder: 'Select Employee...',
                                // minimumInputLength: 1,
                                // placeholder: 'Search',
                            }).on('select2-open', function ()
                            {
                                // Adding Custom Scrollbar
                                $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                            });
                            $("#patient").select2({
                                // minimumResultsForSearch: -1,
                                placeholder: 'Select Patient...',
                                // minimumInputLength: 1,
                                // placeholder: 'Search',
                            }).on('select2-open', function ()
                            {
                                // Adding Custom Scrollbar
                                $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                            });
                            $("#patient1").select2({
                                // minimumResultsForSearch: -1,
                                placeholder: 'Select Patient...',
                                // minimumInputLength: 1,
                                // placeholder: 'Search',
                            }).on('select2-open', function ()
                            {
                                // Adding Custom Scrollbar
                                $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                            });
                            cbr_replace();
                        }, 200);
                    }
                };
                $rootScope.employeePopup.openEventModal = function (action) {
                    $rootScope.employeePopup.action = action;
                    if (!$rootScope.employeePopup.data.isEdited1) {
                        if (action == 'delete') {
                            $rootScope.employeePopup.deleteSchedule();
                        } else {
                            $rootScope.employeePopup.save();
                        }
                    } else {
                        function open() {
                            delete $rootScope.employeePopup.availablityDetails;
                            ctrl.actionBasedLogic(action);
                        }
                        if (action == 'delete') {
                            open();
                        } else {
                            delete $rootScope.employeePopup.response;
                            $rootScope.employeePopup.save1();
                            $timeout(function () {
                                if ($rootScope.employeePopup.response) {
                                    open();
                                }
                            });
                        }
                    }
                };
                $rootScope.employeePopup.deleteSchedule = function () {
                    var obj = $rootScope.employeePopup.data;
                    var id;
                    if (obj.availabilityId)
                        id = obj.availabilityId;
                    if (obj.scheduleId)
                        id = obj.scheduleId;
                    if (obj.unavailabilityId)
                        id = obj.unavailabilityId;
                    $rootScope.maskLoading();
                    EventTypeDAO.delete({subAction: id, action: ontime_data.eventTypes[obj.eventType].toLowerCase(), applyTo: obj.applyTo, isEmployeeSchedule: true}).then(function (res) {
                        ctrl.retrieveEmployees();
                        toastr.success("Event deleted.");
                        delete $rootScope.employeePopup.availablityDetails;
                        $rootScope.employeePopup.close();
                    }).catch(function (data, status) {
                        toastr.error(data.data);
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                };

                $rootScope.employeePopup.checkHoursValidity = function (validationHours, type) {
                    if (!$rootScope.employeePopup.hoursData) {
                        $rootScope.employeePopup.hoursData = {};
                    }
                    $rootScope.employeePopup.utilizationDateFallsBtw = false;
                    if ($rootScope.employeePopup.utilizationDate) {
                        var years = _.keys(validationHours ? validationHours : {});

                        if ($rootScope.employeePopup.canApplyPreviousYearLeaves && (moment($rootScope.employeePopup.utilizationDate).toDate() >= moment(new Date($rootScope.employeePopup.data.startDate)).toDate())
                                && (moment($rootScope.employeePopup.utilizationDate).toDate() >= moment(new Date($rootScope.employeePopup.data.endDate)).toDate())) {
                            if (years && years.length > 0) {
                                $rootScope.employeePopup.data.leaveYear = years[0];
                                $rootScope.employeePopup.data.leaveYear2 = years[1];
                                if (years[0] && validationHours[years[0]] && validationHours[years[0]][type] != null) {
                                    $rootScope.employeePopup.hoursData.noOfAllowedHours = validationHours[years[0]][type];
                                } else {
                                    delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                                }
                                if (years[1] && validationHours[years[1]] && validationHours[years[1]][type] != null) {
                                    $rootScope.employeePopup.hoursData.noOfAllowedHours2 = validationHours[years[1]][type];
                                } else {
                                    delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                                }
                                $rootScope.employeePopup.showSingleBox = false;
                            } else {
                                $rootScope.employeePopup.showSingleBox = true;
                                delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                                delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                            }
                        } else if (!$rootScope.employeePopup.canApplyPreviousYearLeaves || (moment($rootScope.employeePopup.utilizationDate).toDate() < moment(new Date($rootScope.employeePopup.data.startDate)).toDate()
                                && moment($rootScope.employeePopup.utilizationDate).toDate() < moment(new Date($rootScope.employeePopup.data.endDate)).toDate())) {
                            delete $rootScope.employeePopup.data.leaveYear2;
                            delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                            if (years && years.length > 0) {
                                $rootScope.employeePopup.data.leaveYear = years[1];
                                if (years[1] && validationHours[years[1]] && validationHours[years[1]][type] != null) {
                                    $rootScope.employeePopup.hoursData.noOfAllowedHours = validationHours[years[1]][type];
                                } else {
                                    delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                                }
                                $rootScope.employeePopup.showSingleBox = false;
                            } else {
                                $rootScope.employeePopup.showSingleBox = true;
                                delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                                delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                            }
                        } else {
                            $rootScope.employeePopup.showSingleBox = true;
                            $rootScope.employeePopup.utilizationDateFallsBtw = true;
                            delete $rootScope.employeePopup.data.leaveYear;
                            delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                            delete $rootScope.employeePopup.data.leaveYear2;
                            delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                        }
                    } else {
                        $rootScope.employeePopup.showSingleBox = true;
                        delete $rootScope.employeePopup.data.leaveYear;
                        delete $rootScope.employeePopup.hoursData.noOfAllowedHours;
                        delete $rootScope.employeePopup.data.leaveYear2;
                        delete $rootScope.employeePopup.hoursData.noOfAllowedHours2;
                    }

                    if ($rootScope.employeePopup.showSingleBox) {
                        $rootScope.employeePopup.validHours = true;
                        $rootScope.employeePopup.validHours2 = true;
                    } else {
                        if ($rootScope.employeePopup.data.leaveYear && ($rootScope.employeePopup.hoursData.noOfAllowedHours < $rootScope.employeePopup.data.noOfHours)) {
                            $rootScope.employeePopup.validHours = false;
                        } else {
                            $rootScope.employeePopup.validHours = true;
                        }

                        if ($rootScope.employeePopup.data.leaveYear2 && ($rootScope.employeePopup.hoursData.noOfAllowedHours2 < $rootScope.employeePopup.data.noOfHours2)) {
                            $rootScope.employeePopup.validHours2 = false;
                        } else {
                            $rootScope.employeePopup.validHours2 = true;
                        }
                    }
                };

                $rootScope.employeePopup.employeeChanged = function (empId, editMode, viewMode) {
                    if ($rootScope.employeePopup.data.eventType == 'U' || (editMode === false)) {
                        $rootScope.employeePopup.setAvailability(empId, false);
                    }
                    if ($rootScope.employeePopup.data.eventType == 'S' && !editMode) {
                        setTimeout(function () {
                            $("#patient").select2('data', null);
                            $("#patient1").select2('data', null);
                        }, 100);
                        delete $rootScope.employeePopup.data.companyCareTypeId;
                        delete $rootScope.employeePopup.data.patientId;
                        $rootScope.employeePopup.carePatientMap = {};
                        $rootScope.employeePopup.careTypes = [];
                    }
                    if (!($rootScope.employeePopup.data.eventType != 'S' && !editMode && !viewMode)) {
                        $rootScope.paginationLoading = true;
                        EmployeeDAO.getEmployeesForSchedule({employeeIds: empId}).then(function (res) {
                            $rootScope.employeePopup.patientMandatory = true;
                            employeeObj = res[0];
                            if (ctrl.officeStaffIds.indexOf(res[0].companyPositionId) > -1) {
                                $rootScope.employeePopup.patientMandatory = false;
                            }
                            if (ctrl.calendarView == 'month' || !$rootScope.employeePopup.isNew || !$rootScope.employeePopup.showEmployee) {
                                $rootScope.employeePopup.employee = angular.copy(employeeObj);
                            }
                        }).catch(function (data, status) {
                            toastr.error("Failed to retrieve employee.");
                        }).then(function () {

                            function open1() {
                                if ($rootScope.employeePopup.data.eventType == 'S' || viewMode) {
                                    ctrl.careTypeIdMap = {};
                                    var careTypesSelected = [];
                                    if (employeeObj && employeeObj.employeeCareRatesList && employeeObj.employeeCareRatesList.length > 0) {
                                        var length = employeeObj.employeeCareRatesList.length;
                                        carePatientMap = {};
                                        var next = 0;
                                        for (var i = 0; i < length; i++) {
                                            careTypesSelected.push(employeeObj.employeeCareRatesList[i].companyCaretypeId);
                                            var id = employeeObj.employeeCareRatesList[i].companyCaretypeId.id;
                                            PatientDAO.retrieveForCareType({companyCareTypes: id, subAction: "active", sortBy: 'lName', order: 'asc'}).then(function (res) {
                                                carePatientMap[res.headers.careid] = res.data;
                                                next++;
                                            }).catch(function (data) {
                                                toastr.error(data.data);
                                            }).then(function () {
                                                if (next === length || length == 1) {
                                                    $rootScope.paginationLoading = false;
                                                    careTypes = careTypesSelected;
                                                    $rootScope.employeePopup.carePatientMap = carePatientMap;
                                                    $rootScope.employeePopup.careTypes = careTypes;
                                                    if (editMode) {
                                                        $rootScope.employeePopup.patients = $rootScope.employeePopup.carePatientMap[$rootScope.employeePopup.data.companyCareTypeId];
                                                        if ($rootScope.employeePopup.data.patientId) {
                                                            setTimeout(function () {
                                                                $("#patient").select2({val: $rootScope.employeePopup.data.patientId});
                                                                $("#patient1").select2({val: $rootScope.employeePopup.data.patientId});
                                                            }, 100);
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    } else if (!employeeObj) {
                                        $rootScope.paginationLoading = false;
                                        employeeObj = {};
                                        $rootScope.unmaskLoading();
                                        toastr.error("Failed to retrieve employee.");
                                    } else if (employeeObj && employeeObj.employeeCareRatesList && employeeObj.employeeCareRatesList.length === 0) {
                                        $rootScope.paginationLoading = false;
                                    }
                                } else {
                                    $rootScope.paginationLoading = false;
                                }
                            }
                            if (data != null) {
                                var id;
                                if (data.availabilityId)
                                    id = data.availabilityId;
                                if (data.scheduleId)
                                    id = data.scheduleId;
                                if (data.unavailabilityId)
                                    id = data.unavailabilityId;
                                if (id) {
                                    var obj = {action: ontime_data.eventTypes[data.eventType].toLowerCase(), subAction: id};
                                    EventTypeDAO.retrieveEventType(obj).then(function (res) {
                                        data = angular.copy(res);
                                        data.applyTo = "SINGLE";
                                        var a = moment(new Date(data.startDate));
                                        var diff = moment().diff(a, 'days');
                                        if (diff > 0) { // past date
                                            data.isEdited1 = true;
                                        }
                                        data.isEdited = true;
                                        $rootScope.employeePopup.data = angular.copy(data);
                                        if (data.workSiteId != null) {
                                            $rootScope.employeePopup.workSitePunchInitiated(data);
                                        }
                                    }).catch(function (data) {
                                        toastr.error("Failed to retrieve data");
                                    }).then(function () {
                                        open1();
                                    });
                                } else {
                                    open1();
                                }
                            } else {
                                open1();
                            }
                        });
                    }
                };
                if (!$rootScope.employeePopup.showEmployee) {
                    WorksiteDAO.retreveWorksiteNames({employeeId: $rootScope.employeePopup.data.employeeId}).then(function (res) {
                        $rootScope.employeePopup.workSiteList = res;
                    });
                } else {
                    $rootScope.employeePopup.workSiteList = ctrl.workSiteList;
                }
                if ($rootScope.employeePopup.employee && !$rootScope.employeePopup.isNew) {
                    $rootScope.employeePopup.employeeChanged($rootScope.employeePopup.data.employeeId, true);
                } else if ($rootScope.employeePopup.employee && $rootScope.employeePopup.isNew && !$rootScope.employeePopup.showEmployee) {
                    $rootScope.employeePopup.employeeChanged($rootScope.employeePopup.data.employeeId, true, true);
                } else if (ctrl.calendarView == 'month') {
                    $rootScope.employeePopup.employeeChanged(ctrl.viewEmployee.id, false, true);
                }
            }

            $rootScope.$watch('employeePopup.data.reason + employeePopup.data.startDate + employeePopup.data.endDate + employeePopup.data.eventType + employeePopup.data.noOfHours + employeePopup.data.noOfHours2 + $rootScope.employeePopup.data.eventType', function (newVal, oldValue) {
                if (($rootScope.employeePopup.data.employeeId || (ctrl.viewEmployee && ctrl.viewEmployee.id)) && $rootScope.employeePopup.data.eventType == 'U'
                        && $rootScope.employeePopup.data.reason && oldValue && oldValue !== '' && newVal && newVal !== '') {
                    if ($rootScope.employeePopup.availablityDetails) {
                        $rootScope.employeePopup.validateDetails();
                    } else if ($rootScope.employeePopup.retrievingAvailabiltiy === false) {
                        if ($rootScope.employeePopup.employee && !$rootScope.employeePopup.isNew) {
                            $rootScope.employeePopup.setAvailability($rootScope.employeePopup.data.employeeId, true);
                        } else if (ctrl.calendarView == 'month') {
                            $rootScope.employeePopup.setAvailability(ctrl.viewEmployee.id, true);
                        } else if ($rootScope.employeePopup.employee) {
                            $rootScope.employeePopup.setAvailability($rootScope.employeePopup.employee.id, true);
                        }
                    }
                } else {
                    $rootScope.employeePopup.validHours = true;
                    $rootScope.employeePopup.validHours2 = true;
                    $rootScope.employeePopup.validStart = true;
                }
            });

            $rootScope.maskLoading();
            var careTypes;
            var carePatientMap;
            employeeObj = {};
            open();
        };

        ctrl.onChangeShowPatientsByDistnace = function () {
            if (ctrl.showPatientsVyDistance) {
                showPatientMarkers();
            } else {
                hidePatientMarkers();
            }
        }


        ctrl.saveEmployeePopupChanges = function (data, isPast) {
            $rootScope.maskLoading();
            if (!data.isPaid)
                delete data.noOfHours;
            var data1 = angular.copy(data);
            if (!data1.employeeId && ctrl.calendarView == 'month') {
                data1.employeeId = ctrl.viewEmployee.id;
            }
            if (!data1.employeeId && $rootScope.employeePopup.isNew && !$rootScope.employeePopup.showEmployee) {
                data1.employeeId = $rootScope.employeePopup.cellClickEmployeeId;
            }
            if (data1.eventType != 'S') {
                delete data1.isEdited;
            }

            delete data1.isEdited1;
            var obj = {action: data1.eventType, data: data1, isPast: false};
            if (isPast) {
                obj.isPast = true;
            }
            console.log("employee data :: " + JSON.stringify(data1));
            if ($rootScope.employeePopup.isNew) {
                if ($rootScope.employeePopup.isWorksiteSchedulePage) {
                    obj.data.worksiteSchedule = true;
                }
                EventTypeDAO.saveEventType(obj).then(function (res) {
                    toastr.success("Saved successfully.");
                    delete $rootScope.employeePopup.availablityDetails;
                    $rootScope.employeePopup.close();
                    ctrl.retrieveEmployees();
                }).catch(function (data) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            } else {
                obj.action = ontime_data.eventTypes[obj.action].toLowerCase();
                if (obj.data.availabilityId)
                    obj.subAction = obj.data.availabilityId;
                if (obj.data.scheduleId)
                    obj.subAction = obj.data.scheduleId;
                if (obj.data.unavailabilityId)
                    obj.subAction = obj.data.unavailabilityId;
                EventTypeDAO.updateEventType(obj).then(function (res) {
                    toastr.success("Updated successfully.");
                    delete $rootScope.employeePopup.availablityDetails;
                    $rootScope.employeePopup.close();
                    ctrl.retrieveEmployees();
                }).catch(function (data) {
                    toastr.error(data.data);
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        };
        $rootScope.openEditModal = function (employee, modal_id, modal_size, modal_backdrop)
        {
            var modalInstance = $modal.open({
                templateUrl: appHelper.viewTemplatePath('common', 'employee-info'),
                size: 'lg',
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false,
                controller: 'EmployeeInfoCtrl as employeeinfo',
                resolve: {
                    employeeId: function () {
                        return employee.id;
                    }
                }
            });
            modalInstance.result.then(function () {
                console.log("popup closed");
            });
        };
        function setMonthDate() {
            var startOfMonth = moment().startOf('month');
            var endOfMonthView = moment().endOf('month').endOf('week');
            $rootScope.weekStart = new Date(startOfMonth);
            $rootScope.weekEnd = new Date(endOfMonthView);
        }
        function setWeekDate() {
            var startOfWeek = moment().startOf('week');
            var endOfWeek = moment().endOf('week');
            $rootScope.weekStart = new Date(startOfWeek);
            $rootScope.weekEnd = new Date(endOfWeek);
        }
        $rootScope.navigateToMonthPage = function (employee) {
            delete ctrl.monthEmployee;
            $state.go('app.employee-calendar', {id: employee.id});
        };

        if (!ctrl.isWorksiteSchedulePage) {
            ctrl.retrieveEmployees();
            ctrl.retrieveAllEmployees();
        }

        ctrl.retrieveAllPositions();
        if (ctrl.isEmployeeSearchPage) {
            var map;
            var patientMarker;
            var markers = [];
            var patientMarkers = [];
            var infowindow = new google.maps.InfoWindow();
            function addMarkersToMap(emplyeeList, patientList) {
                if (map == null) {
                    googleMapFunctions();
                } else {
                    clearMarkers();

                }
                if (ctrl.selectedPatient != null) {
//                    clear patient marker is marker is not created through location filter
                    if (patientMarker != null) {
                        patientMarker.setMap(null);
                    }
                    addPatientMarker();
                }
                for (var i = 0; i < emplyeeList.length; i++) {
                    if (emplyeeList[i].locationLatitude != null) {
                        var location = [emplyeeList[i].locationLatitude, emplyeeList[i].locationLongitude]
                        var marker = new google.maps.Marker({
                            position: {lat: location[0], lng: location[1]},
                            map: map
                        });
                        marker.addListener('click', function (e) {
                            showInfo(this.position, infowindow, this.title, this.content);
                            infowindow.open(map, this);
                        });
                        marker.title = emplyeeList[i].lName + ", " + emplyeeList[i].fName;
                        marker.content = emplyeeList[i].address1;
                        if (emplyeeList[i].address2 != null) {
                            marker.content += emplyeeList[i].address2;
                        }
                        marker.content += "<br/>" + emplyeeList[i].city + ", ";
                        marker.content += emplyeeList[i].state + ", ";
                        marker.content += emplyeeList[i].zipcode;
                        if (emplyeeList[i].phone != null) {
                            marker.content += "<br/>Ph.: " + $filter("tel")(emplyeeList[i].phone);
                        }
                        if (emplyeeList[i].distance != null) {
                            marker.content += "<br/>" + emplyeeList[i].distance.toFixed(2) + " Miles";
                        }
                        markers.push(marker);
                    }
                }
                addPatientMarkers(patientList);
            }
            function addPatientMarkers(patientList) {
                for (var i = 0; i < patientList.length; i++) {
                    if (patientList[i].locationLatitude != null) {
                        var location = [patientList[i].locationLatitude, patientList[i].locationLongitude]
                        var marker = new google.maps.Marker({
                            position: {lat: location[0], lng: location[1]}
                        });
                        var image = {
                            url: 'http://maps.google.com/mapfiles/ms/icons/yellow-dot.png',
                            // This marker is 55 pixels wide by 55 pixels high.
                            scaledSize: new google.maps.Size(40, 40),
                        };
                        marker.setIcon(image);
                        marker.addListener('click', function (e) {
                            showInfo(this.position, infowindow, this.title, this.content, true);
                            infowindow.open(map, this);
                        });
                        marker.title = patientList[i].lName + ", " + patientList[i].fName;
                        marker.content = '';
                        if (patientList[i].patientAddress != null) {
                            marker.content += patientList[i].patientAddress.address1;
                            if (patientList[i].patientAddress.address2 != null) {
                                marker.content += patientList[i].patientAddress.address2;
                            }
                            marker.content += "<br/>" + patientList[i].patientAddress.city + ", ";
                            marker.content += patientList[i].patientAddress.state + ", ";
                            marker.content += patientList[i].patientAddress.zipcode + '<br/>';
                        }
                        if (patientList[i].phone != null) {
                            marker.content += "Ph.: " + $filter("tel")(patientList[i].phone);
                        }
                        if (patientList[i].distance != null) {
                            marker.content += "<br/>" + patientList[i].distance.toFixed(2) + " Miles";
                        }
                        patientMarkers.push(marker);
                    }
                }
                if (ctrl.showPatientsVyDistance) {
                    showPatientMarkers();
                }
            }
            function showInfo(latlng, infowindow, title, content, patient) {
                var geocoder = new google.maps.Geocoder();
                geocoder.geocode({
                    'latLng': latlng
                }, function (results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        if (content == null) {
                            content = results[1].formatted_address;
                        }
                        if (results[1]) {
                            var style = '';
                            if (patient) {
                                style = ' style="background-color: lightyellow;"';
                            }
                            // here assign the data to asp lables
                            infowindow.setContent('<div id="content" ' + style + '>' +
                                    '<div id="firstHeading" class="firstHeading">' + title + '</div>' +
                                    '<div id="bodyContent">' + content +
                                    '</div>' +
                                    '</div>');
                        } else {
                            alert('No results found');
                        }
                    } else {
                        alert('Geocoder failed due to: ' + status);
                    }
                });
            }

            function googleMapFunctions() {
                loadGoogleMaps(3).done(function ()
                {
                    var newyork = new google.maps.LatLng(40.7127837, -74.00594);
                    function initialize()
                    {
                        var mapOptions = {
                            zoom: 12,
                            center: newyork};
                        // Calculate Height
                        var el = document.getElementById('map-1'),
                                doc_height = $('#map-1').height();
                        // Adjust map height to fit the document contianer
                        el.style.height = doc_height + 'px';
                        map = new google.maps.Map(el, mapOptions);
                        var input = /** @type {!HTMLInputElement} */(
                                document.getElementById('pac-input'));
                        map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
                        var autocomplete = new google.maps.places.Autocomplete(input);
                        autocomplete.bindTo('bounds', map);
                        autocomplete.addListener('place_changed', function () {
                            var place = autocomplete.getPlace();
                            if (!place.geometry) {
                                try {
                                    if (place.name != null && place.name.indexOf(",") >= 0) {
                                        var locationArray = place.name.split(",");
                                        var LatLong = new google.maps.LatLng(Number(locationArray[0]), Number(locationArray[1]));
                                        map.setCenter(LatLong);
                                        place.geometry = {location: LatLong};
                                    }
                                } catch (e) {
                                    return;
                                }
                                //                                window.alert("Autocomplete's returned place contains no geometry");
                            }
                            // If the place has a geometry, then present it on a map.
                            if (place.geometry != null) {
                                if (place.geometry.viewport) {
                                    map.fitBounds(place.geometry.viewport);
                                } else {
                                    map.setCenter(place.geometry.location);
                                    map.setZoom(12);
                                }
                            }
                            ctrl.applySearch();
                            var location = place.geometry.location;
                            ctrl.searchParams.patientId = null;
                            ctrl.patientObj = null;
                            $('#patientDropdown').select2('val', null);
                            ctrl.selectedPatient = null;
                            var locationJson = JSON.parse(JSON.stringify(location));
                            ctrl.searchParams.longitude = locationJson.lng;
                            ctrl.searchParams.latitude = locationJson.lat;
                            addGreenMarker(location);
                            patientMarker.setVisible(true);
                        });
                    }
                    initialize();
                });
            }
            var addPatientMarker = function () {
                if (ctrl.selectedPatient != null && ctrl.selectedPatient.locationLatitude != null) {
                    var location = new google.maps.LatLng(ctrl.selectedPatient.locationLatitude, ctrl.selectedPatient.locationLongitude);
                    var title = ctrl.selectedPatient.lName + ', ' + ctrl.selectedPatient.fName;
                    var content = ctrl.selectedPatient.patientAddress.address1;
                    if (ctrl.selectedPatient.patientAddress.address2 != null) {
                        content += ctrl.selectedPatient.patientAddress.address2;
                    }
                    content += "<br/>" + ctrl.selectedPatient.patientAddress.city + ", ";
                    content += ctrl.selectedPatient.patientAddress.state + ", ";
                    content += ctrl.selectedPatient.patientAddress.zipcode;
                    if (ctrl.selectedPatient.phone != null) {
                        content += "<br/>Ph.: " + $filter("tel")(ctrl.selectedPatient.phone);
                    }
                    addGreenMarker(location, title, content);
                } else if (patientMarker != null) {
                    patientMarker.setVisible(false)
                }
            };
            var addGreenMarker = function (location, title, content) {
                //clear patient marker if already exist
                if (patientMarker != null) {
                    patientMarker.setMap(null);
                }
                patientMarker = new google.maps.Marker({
                    position: location,
                    map: map,
                    draggable: false,
                });
                var image = {
                    url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
                    // This marker is 55 pixels wide by 55 pixels high.
                    scaledSize: new google.maps.Size(55, 55),
                };
                patientMarker.setIcon(image);
                patientMarker.addListener('click', function (e) {

                    if (title == null) {
                        title = '';
                    }
                    showInfo(this.position, infowindow, title, content);
                    infowindow.open(map, this);
                });
                map.setCenter(location);
            }
            var clearMarkers = function () {
                for (var i = 0; i < markers.length; i++) {
                    markers[i].setMap(null);
                }
                hidePatientMarkers();
                patientMarkers = [];
                markers = [];
            }
            var hidePatientMarkers = function () {
                for (var i = 0; i < patientMarkers.length; i++) {
                    patientMarkers[i].setMap(null);
                }
            }
            var showPatientMarkers = function () {
                for (var i = 0; i < patientMarkers.length; i++) {
                    patientMarkers[i].setMap(map);
                }
            }

            ctrl.availableTimeChanged = function () {
                if (ctrl.searchParams.availableTime) {
                    ctrl.searchParams.availableStartDate = $filter('date')($rootScope.weekStart, $rootScope.dateFormat);
                    ctrl.searchParams.availableEndDate = $filter('date')($rootScope.weekEnd, $rootScope.dateFormat);
                } else {
                    delete ctrl.searchParams.availableStartDate;
                    delete ctrl.searchParams.availableEndDate;
                }
            };

            ctrl.patientChanged = function (patient) {
                ctrl.selectedPatient = patient;
                ctrl.searchParams.patientId = patient.id;
                ctrl.location = null;
                ctrl.searchParams.longitude = null;
                ctrl.searchParams.latitude = null;
                ctrl.applySearch();
            }

            ctrl.dispatchConfirmModal = function () {
                ctrl.dispatchClicked = true;
                if (ctrl.searchParams.patientId == null) {
                    return;
                }
                var modalInstance = $modal.open({
                    templateUrl: 'app/calendar/views/dispatch_confirmation_modal.html',
                    controller: 'DispatchConfirmModalController as dispatchConfirm',
                    size: 'med',
                    resolve: {
                        patientId: function () {
                            return ctrl.searchParams.patientId;
                        },
                        searchParams: function () {
                            return ctrl.prepareSearchCriteria();
                        }
                    }
                });
                modalInstance.result.then(function (selectedCareType) {
                    var dispatchObj = angular.copy(ctrl.searchParams);
                    dispatchObj.careTypeId = selectedCareType;
                    toastr.success("Dispatch creation is in progress...", null, {timeOut: 100000});
                    DispatchDAO.save(dispatchObj).then(function (res) {
                        toastr.clear();
                        toastr.success("Dispatch message has been sent to all filtered employees.");
                    }).catch(function (data) {
                        toastr.clear();
                        toastr.error(data.data);
                    });
                }, function () {
                });
            };
        }
        ctrl.retrieveAllPatients();
    }

    angular.module('xenon.controllers').controller('CalendarCtrl', ["Page", "EmployeeDAO", "$rootScope", "PositionDAO", "$debounce", "PatientDAO", "EventTypeDAO", "CareTypeDAO", "$modal", "$filter", "$timeout", "$state", "$stateParams", "DispatchDAO", "WorksiteDAO", "$scope", "$formService", CalendarCtrl]);
})();
