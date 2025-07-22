(function () {
    function AddWorksiteCtrl($state, WorksiteDAO, $timeout, $scope, $rootScope, PositionDAO, Page, $formService, EmployeeDAO, InsurerDAO) {
        var ctrl = this;
        ctrl.currentDate = new Date();
        ctrl.retrivalRunning = true;
        ctrl.companyCode = ontime_data.company_code;
        ctrl.baseUrl = ontime_data.weburl;
        ctrl.stateCountyList = geo_data.stateCountyList;
        ctrl.stateCountyList['NY'] = $rootScope.nyStateCountyList;
        ctrl.nextTab;
        ctrl.worksite = {};
        ctrl.positions = [];
        ctrl.worksitePositionMap = {};
        ctrl.positionIdMap = {};
        ctrl.usTimezones = angular.copy(ontime_data.usTimezones);
        var allPositionIds = [];
        ctrl.insuranceProviderList = [];
        InsurerDAO.retrieveAll({'payerType':'WorksitePayer'}).then(function (res) {
            ctrl.insuranceProviderList = res;
        }).catch(function () {
            toastr.error("Failed to retrieve Payer list.");
        });
        if ($state.params.id && $state.params.id !== '') {
            if (isNaN(parseFloat($state.params.id)) || $rootScope.currentUser.allowedFeature.indexOf('EDIT_WORKSITE') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Update Worksite");
            ctrl.editMode = true;
        } else if ($state.current.name.indexOf('tab1') > -1) {
            if ($rootScope.currentUser.allowedFeature.indexOf('CREATE_WORKSITE') === -1) {
                $state.transitionTo(ontime_data.defaultState);
            }
            Page.setTitle("Add Worksite");
            ctrl.editMode = false;
        } else {
            $state.transitionTo(ontime_data.defaultState);
        }
        var form_data;
        //funcions
        ctrl.saveWorksite = saveWorksiteData;
        ctrl.pageInitCall = pageInit;
        ctrl.tab1DataInit = tab1DataInit;
        ctrl.tab2DataInit = tab2DataInit;
        ctrl.navigateToTab = navigateToTab;
        ctrl.resetWorksite = function () {
            ctrl.worksite.allPositions = null;
            ctrl.positions = [];
            $formService.uncheckCheckboxValue('allPositions');
            $("#employeeDropdown").select2("val", null);
            $timeout(function () {
                $('#Positions').multiSelect('deselect_all');
            }, 400);
        };
        ctrl.setFromNext = function (tab) {
            ctrl.nextTab = tab;
        };

        //check if form has been changed or not
        //If changed then it should be valid
        //function to navigate to different tab by state
        function navigateToTab(event, state) {
            // Don't propogate the event to the document
            if ($('#add_worksite_form').serialize() !== form_data) {
                ctrl.formDirty = true;
            }
            if (($('#add_worksite_form').valid()) || !ctrl.formDirty) {
                if (ctrl.editMode) {
                    $state.go('^.' + state, {id: $state.params.id});
                }
            }
            event.stopPropagation();   // W3C model
        }

        //function to save worksite data.
        function saveWorksiteData() {
            ctrl.formSubmitted = true;
            if ($('#add_worksite_form')[0].checkValidity() && ctrl.worksite.supervisorId != null) {
                var worksiteToSave = angular.copy(ctrl.worksite);
                if (ctrl.positions != null) {
                    if (ctrl.positions.indexOf(0) === -1) {
                        worksiteToSave.positionIds = ctrl.positions;
                    } else {
                        worksiteToSave.positionIds = allPositionIds;
                    }
                }
                var reqParam;
                if (ctrl.worksite.id && ctrl.worksite.id !== null) {
                    reqParam = 'update';
                } else {
                    ctrl.worksite.orgCode = ontime_data.company_code;
                    worksiteToSave.orgCode = ontime_data.company_code;
                    worksiteToSave.timezone = ontime_data.defaultTimezone;
                    reqParam = 'save';
                }

                $rootScope.maskLoading();
                WorksiteDAO.update({action: reqParam, data: worksiteToSave})
                        .then(function (res, status) {
                            if (!ctrl.worksite.id || ctrl.worksite.id === null) {
                                ctrl.editMode = true;
                            }
                            if ($rootScope.tabNo === 2) {
                                $state.go('admin.worksite-list', {status: "active"});
                            } else {
                                $state.go('^.' + ctrl.nextTab, {id: res.id});
                            }
                            ctrl.worksite = res;
                            toastr.success("Worksite saved.");
                            //Reset dirty status of form
                            if ($.fn.dirtyForms) {
                                $('form').dirtyForms('setClean');
                                $('.dirty').removeClass('dirty');
                            }
                        })
                        .catch(function (data) {
                            //exception logic
                            toastr.error("Worksite cannot be saved.");
                        }).then(function () {
                    $rootScope.unmaskLoading();
                });
            }
        }

        //function called on page initialization.
        function pageInit() {
            if (ctrl.editMode) {
                $rootScope.maskLoading();
                WorksiteDAO.get({id: $state.params.id}).then(function (res) {
                    ctrl.worksite = res;
                    $timeout(function () {
                        $("#employeeDropdown").select2("val", ctrl.worksite.supervisorId);
                    });
                    $formService.resetRadios();
                    ctrl.positions = res.positionIds;
                    ctrl.retrivalRunning = false;
                }).catch(function (data, status) {
                    showLoadingBar({
                        delay: .5,
                        pct: 100,
                        finish: function () {
                        }
                    }); // showLoadingBar
                    ctrl.retrivalRunning = false;
                    toastr.error("Failed to retrieve worksite");
                }).then(function () {
                    setTimeout(function () {
                        if ($.fn.dirtyForms) {
                            $('form').dirtyForms('setClean');
                            $('.dirty').removeClass('dirty');
                        }
                    }, 100);
                    $rootScope.unmaskLoading();
                });
            } else {
                $formService.resetRadios();
                ctrl.retrivalRunning = false;
            }
        }
        ctrl.retrieveAllEmployees = function () {
            EmployeeDAO.retrieveByPosition().then(function (res) {
                ctrl.employeeList = res;
                if (ctrl.worksite.supervisorId != null) {
                    $timeout(function () {
                        $("#employeeDropdown").select2("val", ctrl.worksite.supervisorId);
                    });
                }
            });
        };
        function tab1DataInit() {
            ctrl.formDirty = false;
            $("#add_worksite_form input:text, #add_worksite_form textarea, #add_worksite_form select").first().focus();
            //to set edit mode in tab change
            if (!$state.params.id || $state.params.id === '') {
                ctrl.editMode = false;
                ctrl.worksite = {};
            } else {
                ctrl.editMode = true;
            }
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    PositionDAO.retrieveAll({status: 'active'}).then(function (res) {
                        ctrl.positionList = res;
                        allPositionIds = [];
                        angular.forEach(ctrl.positionList, function (position) {
                            if (position.id)
                                allPositionIds.push(position.id);
                            ctrl.positionIdMap[position.id] = position;
                        });
                        if (arr_diff(allPositionIds, ctrl.positions).length === 0) {
                            ctrl.positions = [0];
                        }
                        $timeout(function () {
                            $('#Positions').multiSelect('refresh');
                            form_data = $('#add_worksite_form').serialize();
                        }, 400);
                    }).catch(function () {
                        form_data = $('#add_worksite_form').serialize();
                    });
                } else {
                    ctrl.tab1DataInit();
                }
            }, 100);
        }
        function tab2DataInit() {
            ctrl.formDirty = false;
            $("#add_worksite_form input:text, #add_worksite_form textarea, #add_worksite_form select").first().focus();
            $timeout(function () {
                if (!ctrl.retrivalRunning) {
                    googleMapFunctions(ctrl.worksite.locationLatitude, ctrl.worksite.locationLongitude);
                    form_data = $('#add_worksite_form').serialize();
                } else {
                    ctrl.tab2DataInit();
                }
            }, 100);
        }
        ctrl.retrieveAllEmployees();
        ctrl.pageInitCall();

        function arr_diff(a1, a2)
        {
            var a = [], diff = [];
            if (a1 != null && a2 != null) {
                for (var i = 0; i < a1.length; i++)
                    a[a1[i]] = true;
                for (var i = 0; i < a2.length; i++)
                    if (a[a2[i]])
                        delete a[a2[i]];
                    else
                        a[a2[i]] = true;
                for (var k in a)
                    diff.push(k);
            }
            return diff;
        }

        $scope.$watch(function () {
            return ctrl.positions;
        }, function (newValue, oldValue) {
            if (ctrl.positions && ctrl.positions.indexOf(0) !== -1) {
                ctrl.positions = [0];
            }
            $timeout(function () {
                $("#Positions").multiSelect('refresh');
            });

        }, true);
        ctrl.allpositionsChanged = function () {
            $timeout(function () {
                $("#Positions").multiSelect('refresh');
            });
        };
        function googleMapFunctions(latitude, longitude) {

            loadGoogleMaps(3).done(function ()
            {

                var map;
                var geocoder = new google.maps.Geocoder();



                var newyork;
                if (latitude && latitude !== null && longitude && longitude !== null) {
                    newyork = new google.maps.LatLng(latitude, longitude);
                } else {
                    newyork = new google.maps.LatLng(40.7127837, -74.00594);
                }

                var marker;

// Add a marker to the map and push to the array.
                function addMarker(location) {
                    marker.setPosition(location);
                }
                function initialize()
                {
                    var mapOptions = {
                        zoom: 12,
                        center: newyork
                    };

                    // Calculate Height
                    var el = document.getElementById('map-1'),
                            doc_height = $('#map-1').height();

                    // Adjust map height to fit the document contianer
                    el.style.height = doc_height + 'px';

                    map = new google.maps.Map(el, mapOptions);

                    marker = new google.maps.Marker({
                        position: newyork,
                        map: map,
                        draggable: true,
                    });

                    google.maps.event.addListener(marker, 'drag', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        ctrl.worksite.locationLatitude = event.latLng.lat();
                        ctrl.worksite.locationLongitude = event.latLng.lng();
                    });

                    google.maps.event.addListener(marker, 'dragend', function (event) {
                        $('#GPSLocation').val(event.latLng);
                        $('#GPSLocation').blur();
                        ctrl.worksite.locationLatitude = event.latLng.lat();
                        ctrl.worksite.locationLongitude = event.latLng.lng();
                    });

                    $('#GPSLocation').val(newyork);
                    form_data = $('#add_worksite_form').serialize();
                }

                initialize();
                $("#address-search").click(function (ev)
                {
                    ev.preventDefault();

                    // var $inp = $(this).find('.form-control'),
                    var address = $('#Search').val().trim();

                    // $inp.prev().find('i').addClass('fa-spinner fa-spin');

                    if (address.length != 0)
                    {
                        geocoder.geocode({'address': address}, function (results, status)
                        {
                            // $inp.prev().find('i').removeClass('fa-spinner fa-spin');

                            if (status == google.maps.GeocoderStatus.OK)
                            {
                                $('#GPSLocation').val(results[0].geometry.location);
                                $('#GPSLocation').blur();
                                ctrl.worksite.locationLatitude = results[0].geometry.location.lat();
                                ctrl.worksite.locationLongitude = results[0].geometry.location.lng()
                                map.setCenter(results[0].geometry.location);
                                addMarker(results[0].geometry.location);
                            } else {
                                alert('Geocode was not successful for the following reason: ' + status);
                            }
                        });
                    }
                });
            });
        }
    }
    angular.module('xenon.controllers').controller('AddWorksiteCtrl', ["$state", "WorksiteDAO", "$timeout", "$scope", "$rootScope", "PositionDAO", "Page", "$formService", "EmployeeDAO", "InsurerDAO", AddWorksiteCtrl]);
})();
