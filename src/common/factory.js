import angular from 'angular';

export const Page = () => ({
    setTitle(newTitle, attachOntime = true) {
        document.title = `${newTitle}${attachOntime ? ' - OnTime' : ''}`;
    },
});

export const UtilService = ($state, $timeout) => ({
    reloadRoute() {
        $timeout(() => {
            $state.go($state.current, {}, { reload: true });
        }, 100);
    },
    convertAndSortObject(obj, keysToDelete) {
        const res = { ...obj };
        keysToDelete.forEach((key) => delete res[key]);

        return Object.entries(res)
            .map(([id, label]) => ({ id: parseInt(id), label }))
            .sort((a, b) => a.label.localeCompare(b.label));
    },
    clearLocalStorageItems(items) {
        items.forEach((item) => localStorage.removeItem(item));
    },
});
UtilService.$inject = ['$state', '$timeout'];

export const $debounce = ($rootScope, $browser, $q, $exceptionHandler) => {
    const deferreds = {};
    const methods = {};
    let uuid = 0;

    const debounce = (fn, delay, invokeApply) => {
        const deferred = $q.defer();
        const promise = deferred.promise;
        const skipApply = invokeApply !== undefined && !invokeApply;
        let methodId;
        let bouncing = false;

        for (const key in methods) {
            if (angular.equals(methods[key].fn, fn)) {
                bouncing = true;
                methodId = key;
            }
        }

        if (!bouncing) {
            methodId = uuid++;
            methods[methodId] = { fn };
        } else {
            deferreds[methods[methodId].timeoutId].reject('bounced');
            $browser.defer.cancel(methods[methodId].timeoutId);
        }

        const debounced = () => {
            delete methods[methodId];
            try {
                deferred.resolve(fn());
            } catch (e) {
                deferred.reject(e);
                $exceptionHandler(e);
            }
            if (!skipApply) $rootScope.$apply();
        };

        const timeoutId = $browser.defer(debounced, delay);
        methods[methodId].timeoutId = timeoutId;

        promise.$$timeoutId = timeoutId;
        deferreds[timeoutId] = deferred;

        const cleanup = () => delete deferreds[timeoutId];
        promise.then(cleanup, cleanup);

        return promise;
    };

    debounce.cancel = (promise) => {
        if (promise && promise.$$timeoutId in deferreds) {
            deferreds[promise.$$timeoutId].reject('canceled');
            return $browser.defer.cancel(promise.$$timeoutId);
        }
        return false;
    };

    return debounce;
};
$debounce.$inject = ['$rootScope', '$browser', '$q', '$exceptionHandler'];

export const $layout = ($rootScope, $cookies, $cookieStore) => {
    const layout = {
        resetLayoutToDefaults() {
            $rootScope.layoutOptions = {
                sidebarWidth: 250,
                horizontalMenuToggle: false,
                sidebarToggle: true,
                chatToggle: false,
                settingsPaneToggle: false,
                isLoginPage: false,
                isLockscreen: false,
                isBoxedPage: false,
                userProfile: true,
                pageLoading: false,
            };
        },
    };

    layout.resetLayoutToDefaults();

    return layout;
};
$layout.$inject = ['$rootScope', '$cookies', '$cookieStore'];

// Register all in a single Angular module
angular.module('xenon.factory', [])
    .factory('Page', Page)
    .factory('UtilService', UtilService)
    .factory('$debounce', $debounce)
    .factory('$layout', $layout);
