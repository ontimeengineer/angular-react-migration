'use strict';

angular.module('xenon.services', []).
        service('$menuItems', function ()
        {
            this.menuItems = [];

            var $menuItemsRef = this;

            var menuItemObj = {
                parent: null,
                title: '',
                link: '', // starting with "./" will refer to parent link concatenation
                state: '', // will be generated from link automatically where "/" (forward slashes) are replaced with "."
                icon: '',
                isActive: false,
                label: null,
                feature: '',
                menuItems: [],
                setLabel: function (label, color, hideWhenCollapsed)
                {
                    if (typeof hideWhenCollapsed == 'undefined')
                        hideWhenCollapsed = true;

                    this.label = {
                        text: label,
                        classname: color,
                        collapsedHide: hideWhenCollapsed
                    };

                    return this;
                },
                removeLabel: function () {
                    this.label = null;
                    return this;
                },
                addItem: function (title, link, feature, icon)
                {
                    var parent = this,
                            item = angular.extend(angular.copy(menuItemObj), {
                                parent: parent,
                                title: title,
                                link: link,
                                icon: icon,
                                feature: feature,
                            });

                    if (item.link)
                    {
                        if (item.link.match(/^\./))
                            item.link = parent.link + item.link.substring(1, link.length);

                        if (item.link.match(/^-/))
                            item.link = parent.link + '-' + item.link.substring(2, link.length);

                        item.state = $menuItemsRef.toStatePath(item.link);
                    }

                    this.menuItems.push(item);

                    return item;
                }
            };

            this.addItem = function (title, link, icon, feature)
            {
                var item = angular.extend(angular.copy(menuItemObj), {
                    title: title,
                    link: link,
                    state: this.toStatePath(link),
                    icon: icon,
                    feature: feature,
                });

                this.menuItems.push(item);

                return item;
            };

            this.getAll = function ()
            {
                return this.menuItems;
            };

            this.getItemByTitle = function(title, items = this.menuItems) {
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    if (item.title === title) {
                        return item;
                    }
                    if (item.menuItems && item.menuItems.length > 0) {
                        var found = this.getItemByTitle(title, item.menuItems);
                        if (found) {
                            return found;
                        }
                    }
                }
                return undefined;
            };            

            this.prepareSidebarMenu = function ()
            {
                var dashboard = this.addItem('Dashboard', '/app/dashboard', 'fa-home');
                var employee = this.addItem('Employee', '/app', 'linecons-cog', 'CREATE_EMPLOYEE,VIEW_EMPLOYEE');
                var patient = this.addItem('Patient', '/app', 'linecons-user', 'CREATE_PATIENT,VIEW_PATIENT');
                var timeSheet = this.addItem('Time Sheet', '/app', 'linecons-clock', 
                'VIEW_EMPLOYEE_TIMESHEET,CREATE_MANUAL_PUNCH,VIEW_DAILY_ATTENDANCE,VIEW_PATIENT_TIMESHEET,WORKSITE_TIMESHEET');
                var insuranceProvider = this.addItem('Payer', '/app', 'fa fa-umbrella', 'CREATE_INSURANCE_PROVIDER,VIEW_INSURANCE_PROVIDER');
                var billing = this.addItem('Billing', '/app', 'linecons-money', 
                'VIEW_BILLING_SESSION,VIEW_BILLING_HISTORY,CREATE_BILLING_SETTING,CREATE_MANUAL_CLAIM,MANAGE_BILLING_RECONCILIATION');
                var payroll = this.addItem('Payroll', '/app', 'linecons-wallet', 'VIEW_PAYROLL_HISTORY,VIEW_PAYROLL_SESSION,VIEW_PAYROLL_SETTINGS');
                var calendar = this.addItem('Schedule', '/app', 'linecons-cog', 
                'VIEW_COORDINATOR_SCHEDULE,VIEW_EMPLOYEE_SCHEDULE,VIEW_PATIENT_SCHEDULE,WORKSITE_SCHEDULE,SEARCH_EMPLOYEE,VIEW_DISPATCH');
                var forms = this.addItem('Forms', '/app', 'linecons-database', 'VIEW_FORMS');
                var report = this.addItem('Reports', '/app/report', 'fa-eye', 'VIEW_REPORTS');
                // Subitems of Dashboard
                // dashboard.addItem('Dashboard 1', 	'-/variant-1'); // "-/" will append parents link

                // Subitems of employee
                employee.addItem('Add Employee', './employee/tab1/', 'CREATE_EMPLOYEE');
                employee.addItem('View Employee', './employee-list/active', 'VIEW_EMPLOYEE');
                employee.addItem('View Applications', './application-list/in-progress', 'VIEW_APPLICATION_LIST');


                // Subitems of patient
                patient.addItem('Add Patient', './patient/tab1/', 'CREATE_PATIENT');
                patient.addItem('View Patient', './patient-list/active', 'VIEW_PATIENT');
                patient.addItem('Patient Records', './patient_records', 'VIEW_PATIENT');


                // Subitems of timeSheet
                timeSheet.addItem('Employee Timesheet', './employee_timesheet', 'VIEW_EMPLOYEE_TIMESHEET');
                // timeSheet.addItem('Edit Timesheet', 			'./edit_timesheet');
                timeSheet.addItem('Manual Punch', './manual_punch', 'CREATE_MANUAL_PUNCH');
                timeSheet.addItem('Daily Attendance', './daily_attendance', 'VIEW_DAILY_ATTENDANCE');
                timeSheet.addItem('Patient Timesheet', './patient_time_sheet', 'VIEW_PATIENT_TIMESHEET');
                timeSheet.addItem('Worksite Timesheet', './worksite_time_sheet', 'WORKSITE_TIMESHEET');

                // Subitems of insuranceProvider
                insuranceProvider.addItem('Add Payer', './insurer/', 'CREATE_INSURANCE_PROVIDER');
                insuranceProvider.addItem('View Payer', './insurer-list', 'VIEW_INSURANCE_PROVIDER');

                // Subitems of billing
                billing.addItem('Billing Session', './billing_session', 'VIEW_BILLING_SESSION');
                billing.addItem('Billing History', './biling_history', 'VIEW_BILLING_HISTORY');
                billing.addItem('Billing Setting', './biling_setting', 'CREATE_BILLING_SETTING');
                billing.addItem('Search Claim', './claim_search', 'VIEW_BILLING_HISTORY');
                billing.addItem('EDI Reader', './bill_reader', 'EDI_DATA_READER');
                billing.addItem('Billing Reconciliation', './billing_reconciliation', 'MANAGE_BILLING_RECONCILIATION');
                billing.addItem('Manual Claim 1500', './manual_claim', 'CREATE_MANUAL_CLAIM');
                billing.addItem('Manual Claim UB04', './manual_claim_ub04', 'CREATE_MANUAL_CLAIM');

                // Subitems of payroll
                // payroll.addItem('Pay Rates', 			'./pay_rates');
                payroll.addItem('Payroll History', './payroll_history', 'VIEW_PAYROLL_HISTORY');
                // payroll.addItem('Payroll Review', 			'./payroll_review');
                payroll.addItem('Payroll Session', './payroll_session', 'VIEW_PAYROLL_SESSION');
                payroll.addItem('Payroll Settings', './payroll_settings', 'VIEW_PAYROLL_SETTINGS');


                // Subitems of calendar
                calendar.addItem('Employee', './employee-calendar/', 'VIEW_EMPLOYEE_SCHEDULE');
                calendar.addItem('Patient', './patient-calendar/', 'VIEW_PATIENT_SCHEDULE');
                calendar.addItem('Coordinator', './coordinator-calendar/', 'VIEW_COORDINATOR_SCHEDULE');
                calendar.addItem('Worksite', './worksite-schedule/', 'WORKSITE_SCHEDULE');
                calendar.addItem('Search Employee', './search-employee-calendar/', 'SEARCH_EMPLOYEE');
                calendar.addItem('View Dispatch', './dispatch-list/active', 'VIEW_DISPATCH');

                // Subitems of Forms
                forms.addItem('Complaints', './complaints/open', 'CREATE_COMPLAINT');
                forms.addItem('Satisfaction Survey', './satisfaction-survey', 'CREATE_SURVEY');
                forms.addItem('Forms Setting', './forms-setting', 'VIEW_ALL_COMPLAINTS')

                return this;
            };

            this.prepareHorizontalMenu = function ()
            {
                var dashboard = this.addItem('Dashboard', '/app/dashboard-variant-1', 'fa-home');
                var employee = this.addItem('Employee', '/app', 'linecons-cog');
                var patient = this.addItem('Patient', '/app', 'linecons-user');
                var timeSheet = this.addItem('Time Sheet', '/app', 'linecons-clock');
                var insuranceProvider = this.addItem('Payer', '/app', 'fa fa-umbrella');
                var billing = this.addItem('Billing', '/app', 'linecons-user');
                var calendar = this.addItem('Calendar', '/app', 'linecons-user');
                var report = this.addItem('Reports', '/app/report-variant-1', 'fa-eye');

                // var dashboard    = this.addItem('Dashboard', 		'/app/dashboard', 			'linecons-cog');
                // var employee      = this.addItem('Employee',	'/app/layout-and-skins',	'linecons-desktop');
                // var patient  = this.addItem('Patient', 		'/app/patient', 					'linecons-note');
                // var timeSheet  	 = this.addItem('Time Sheet', 			'/app/timeSheet', 			'linecons-star');
                // var insuranceProvider  	 = this.addItem('Payer', 			'/app/mailbox', 			'linecons-mail').setLabel('5', 'secondary', false);
                // var billing  	 = this.addItem('Billing', 			'/app/tables', 				'linecons-database');


                // Subitems of employee
                employee.addItem('Add Employee', './employee/tab1');
//				employee.addItem('Add Employee', 				'./add_employee_tab_2');
//				employee.addItem('Add Employee', 				'./add_employee_tab_3');
                employee.addItem('View Employee', './view_employee');
                employee.addItem('View Applications', './application-list/in-progress');


                // Subitems of patient
                patient.addItem('Add Patient', './patient/tab1');
                patient.addItem('View Patient', './view_patient_tab_1');
                patient.addItem('Patient Records', './patient_records', 'VIEW_PATIENT');



                // Subitems of timeSheet
                timeSheet.addItem('Edit Timesheet', './edit_timesheet');


                // Subitems of insuranceProvider
                insuranceProvider.addItem('Add Payer', './add_inusrer');
                insuranceProvider.addItem('View Payer', './view_insurer');

                // Subitems of billing
                billing.addItem('Billing Session', './billing_tab_1');
                billing.addItem('Billing History', './biling_history');
                billing.addItem('Search Claim', './claim_search');

                // Subitems of calendar
                calendar.addItem('Employee', './employee_calendar');
                calendar.addItem('Patient', './patient_calendar');
                calendar.addItem('Search Employee', './search-employee-calendar');
                calendar.addItem('View Dispatch', './dispatch-list/');

                return this;
            }

            this.prepareAdminMenu = function ()
            {
//                var dashboard = this.addItem('Dashboard', '/admin/dashboard', 'fa-home');
                var users = this.addItem('Users', '/admin', 'linecons-user', 'CREATE_USER,EDIT_USER,VIEW_USER');
                var worksite = this.addItem('Worksites', '/admin', 'fa-building', 'CREATE_WORKSITE,EDIT_WORKSITE,VIEW_WORKSITE');
                var benefits = this.addItem('Benefits', '/admin', 'fa-usd', 'CREATE_BENEFIT,EDIT_BENEFIT,VIEW_BENEFIT,EMPLOYEE_BENEFIT_ADJUSTMENT');
                var roles = this.addItem('Roles', '/admin/role-list', 'fa-tasks', 'CREATE_ROLE,EDIT_ROLE,VIEW_ROLE');
                var positions = this.addItem('Positions', '/admin/position-list', 'fa-user-md', 'CREATE_POSITION,EDIT_POSITION,VIEW_POSITION');
                var services = this.addItem('Services', '/admin', 'fa-wrench', 'VIEW_CONSENTS_TYPES,VIEW_CARETYPE');
                var languages = this.addItem('Languages', './admin/language-list', 'fa-language', 'UPDATE_LANGUAGE,VIEW_LANGUAGE');
                var tasks = this.addItem('Tasks', './admin/task-list', 'fa-tasks', 'CREATE_TASK,UPDATE_TASK,VIEW_TASK');
                var events = this.addItem('Event Notifications', '/admin/event-notifications', 'fa-envelope', 'EVENT_NOTIFICATIONS');
//                var security = this.addItem('Security', '/admin', 'linecons-lock');
                var documents = this.addItem('Document Library', '/admin/document-library', 'fa-file', 'MANAGE_DOCUMENTS');
                var company = this.addItem('Company', '/admin/company_information', 'linecons-key', 'CREATE_COMPANY_INFORMATION');

                // Subitems of users
                users.addItem('Add User', './user/', 'CREATE_USER');
                users.addItem('View Users', './user-list/active', 'VIEW_USER');
                
                // Subitems of worksites
                worksite.addItem('Add Worksite', './worksite/tab1/', 'CREATE_WORKSITE');
                worksite.addItem('View Worksite', './worksite-list/active', 'VIEW_WORKSITE');
                
                // Subitems of benefits
                benefits.addItem('Add Benefit', './benefits/', 'CREATE_BENEFIT');
                benefits.addItem('View Benefit', './benefits', 'VIEW_BENEFIT');
                benefits.addItem('Benefit Adjustments', './employee-adjustments/active', 'EMPLOYEE_BENEFIT_ADJUSTMENT');
                benefits.addItem('Benefit Payouts', './benifit-payouts/active', 'EMPLOYEE_BENEFIT_PAYOUT');

                // Subitems of Services
                services.addItem('Care Types', '/admin/caretype-list', 'CREATE_CARETYPE,UPDATE_CARETYPE,VIEW_CARETYPE');
                services.addItem('Consents Types', '/admin/consents-list', 'VIEW_CONSENTS_TYPES,MANAGE_CONSENTS_TYPES'); 
                // Subitems of company
//                company.addItem('Company Information', './company_information', 'CREATE_COMPANY_INFORMATION');


//                security.addItem('Manage Role', './manage_role')
//                security.addItem('Manage Access', './manage_access')
                return this;
            }

            this.instantiate = function ()
            {
                return angular.copy(this);
            }

            this.toStatePath = function (path)
            {
                return path.replace(/\//g, '.').replace(/^\./, '');
            };

            this.setActive = function (path)
            {
                this.iterateCheck(this.menuItems, this.toStatePath(path));
            };

            this.setActiveParent = function (item)
            {
                item.isActive = true;
                item.isOpen = true;

                if (item.parent)
                    this.setActiveParent(item.parent);
            };

            this.iterateCheck = function (menuItems, currentState)
            {
                angular.forEach(menuItems, function (item)
                {
                    if (item.state == currentState)
                    {
                        item.isActive = true;

                        if (item.parent != null)
                            $menuItemsRef.setActiveParent(item.parent);
                    }
                    else if (item.state.substr(0, item.state.length - 1) == currentState.substr(0, currentState.length - 1))
                    { // set tab1 is active when visiting tab2, tab3 
                        item.isActive = true;

                        if (item.parent != null)
                            $menuItemsRef.setActiveParent(item.parent);
                    }
                    else
                    {
                        item.isActive = false;
                        item.isOpen = false;

                        if (item.menuItems.length)
                        {
                            $menuItemsRef.iterateCheck(item.menuItems, currentState);
                        }
                    }
                });
            };
        })
        .service('$formService', function () {
            this.setRadioValues = function (name, newVal) {
                $("input[name='" + name + "'][value='" + newVal + "']").attr('checked', 'checked');
                $("input[name='" + name + "'][value='" + newVal + "']").parent().parent().addClass('cbr-checked');
            };

            this.uncheckRadioValue = function (name, newVal) {
                $("input[name='" + name + "'][value='" + newVal + "']").removeAttr('checked');
                $("input[name='" + name + "'][value='" + newVal + "']").parent().parent().removeClass('cbr-checked');
            };
            this.uncheckCheckboxValue = function (name) {
                $("input[name='" + name + "']").removeAttr('checked');
                $("input[name='" + name + "']").parent().parent().removeClass('cbr-checked');
            };

            this.resetRadios = function () {
                setTimeout(function () {
                    cbr_replace();
                }, 100);
            }
        });
