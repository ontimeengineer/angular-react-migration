import angular from 'angular';
import loginCtrlr from './login.controller';
import './common/factory'
import { ontime_data } from './common/ontime_data';

// Annotated function for route config
const setupRoutes = ($stateProvider) => {
    $stateProvider
        .state('home', {
            url: '/',
            resolve: {
                comments: ['CommentService', (CommentService) => CommentService.queryComments()],
                authors: ['AuthorService', (AuthorService) => AuthorService.queryAuthors()],
            },
            controllerAs: '$ctrl',
            controller: ['comments', function (comments) {
                this.comments = comments;
            }],
            template: `
                <h3>Hello World!</h3>
                <comment-list comments="$ctrl.comments"></comment-list>
            `,
        })
        .state('login', {
            url: '/login',
            templateUrl: 'app/tpls/login.html',
            controller: 'loginCtrlr',
        });
};
setupRoutes.$inject = ['$stateProvider'];

const enableHtml5Mode = ($locationProvider) => {
    $locationProvider.html5Mode({ enabled: true });
};
enableHtml5Mode.$inject = ['$locationProvider'];

const app = angular.module('xenon-app', [
    require('angular-ui-router'),
    require('./services/CommentService').name,
    require('./services/AuthorService').name,
    require('./components/CommentList').name,
    'xenon.factory'
]);

app.controller('loginCtrlr', loginCtrlr);

app.config(enableHtml5Mode).config(setupRoutes);

app.run(($rootScope, $modal, $state, Idle, $http) => {
    // Page Loading Overlay
    public_vars.$pageLoadingOverlay = jQuery('.page-loading-overlay');
    jQuery(window).on('load', () => {
        public_vars.$pageLoadingOverlay.addClass('loaded');
    });

    $rootScope.started = false;

    const closeModals = () => {
        if ($rootScope.warning) {
            $rootScope.warning.close();
            $rootScope.warning = null;
        }
    };

    $rootScope.$on('IdleStart', () => {
        closeModals();
        $rootScope.warning = $modal.open({
            templateUrl: 'warning-dialog.html',
            windowClass: 'modal-danger',
            keyboard: false
        });
    });

    $rootScope.$on('IdleTimeout', () => {
        closeModals();
        $rootScope.logout();
        Idle.unwatch();
    });

    $rootScope.startIdle = () => {
        closeModals();
        Idle.watch();
        $rootScope.started = true;
    };

    $rootScope.stopIdle = () => {
        closeModals();
        Idle.unwatch();
        $rootScope.started = false;
    };

    $rootScope.$on('IdleEnd', () => {
        closeModals();
    });

    $rootScope.logout = () => {
        $http.get(`${ontime_data.weburl}logout`).then(() => {
            delete_cookie("cc");
            delete_cookie("token");
            delete_cookie("un");
            delete_cookie("company_country");
            $rootScope.stopIdle();
            window.location.hash = '#/app/login';
            $rootScope.isFormDirty = false;
        });
    };

    $rootScope.$on('$stateChangeStart', (event, toState, toParams) => {
        $("[role=dialog]").each(function () {
            if ($(this).css('display') === 'block') {
                $(this).hide();
            }
        });

        if (!['login', 'forgotpassword'].some(k => toState.url.includes(k)) &&
            !toState.name.includes("applications") &&
            !toState.name.includes(ontime_data.defaultState)) {
            const token = getCookie("token");
            if (!token) {
                event.preventDefault();
                $state.transitionTo(ontime_data.defaultState);
            }
        }

        const lastPage = toParams.lastPage;
        const keys = {
            daily_attendance: 'dailyAttendanceSearchParams',
            worksite_time_sheet: 'worksiteSearchParams',
            employee_timesheet: 'employeeTimesheetSearchParams',
            patient_time_sheet: 'patientTimesheetSearchParams'
        };

        Object.entries(keys).forEach(([key, storageKey]) => {
            if (lastPage) {
                if (lastPage !== key) {
                    localStorage.removeItem(storageKey);
                }
            } else {
                if (!toState.url.includes(key)) {
                    localStorage.removeItem(storageKey);
                }
            }
        });

        $rootScope.paginationLoading = false;
        $rootScope.tabNo = toState.data.tabNo;
    });

    $rootScope.$on('$locationChangeStart', (event, newUrl, oldUrl) => {
        const pattern = /(#\/app)\/([^\/]+)[$|\/]?/;
        if (!newUrl.includes('/login') && !oldUrl.includes('/login')) {
            const newSubUrl = pattern.exec(newUrl)[2];
            const oldSubUrl = pattern.exec(oldUrl)[2];

            if (newSubUrl && oldSubUrl && newSubUrl !== oldSubUrl && $.fn.dirtyForms) {
                if ($('form').dirtyForms('isDirty') || $rootScope.isFormDirty) {
                    const proceed = confirm("You've made changes on this page which aren't saved. If you leave you will lose these changes.\n\nAre you sure you want to leave this page?");
                    if (!proceed) {
                        event.preventDefault();
                    } else {
                        $rootScope.isFormDirty = false;
                    }
                }
            }
        }
    });

    const includedStatesForDirtyCheck = [
        'app.patient.tab1', 'app.patient.tab2', 'app.patient.tab3', 'app.patient.tab4', 'app.patient.tab5',
        'app.employee.tab1', 'app.employee.tab2', 'app.employee.tab3', 'app.employee.tab4',
        'admin.worksite.tab1', 'admin.worksite.tab2', 'app.add-complaint'
    ];

    $rootScope.$on('$stateChangeSuccess', (event, currentState) => {
        const features = currentState.data.feature.split(",") || [];
        const allowed = $rootScope.currentUser.allowedFeature || [];

        if (features.length && allowed.length) {
            const match = features.filter(f => allowed.includes(f));
            if (match.length === 0) {
                event.preventDefault();
                $state.transitionTo(ontime_data.defaultState);
            }
        }

        setTimeout(() => {
            if ($.fn.dirtyForms) {
                $('form:dirty').dirtyForms('setClean');
                if (includedStatesForDirtyCheck.includes(currentState.name)) {
                    $('form').dirtyForms();
                }
            }
        }, 1000);

        if ($rootScope.currentUser && getCookie('changePassword') === 'true') {
            $rootScope.openResetPasswordModal("resetPasswordModal", 'md', "static", false);
        }
    });
});

module.exports = app;