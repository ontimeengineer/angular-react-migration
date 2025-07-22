'use strict';

angular.module('xenon.controllers', []).
        controller('LoginCtrl', function ($scope, $rootScope)
        {
            $rootScope.isLoginPage = true;
            $rootScope.isLightLoginPage = false;
            $rootScope.isLockscreenPage = false;
            $rootScope.isMainPage = false;
        }).
        controller('LoginLightCtrl', function ($scope, $rootScope)
        {
            $rootScope.isLoginPage = true;
            $rootScope.isLightLoginPage = true;
            $rootScope.isLockscreenPage = false;
            $rootScope.isMainPage = false;
        }).
        controller('LockscreenCtrl', function ($scope, $rootScope)
        {
            $rootScope.isLoginPage = false;
            $rootScope.isLightLoginPage = false;
            $rootScope.isLockscreenPage = true;
            $rootScope.isMainPage = false;
        }).
        controller('MainCtrl', function ($scope, $rootScope, $location, $layout, $layoutToggles, $pageLoadingBar, Fullscreen, $modal, Idle, $state, $document, UserDAO, FormsDAO,  $timeout, $sce)
        {
            $rootScope.removeNullKeys = function (obj) {
                for (var propName in obj) {
                    if (obj[propName] === null || obj[propName] === undefined) {
                        delete obj[propName];
                    }
                }
            }

            var userName = getCookie("un");
            var firstName = getCookie("fn")
            var lastName = getCookie("ln")

            if(userName != null){
                firstName = firstName !== null ? firstName : ''
                lastName = lastName !== null ? lastName : ''
                $rootScope.currentUser = { userName, firstName, lastName };
                $rootScope.startIdle();
            }

            $rootScope.hasAccess = function (key) {
                if (key != null) {
                    var keys = key.split(",");
                    if ($rootScope.currentUser.allowedFeature != null) {
                        for (var i = 0; i < keys.length; i++) {
                            if ($rootScope.currentUser.allowedFeature.indexOf(keys[i]) >= 0) {
                                return true;
                            }
                        }
                    }
                    return false;
                } else {
                    return true;
                }
            };

            $rootScope.sanitizeHtml = function (htmlContent) {
                return $sce.trustAsHtml(htmlContent)//.replace(/\n/g, '<br>');
            };

            $rootScope.serverPath = ontime_data.weburl;
            $rootScope.validNumber = function (number) {
                return !isNaN(number);
            };
            $rootScope.languages = {"English": "English", "Creole": "Creole", "Spanish": "Spanish", "Russian": "Russian", "French": "French", "Hindi": "Hindi", "Bengali": "Bengali", "Mandarin": "Mandarin", "Korean": "Korean", "Arabic": "Arabic", "Farsi": "Farsi", "Urdu": "Urdu"};
            $rootScope.amazonPublicUrl = ontime_data.amazonPublicUrl;
            $rootScope.amazonSignatureUrl = ontime_data.amazonSignatureUrl;
            $rootScope.todayDate = new Date();
            $rootScope.isLoginPage = false;
            $rootScope.isLightLoginPage = false;
            $rootScope.isLockscreenPage = false;
            $rootScope.isMainPage = true;
            $rootScope.dateFormat = "MM/dd/yyyy";
            $rootScope.dateFormatForDay = "EEE";
            $rootScope.timeFormat = "hh:mm a";
            $rootScope.timeFormatWithoutAmPm = "hh:mm";
            $rootScope.momentDateFormat = "MM/DD/YYYY";
            $rootScope.timestampFormat = "YYYY/MM/DD hh:mm:ss a";
            $rootScope.validFileTypes = ["bmp", "png", "jpg", "jpeg", "gif", "txt", "xls", "xlsx", "doc", "docx", "pdf", "csv"];
            $rootScope.validImageFileTypes = ["bmp", "png", "jpg", "jpeg", "gif"];

            $scope.showMenu = false;
            $rootScope.openResetPasswordModal = function (modal_id, modal_size, modal_backdrop, changePassword)
            {

                if ($state.current.name != 'login') {
                    $rootScope.resetPasswordModal = $modal.open({
                        templateUrl: modal_id,
                        size: modal_size,
                        backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                        keyboard: false
                    });
                    $rootScope.resetPasswordModal.changePassword = changePassword;
                }
                $rootScope.resetPasswordModal.save = function () {
                    $timeout(function () {
                        if ($rootScope.resetPasswordModal.password != $rootScope.resetPasswordModal.confirmPassword) {
                            $rootScope.resetPasswordModal.passwordNotMatch = true;
                        } else {
                            $rootScope.resetPasswordModal.passwordNotMatch = false;
                        }

                        if ($("#reset_password_form")[0].checkValidity() && !$rootScope.resetPasswordModal.passwordNotMatch) {
                            $rootScope.maskLoading();
                            if ($rootScope.currentUser.userName == null) {
                                $rootScope.currentUser.userName = getCookie("un");
                            }
                            var objToSend = {username: $rootScope.currentUser.userName, password: $rootScope.resetPasswordModal.password};
                            if ($rootScope.resetPasswordModal.changePassword) {
                                objToSend.oldPassword = $rootScope.resetPasswordModal.oldPassword;
                            }
                            UserDAO.changePassword(objToSend).then(function (res) {
                                toastr.success("Password changed successfully.");
                                setCookie("changePassword", false, 7);
                                $rootScope.resetPasswordModal.close();
                            }).catch(function (data, status) {
                                if (data.data != null) {
                                    toastr.error(data.data);
                                } else {
                                    toastr.error("Password cannot be changed.");
                                    $rootScope.resetPasswordModal.close();
                                }
                            }).then(function () {
                                $rootScope.unmaskLoading();
                            });
                        }
                    });
                };
            };

            $scope.openMenu = function ($event) {
                $event.stopPropagation()
                if (!$scope.showMenu) {
                    var closeMe = function () {
                        $scope.showMenu = false;
                        $document.unbind('click', this);
                    };
                    $document.bind('click', function (event) {
                        $scope.$apply(function () {
                            closeMe($scope)
                        })
                    });
                    $scope.showMenu = true;
                } else {
                    $scope.showMenu = false;
                }
            };

            $rootScope.maskLoading = function () {
                $rootScope.maskLoadingRunning = true;
                $("#mainDiv").loadmask("");
            };
            $rootScope.unmaskLoading = function () {
                $rootScope.maskLoadingRunning = false;
                $("#mainDiv").unmask();
            };
            $rootScope.$watch('paginationLoading', function (newValue, oldValue)
            {
                if (newValue != oldValue)
                {
                    if (newValue == true)
                    {
                        $rootScope.maskLoading();
                    }
                    else
                    {
                        $rootScope.unmaskLoading();
                    }
                }
            });
            $rootScope.payrollRates = [{key: 'R1', value: "Rate 1"}, {key: 'R2', value: "Rate 2"}];
//            $rootScope.states = ['UT', 'TX', 'NY'];
//            $rootScope.positions = {
//                'pc': 'Personal Care',
//                'nc': 'Nursing Care',
//                'pt': 'PT',
//                'ot': 'OT',
//                'nut': 'NUT',
//                'a': 'Admin',
//                'mr': 'Market Rep.'
//            };
            var company_country = getCookie("company_country");
            if (company_country != null) {
                $rootScope.company_country = company_country;
                $rootScope.states = ontime_data.statesByCountry[$rootScope.company_country];
                $rootScope.terminologyBank = ontime_data.terminologyBank[$rootScope.company_country];
            } else {
                $rootScope.states = ontime_data.statesByCountry['US'];
                $rootScope.terminologyBank = ontime_data.terminologyBank['US'];
            }
            $rootScope.nyStateCountyList = ['Bronx', 'Kings', 'Nassau', 'New York', 'Putnam', 'Queens', 'Richmond', 'Rockland', 'Suffolk', 'Westchester', 'Orange'];
//            $rootScope.floridaStateCountyList= ['Alachua','Baker','Bay','Bradford','Brevard','Broward','Calhoun','Charlotte','Citrus','Clay','Collier','Columbia','DeSoto','Dixie','Duval','Escambia','Flagler','Franklin','Gadsden','Gilchrist','Glades','Gulf','Hamilton','Hardee','Hendry','Hernando','Highlands','Hillsborough','Holmes','Indian River','Jackson','Jefferson','Lafayette','Lake','Lee','Leon','Levy','Liberty','Madison','Miami-Dade','Manatee','Marion','Martin','Monroe','Nassau','Okaloosa','Okeechobee','Orange','Osceola','Palm Beach','Pasco','Pinellas','Polk','Putnam','St Johns','St Lucie','Santa Rosa','Sarasota','Seminole','Sumter','Suwannee','Taylor','Union','Volusia','Wakulla','Walton','Washington']
//            $rootScope.texasStateCountyList= ['Anderson County - Palestine','Andrews County - Andrews','Angelina County - Lufkin','Aransas County - Rockport','Archer County - Archer City','Armstrong County - Claude','Atascosa County - Jourdanton','Austin County - Bellville','Bailey County - Muleshoe','Bandera County - Bandera','Bastrop County - Bastrop','Baylor County - Seymour','Bee County - Beeville','Bell County - Belton','Bexar County - San Antonio','Blanco County - Johnson City','Borden County - Gail','Bosque County - Meridian','Bowie County - Boston','Brazoria County - Angleton','Brazos County - Bryan','Brewster County - Alpine','Briscoe County - Silverton','Brooks County - Falfurrias','Brown County - Brownwood','Burleson County - Caldwell','Burnet County - Burnet','Caldwell County - Lockhart','Calhoun County - Port Lavaca','Callahan County - Baird','Cameron County - Brownsville','Camp County - Pittsburg','Carson County - Panhandle','Cass County - Linden','Castro County - Dimmitt','Chambers County - Anahuac','Cherokee County - Rusk','Childress County - Childress','Clay County - Henrietta','Cochran County - Morton','Coke County - Robert Lee','Coleman County - Coleman','Collin County - McKinney','Collingsworth County - Wellington','Colorado County - Columbus','Comal County - New Braunfels','Comanche County - Comanche','Concho County - Paint Rock','Cooke County - Gainesville','Coryell County - Gatesville','Cottle County - Paducah','Crane County - Crane','Crockett County - Ozona','Crosby County - Crosbyton','Culberson County - Van Horn','Dallam County - Dalhart','Dallas County - Dallas','Dawson County - Lamesa','Deaf Smith County - Hereford','Delta County - Cooper','Denton County - Denton','DeWitt County - Cuero','Dickens County - Dickens','Dimmit County - Carrizo Springs','Donley County - Clarendon','Duval County - San Diego','Eastland County - Eastland','Ector County - Odessa','Edwards County - Rocksprings','El Paso County - El Paso','Ellis County - Waxahachie','Erath County - Stephenville','Falls County - Marlin','Fannin County - Bonham','Fayette County - La Grange','Fisher County - Roby','Floyd County - Floydada','Foard County - Crowell','Fort Bend County - Richmond','Franklin County - Mount Vernon','Freestone County - Fairfield','Frio County - Pearsall','Gaines County - Seminole','Galveston County - Galveston','Garza County - Post','Gillespie County - Fredericksburg','Glasscock County - Garden City','Goliad County - Goliad','Gonzales County - Gonzales','Gray County - Pampa','Grayson County - Sherman','Gregg County - Longview','Grimes County - Anderson','Guadalupe County - Seguin','Hale County - Plainview','Hall County - Memphis','Hamilton County - Hamilton','Hansford County - Spearman','Hardeman County - Quanah','Hardin County - Kountze','Harris County - Houston','Harrison County - Marshall','Hartley County - Channing','Haskell County - Haskell','Hays County - San Marcos','Hemphill County - Canadian','Henderson County - Athens','Hidalgo County - Edinburg','Hill County - Hillsboro','Hockley County - Levelland','Hood County - Granbury','Hopkins County - Sulphur Springs','Houston County - Crockett','Howard County - Big Spring','Hudspeth County - Sierra Blanca','Hunt County - Greenville','Hutchinson County - Stinnett','Irion County - Mertzon','Jack County - Jacksboro','Jackson County - Edna','Jasper County - Jasper','Jeff Davis County - Fort Davis','Jefferson County - Beaumont','Jim Hogg County - Hebbronville','Jim Wells County - Alice','Johnson County - Cleburne','Jones County - Anson	Karnes County - Karnes City','Kaufman County - Kaufman','Kendall County - Boerne','Kenedy County - Sarita','Kent County - Jayton','Kerr County - Kerrville','Kimble County - Junction','King County - Guthrie','Kinney County - Brackettville','Kleberg County - Kingsville','Knox County - Benjamin','La Salle County - Cotulla','Lamar County - Paris','Lamb County - Littlefield','Lampasas County - Lampasas','Lavaca County - Hallettsville','Lee County - Giddings','Leon County - Centerville','Liberty County - Liberty','Limestone County - Groesbeck','Lipscomb County - Lipscomb','Live Oak County - George West','Llano County - Llano','Loving County - Mentone','Lubbock County - Lubbock','Lynn County - Tahoka','Madison County - Madisonville','Marion County - Jefferson','Martin County - Stanton','Mason County - Mason','Matagorda County - Bay City','Maverick County - Eagle Pass','McCulloch County - Brady','McLennan County - Waco','McMullen County - Tilden','Medina County - Hondo','Menard County - Menard','Midland County - Midland','Milam County - Cameron','Mills County - Goldthwaite','Mitchell County - Colorado City','Montague County - Montague','Montgomery County - Conroe','Moore County - Dumas','Morris County - Daingerfield','Motley County - Matador','Nacogdoches County - Nacogdoches','Navarro County - Corsicana','Newton County - Newton','Nolan County - Sweetwater','Nueces County - Corpus Christi','Ochiltree County - Perryton','Oldham County - Vega','Orange County - Orange','Palo Pinto County - Palo Pinto','Panola County - Carthage','Parker County - Weatherford','Parmer County - Farwell','Pecos County - Fort Stockton','Polk County - Livingston','Potter County - Amarillo','Presidio County - Marfa','Rains County - Emory','Randall County - Canyon','Reagan County - Big Lake','Real County - Leakey','Red River County - Clarksville','Reeves County - Pecos','Refugio County - Refugio','Roberts County - Miami','Robertson County - Franklin','Rockwall County - Rockwall','Runnels County - Ballinger','Rusk County - Henderson','Sabine County - Hemphill','San Augustine County - San Augustine','San Jacinto County - Coldspring','San Patricio County - Sinton','San Saba County - San Saba','Schleicher County - Eldorado','Scurry County - Snyder','Shackelford County - Albany','Shelby County - Center','Sherman County - Stratford','Smith County - Tyler','Somervell County - Glen Rose','Starr County - Rio Grande City','Stephens County - Breckenridge','Sterling County - Sterling City','Stonewall County - Aspermont','Sutton County - Sonora','Swisher County - Tulia','Tarrant County - Fort Worth','Taylor County - Abilene','Terrell County - Sanderson','Terry County - Brownfield','Throckmorton County - Throckmorton','Titus County - Mount Pleasant','Tom Green County - San Angelo','Travis County - Austin','Trinity County - Groveton','Tyler County - Woodville','Upshur County - Gilmer','Upton County - Rankin','Uvalde County - Uvalde','Val Verde County - Del Rio','Van Zandt County - Canton','Victoria County - Victoria','Walker County - Huntsville','Waller County - Hempstead','Ward County - Monahans','Washington County - Brenham','Webb County - Laredo','Wharton County - Wharton','Wheeler County - Wheeler','Wichita County - Wichita Falls','Wilbarger County - Vernon','Willacy County - Raymondville','Williamson County - Georgetown','Wilson County - Floresville','Winkler County - Kermit','Wise County - Decatur','Wood County - Quitman','Yoakum County - Plains','Young County - Graham','Zapata County - Zapata','Zavala County - Crystal City']
//            $rootScope.stateCountyList = {'NY': $rootScope.nyStateCountyList, 'FL':$rootScope.floridaStateCountyList, 'TX':$rootScope.texasStateCountyList};
//                    ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'];
            $rootScope.layoutOptions = {
                horizontalMenu: {
                    isVisible: false,
                    isFixed: true,
                    minimal: false,
                    clickToExpand: false,
                    isMenuOpenMobile: false
                },
                sidebar: {
                    isVisible: true,
                    isCollapsed: false,
                    toggleOthers: true,
                    isFixed: true,
                    isRight: false,
                    isMenuOpenMobile: false,
                    // Added in v1.3
                    userProfile: true
                },
                chat: {
                    isOpen: false,
                },
                settingsPane: {
                    isOpen: false,
                    useAnimation: true
                },
                container: {
                    isBoxed: false
                },
                skins: {
                    sidebarMenu: '',
                    horizontalMenu: '',
                    userInfoNavbar: ''
                },
                pageTitles: true,
                userInfoNavVisible: false
            };

            $layout.loadOptionsFromCookies(); // remove this line if you don't want to support cookies that remember layout changes


            $scope.updatePsScrollbars = function ()
            {
                var $scrollbars = jQuery(".ps-scrollbar:visible");

                $scrollbars.each(function (i, el)
                {
                    if (typeof jQuery(el).data('perfectScrollbar') == 'undefined')
                    {
                        jQuery(el).perfectScrollbar();
                    }
                    else
                    {
                        jQuery(el).perfectScrollbar('update');
                    }
                })
            };


            // Define Public Vars
            public_vars.$body = jQuery("body");


            // Init Layout Toggles
            $layoutToggles.initToggles();


            // Other methods
            $scope.setFocusOnSearchField = function ()
            {
                public_vars.$body.find('.search-form input[name="s"]').focus();

                setTimeout(function () {
                    public_vars.$body.find('.search-form input[name="s"]').focus()
                }, 100);
            };

            
            // Watch changes to replace checkboxes
            $scope.$watch(function ()
            {
//                cbr_replace();
//                if (!$("input[type='radio']").parent().find("span").length) {
//                    $("input[type='radio']").parent().append("<span class='radio_overlay'></span>");
//                }
            });

            // Watch sidebar status to remove the psScrollbar
            $rootScope.$watch('layoutOptions.sidebar.isCollapsed', function (newValue, oldValue)
            {
                if (newValue != oldValue)
                {
                    if (newValue == true)
                    {
                        public_vars.$sidebarMenu.find('.sidebar-menu-inner').perfectScrollbar('destroy')
                    }
                    else
                    {
                        public_vars.$sidebarMenu.find('.sidebar-menu-inner').perfectScrollbar({wheelPropagation: public_vars.wheelPropagation});
                    }
                }
            });


            // Page Loading Progress (remove/comment this line to disable it)
            $pageLoadingBar.init();

            $scope.showLoadingBar = showLoadingBar;
            $scope.hideLoadingBar = hideLoadingBar;


            // Set Scroll to 0 When page is changed
            $rootScope.$on('$stateChangeStart', function ()
            {
                var obj = {pos: jQuery(window).scrollTop()};

                TweenLite.to(obj, .25, {pos: 0, ease: Power4.easeOut, onUpdate: function ()
                    {
                        $(window).scrollTop(obj.pos);
                    }});
            });


            // Full screen feature added in v1.3
            $scope.isFullscreenSupported = Fullscreen.isSupported();
            $scope.isFullscreen = Fullscreen.isEnabled() ? true : false;

            $scope.goFullscreen = function ()
            {
                if (Fullscreen.isEnabled())
                    Fullscreen.cancel();
                else
                    Fullscreen.all();

                $scope.isFullscreen = Fullscreen.isEnabled() ? true : false;
            }

        }).
        controller('SidebarMenuCtrl', function ($scope, $rootScope, $menuItems, $timeout, $location, $state, FormsDAO, CompanyDAO, $layout)
        {

            // Menu Items
            var $sidebarMenuItems = $menuItems.instantiate();

            $scope.menuItems = $sidebarMenuItems.prepareSidebarMenu().getAll();

            $rootScope.getSidebarMenuItems = function () {
                return $sidebarMenuItems;
            }

            FormsDAO.getComplaintStatistics().then(function (notifications) {
                var complaintMenuItem = $sidebarMenuItems.getItemByTitle('Complaints');
                if (complaintMenuItem != undefined && notifications != null && notifications.open > 0) {
                    complaintMenuItem.setLabel(notifications.open, 'secondary')
                }
            });

            CompanyDAO.retrieveByCompanyCode({companyCode: ontime_data.company_code}).then(function (res) {
                $rootScope.currentUser.companyName = res.companyName; 
            })

            // Set Active Menu Item
            $sidebarMenuItems.setActive($location.path());
            var $sidebarAdminMenuItems = $menuItems.instantiate();
            $scope.adminMenuItems = $sidebarAdminMenuItems.prepareAdminMenu().getAll();
            $sidebarAdminMenuItems.setActive($state.current.name);

            $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams)
            {
                $sidebarMenuItems.setActive($state.current.name);
                //Show menu for all states. To be overrided by respective controllers.
                $rootScope.layoutOptions.sidebar.hideMenu = false;
                $sidebarAdminMenuItems.setActive($state.current.name);
            });

            // Trigger menu setup
            public_vars.$sidebarMenu = public_vars.$body.find('.sidebar-menu');
            $timeout(setup_sidebar_menu, 1);

            ps_init(); // perfect scrollbar for sidebar
        }).
        controller('HorizontalMenuCtrl', function ($scope, $rootScope, $menuItems, $timeout, $location, $state)
        {
            var $horizontalMenuItems = $menuItems.instantiate();

            $scope.menuItems = $horizontalMenuItems.prepareHorizontalMenu().getAll();

            // Set Active Menu Item
            $horizontalMenuItems.setActive($location.path());

            $rootScope.$on('$stateChangeSuccess', function ()
            {
                $horizontalMenuItems.setActive($state.current.name);

                $(".navbar.horizontal-menu .navbar-nav .hover").removeClass('hover'); // Close Submenus when item is selected
            });

            // Trigger menu setup
            $timeout(setup_horizontal_menu, 1);
        }).
        controller('SettingsPaneCtrl', function ($rootScope)
        {
            // Define Settings Pane Public Variable
            public_vars.$settingsPane = public_vars.$body.find('.settings-pane');
            public_vars.$settingsPaneIn = public_vars.$settingsPane.find('.settings-pane-inner');
        }).
        controller('ChatCtrl', function ($scope, $element)
        {
            var $chat = jQuery($element),
                    $chat_conv = $chat.find('.chat-conversation');

            $chat.find('.chat-inner').perfectScrollbar(); // perfect scrollbar for chat container


            // Chat Conversation Window (sample)
            $chat.on('click', '.chat-group a', function (ev)
            {
                ev.preventDefault();

                $chat_conv.toggleClass('is-open');

                if ($chat_conv.is(':visible'))
                {
                    $chat.find('.chat-inner').perfectScrollbar('update');
                    $chat_conv.find('textarea').autosize();
                }
            });

            $chat_conv.on('click', '.conversation-close', function (ev)
            {
                ev.preventDefault();

                $chat_conv.removeClass('is-open');
            });
        }).
        controller('UIModalsCtrl', function ($scope, $rootScope, $modal, $sce)
        {
            // Open Simple Modal
            $scope.openModal = function (modal_id, modal_size, modal_backdrop)
            {
                $rootScope.currentModal = $modal.open({
                    templateUrl: modal_id,
                    size: modal_size,
                    backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                    keyboard: false
                });
            };

            // Loading AJAX Content
            $scope.openAjaxModal = function (modal_id, url_location)
            {
                $rootScope.currentModal = $modal.open({
                    templateUrl: modal_id,
                    keyboard: false,
                    resolve: {
                        ajaxContent: function ($http)
                        {
                            return $http.get(url_location).then(function (response) {
                                $rootScope.modalContent = $sce.trustAsHtml(response.data);
                            }, function (response) {
                                $rootScope.modalContent = $sce.trustAsHtml('<div class="label label-danger">Cannot load ajax content! Please check the given url.</div>');
                            });
                        }
                    }
                });

                $rootScope.modalContent = $sce.trustAsHtml('Modal content is loading...');
            }
        }).
        controller('PaginationDemoCtrl', function ($scope)
        {
            $scope.totalItems = 64;
            $scope.currentPage = 4;

            $scope.setPage = function (pageNo)
            {
                $scope.currentPage = pageNo;
            };

            $scope.pageChanged = function ()
            {
                console.log('Page changed to: ' + $scope.currentPage);
            };

            $scope.maxSize = 5;
            $scope.bigTotalItems = 175;
            $scope.bigCurrentPage = 1;
        }).
        controller('LayoutVariantsCtrl', function ($scope, $layout, $cookies)
        {
            $scope.opts = {
                sidebarType: null,
                fixedSidebar: null,
                sidebarToggleOthers: null,
                sidebarVisible: null,
                sidebarPosition: null,
                horizontalVisible: null,
                fixedHorizontalMenu: null,
                horizontalOpenOnClick: null,
                minimalHorizontalMenu: null,
                sidebarProfile: null
            };

            $scope.sidebarTypes = [
                {value: ['sidebar.isCollapsed', false], text: 'Expanded', selected: $layout.is('sidebar.isCollapsed', false)},
                {value: ['sidebar.isCollapsed', true], text: 'Collapsed', selected: $layout.is('sidebar.isCollapsed', true)},
            ];

            $scope.fixedSidebar = [
                {value: ['sidebar.isFixed', true], text: 'Fixed', selected: $layout.is('sidebar.isFixed', true)},
                {value: ['sidebar.isFixed', false], text: 'Static', selected: $layout.is('sidebar.isFixed', false)},
            ];

            $scope.sidebarToggleOthers = [
                {value: ['sidebar.toggleOthers', true], text: 'Yes', selected: $layout.is('sidebar.toggleOthers', true)},
                {value: ['sidebar.toggleOthers', false], text: 'No', selected: $layout.is('sidebar.toggleOthers', false)},
            ];

            $scope.sidebarVisible = [
                {value: ['sidebar.isVisible', true], text: 'Visible', selected: $layout.is('sidebar.isVisible', true)},
                {value: ['sidebar.isVisible', false], text: 'Hidden', selected: $layout.is('sidebar.isVisible', false)},
            ];

            $scope.sidebarPosition = [
                {value: ['sidebar.isRight', false], text: 'Left', selected: $layout.is('sidebar.isRight', false)},
                {value: ['sidebar.isRight', true], text: 'Right', selected: $layout.is('sidebar.isRight', true)},
            ];

            $scope.horizontalVisible = [
                {value: ['horizontalMenu.isVisible', true], text: 'Visible', selected: $layout.is('horizontalMenu.isVisible', true)},
                {value: ['horizontalMenu.isVisible', false], text: 'Hidden', selected: $layout.is('horizontalMenu.isVisible', false)},
            ];

            $scope.fixedHorizontalMenu = [
                {value: ['horizontalMenu.isFixed', true], text: 'Fixed', selected: $layout.is('horizontalMenu.isFixed', true)},
                {value: ['horizontalMenu.isFixed', false], text: 'Static', selected: $layout.is('horizontalMenu.isFixed', false)},
            ];

            $scope.horizontalOpenOnClick = [
                {value: ['horizontalMenu.clickToExpand', false], text: 'No', selected: $layout.is('horizontalMenu.clickToExpand', false)},
                {value: ['horizontalMenu.clickToExpand', true], text: 'Yes', selected: $layout.is('horizontalMenu.clickToExpand', true)},
            ];

            $scope.minimalHorizontalMenu = [
                {value: ['horizontalMenu.minimal', false], text: 'No', selected: $layout.is('horizontalMenu.minimal', false)},
                {value: ['horizontalMenu.minimal', true], text: 'Yes', selected: $layout.is('horizontalMenu.minimal', true)},
            ];

            $scope.chatVisibility = [
                {value: ['chat.isOpen', false], text: 'No', selected: $layout.is('chat.isOpen', false)},
                {value: ['chat.isOpen', true], text: 'Yes', selected: $layout.is('chat.isOpen', true)},
            ];

            $scope.boxedContainer = [
                {value: ['container.isBoxed', false], text: 'No', selected: $layout.is('container.isBoxed', false)},
                {value: ['container.isBoxed', true], text: 'Yes', selected: $layout.is('container.isBoxed', true)},
            ];

            $scope.sidebarProfile = [
                {value: ['sidebar.userProfile', false], text: 'No', selected: $layout.is('sidebar.userProfile', false)},
                {value: ['sidebar.userProfile', true], text: 'Yes', selected: $layout.is('sidebar.userProfile', true)},
            ];

            $scope.resetOptions = function ()
            {
                $layout.resetCookies();
                window.location.reload();
            };

            var setValue = function (val)
            {
                if (val != null)
                {
                    val = eval(val);
                    $layout.setOptions(val[0], val[1]);
                }
            };

            $scope.$watch('opts.sidebarType', setValue);
            $scope.$watch('opts.fixedSidebar', setValue);
            $scope.$watch('opts.sidebarToggleOthers', setValue);
            $scope.$watch('opts.sidebarVisible', setValue);
            $scope.$watch('opts.sidebarPosition', setValue);

            $scope.$watch('opts.horizontalVisible', setValue);
            $scope.$watch('opts.fixedHorizontalMenu', setValue);
            $scope.$watch('opts.horizontalOpenOnClick', setValue);
            $scope.$watch('opts.minimalHorizontalMenu', setValue);

            $scope.$watch('opts.chatVisibility', setValue);

            $scope.$watch('opts.boxedContainer', setValue);

            $scope.$watch('opts.sidebarProfile', setValue);
        }).
        controller('ThemeSkinsCtrl', function ($scope, $layout)
        {
            var $body = jQuery("body");

            $scope.opts = {
                sidebarSkin: $layout.get('skins.sidebarMenu'),
                horizontalMenuSkin: $layout.get('skins.horizontalMenu'),
                userInfoNavbarSkin: $layout.get('skins.userInfoNavbar')
            };

            $scope.skins = [
                {value: '', name: 'Default', palette: ['#2c2e2f', '#EEEEEE', '#FFFFFF', '#68b828', '#27292a', '#323435']},
                {value: 'aero', name: 'Aero', palette: ['#558C89', '#ECECEA', '#FFFFFF', '#5F9A97', '#558C89', '#255E5b']},
                {value: 'navy', name: 'Navy', palette: ['#2c3e50', '#a7bfd6', '#FFFFFF', '#34495e', '#2c3e50', '#ff4e50']},
                {value: 'facebook', name: 'Facebook', palette: ['#3b5998', '#8b9dc3', '#FFFFFF', '#4160a0', '#3b5998', '#8b9dc3']},
                {value: 'turquoise', name: 'Truquoise', palette: ['#16a085', '#96ead9', '#FFFFFF', '#1daf92', '#16a085', '#0f7e68']},
                {value: 'lime', name: 'Lime', palette: ['#8cc657', '#ffffff', '#FFFFFF', '#95cd62', '#8cc657', '#70a93c']},
                {value: 'green', name: 'Green', palette: ['#27ae60', '#a2f9c7', '#FFFFFF', '#2fbd6b', '#27ae60', '#1c954f']},
                {value: 'purple', name: 'Purple', palette: ['#795b95', '#c2afd4', '#FFFFFF', '#795b95', '#27ae60', '#5f3d7e']},
                {value: 'white', name: 'White', palette: ['#FFFFFF', '#666666', '#95cd62', '#EEEEEE', '#95cd62', '#555555']},
                {value: 'concrete', name: 'Concrete', palette: ['#a8aba2', '#666666', '#a40f37', '#b8bbb3', '#a40f37', '#323232']},
                {value: 'watermelon', name: 'Watermelon', palette: ['#b63131', '#f7b2b2', '#FFFFFF', '#c03737', '#b63131', '#32932e']},
                {value: 'lemonade', name: 'Lemonade', palette: ['#f5c150', '#ffeec9', '#FFFFFF', '#ffcf67', '#f5c150', '#d9a940']},
            ];

            $scope.$watch('opts.sidebarSkin', function (val)
            {
                if (val != null)
                {
                    $layout.setOptions('skins.sidebarMenu', val);

                    $body.attr('class', $body.attr('class').replace(/\sskin-[a-z]+/)).addClass('skin-' + val);
                }
            });

            $scope.$watch('opts.horizontalMenuSkin', function (val)
            {
                if (val != null)
                {
                    $layout.setOptions('skins.horizontalMenu', val);

                    $body.attr('class', $body.attr('class').replace(/\shorizontal-menu-skin-[a-z]+/)).addClass('horizontal-menu-skin-' + val);
                }
            });

            $scope.$watch('opts.userInfoNavbarSkin', function (val)
            {
                if (val != null)
                {
                    $layout.setOptions('skins.userInfoNavbar', val);

                    $body.attr('class', $body.attr('class').replace(/\suser-info-navbar-skin-[a-z]+/)).addClass('user-info-navbar-skin-' + val);
                }
            });
        }).
        // Added in v1.3
        controller('FooterChatCtrl', function ($scope, $element)
        {
            $scope.isConversationVisible = false;

            $scope.toggleChatConversation = function ()
            {
                $scope.isConversationVisible = !$scope.isConversationVisible;

                if ($scope.isConversationVisible)
                {
                    setTimeout(function ()
                    {
                        var $el = $element.find('.ps-scrollbar');

                        if ($el.hasClass('ps-scroll-down'))
                        {
                            $el.scrollTop($el.prop('scrollHeight'));
                        }

                        $el.perfectScrollbar({
                            wheelPropagation: false
                        });

                        $element.find('.form-control').focus();

                    }, 300);
                }
            }
        });