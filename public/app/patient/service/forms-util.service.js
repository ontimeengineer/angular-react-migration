angular.module('xenon.factory')
    .factory('AutoSaveService', ['$interval', '$rootScope', function($interval, $rootScope) {
        var autoSaveService = {};
        var autoSaveIntervalPromise;
        var onSaveCallback;
        var autoSaveInterval = 30000; // Default save interval (30 seconds)
        var hasUnsavedChanges = false;
    
        // Initialize the auto-save service
        autoSaveService.init = function(callback, isDirty, interval) {
            onSaveCallback = callback;
            hasUnsavedChanges = isDirty;
            if (interval) {
                autoSaveInterval = interval;
            }
    
            // Start the interval for auto-saving
            autoSaveIntervalPromise = $interval(function() {
                if (hasUnsavedChanges) {
                    onSaveCallback();
                    hasUnsavedChanges = false;
                }
            }, autoSaveInterval);
        };
    
        autoSaveService.getAutoSaveInterval = function() {
            return autoSaveIntervalPromise;
        };
    
        autoSaveService.setDirty = function(isDirty) {
            hasUnsavedChanges = isDirty;
        };
    
        // Stop the auto-save service
        autoSaveService.stop = function() {
            if (autoSaveIntervalPromise) {
                $interval.cancel(autoSaveIntervalPromise);
            }
        };

        // Listen for route changes and stop the auto-save interval
        $rootScope.$on('$stateChangeStart', function () {
            if (angular.isDefined(autoSaveIntervalPromise)) {
                autoSaveService.stop();
            }
        });
    
        return autoSaveService;
    }])
    .factory('PrintTitleService', ['Page', '$rootScope' ,function (Page, $rootScope){
        var printTitleService = {};
        var alternateTitle;
        var title;
        var attachOntime;
        
        var boundBeforePrint;
        var boundAfterPrint;
        
        printTitleService.init = function (initTitle, initAlternateTitle, initAttachOntime) {
            title = initTitle || 'Ontime';
            alternateTitle = initAlternateTitle || 'Ontime';
            attachOntime = (initAttachOntime !== undefined) ? initAttachOntime : true;
        
            // Clean up existing event listeners to avoid duplication
            if (boundBeforePrint) {
                window.removeEventListener('beforeprint', boundBeforePrint);
            }
            if (boundAfterPrint) {
                window.removeEventListener('afterprint', boundAfterPrint);
            }
        
            // Bind the correct context and add event listeners
            boundBeforePrint = this.setBeforePrintTitle.bind(this);
            boundAfterPrint = this.resetAfterPrintTitle.bind(this);
        
            window.addEventListener('beforeprint', boundBeforePrint);
            window.addEventListener('afterprint', boundAfterPrint);
        };
        
        // Cleanup event listeners when state changes
        $rootScope.$on("$stateChangeStart", function () {
            if (boundBeforePrint) {
                window.removeEventListener('beforeprint', boundBeforePrint);
            }
            if (boundAfterPrint) {
                window.removeEventListener('afterprint', boundAfterPrint);
            }
        });
        
        printTitleService.setBeforePrintTitle = function () {
            Page.setTitle(alternateTitle, attachOntime);
        };
        
        printTitleService.resetAfterPrintTitle = function () {
            Page.setTitle(title);
        };
        
        return printTitleService;
    }])
