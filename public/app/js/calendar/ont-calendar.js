	angular
	  .module('mwl.calendar')
	  .directive('mwlCalendar',function() {

	  	var controller  = ["$scope", "$log", "$timeout", "$attrs", "$locale", "moment", "calendarTitle", function($scope, $log, $timeout, $attrs, $locale, moment, calendarTitle) {

	    $scope.events = $scope.events || [];

	    $scope.changeView = function(view, newDay) {
	      $scope.view = view;
	      $scope.currentDay = newDay;
	    };

		var previousDate = moment($scope.currentDay);
	    var previousView = $scope.view;

	    function eventIsValid(event) {
	      return true;
	    }

	    function refreshCalendar() {

	      if (calendarTitle[$scope.view] && angular.isDefined($attrs.viewTitle)) {
	        $scope.viewTitle = calendarTitle[$scope.view]($scope.currentDay);
	      }

	      $scope.events = $scope.events.filter(eventIsValid).map(function(event, index) {
	        Object.defineProperty(event, '$id', {enumerable: false, configurable: true, value: index});
	        return event;
	      });

	      //if on-timespan-click="calendarDay = calendarDate" is set then don't update the view as nothing needs to change
	      var currentDate = moment($scope.currentDay);
	      var shouldUpdate = true;
	      if (
	        previousDate.clone().startOf($scope.view).isSame(currentDate.clone().startOf($scope.view)) &&
	        !previousDate.isSame(currentDate) &&
	        $scope.view === previousView
	      ) {
	        shouldUpdate = false;
	      }
	      previousDate = currentDate;
	      previousView = $scope.view;

	      if (shouldUpdate) {
	        // a $timeout is required as $broadcast is synchronous so if a new events array is set the calendar won't update
	        $timeout(function() {
	          $scope.$broadcast('calendar.refreshView');
	        });
	      }
	    }

	    var eventsWatched = false;

	    $scope.$watch(
	      'view'
	    , function() {
	      if (!eventsWatched) {
	        eventsWatched = true;
	        $scope.$watch('events', refreshCalendar, true); //this will call refreshCalendar when the watcher starts (i.e. now)
	      } else {
	        refreshCalendar();
	      }
	    });

	    $scope.$watch(
	      'list'
	    , function() {
	      if (!eventsWatched) {
	        eventsWatched = true;
	        $scope.$watch('events', refreshCalendar, true); //this will call refreshCalendar when the watcher starts (i.e. now)
	      } else {
	        refreshCalendar();
	      }
	    });

	    $scope.$watch(
	      'currentDay'
	    , function() {
	      if (!eventsWatched) {
	        eventsWatched = true;
	        $scope.$watch('events', refreshCalendar, true); //this will call refreshCalendar when the watcher starts (i.e. now)
	      } else {
	        refreshCalendar();
	      }
	    });

	    $scope.$watch(
	      'showTime'
	    , function() {
	      if (!eventsWatched) {
	        eventsWatched = true;
	        $scope.$watch('events', refreshCalendar, true); //this will call refreshCalendar when the watcher starts (i.e. now)
	      } else {
	        refreshCalendar();
	        console.log($scope.showTime);
	      }
	    });

	  }];
	    return {
	      templateUrl: 'templates/calendar.html',
	      restrict: 'EA',
	      scope: {
	        events: '=',
	        view: '=',
	        viewTitle: '=?',
	        currentDay: '=',
	        onEventClick: '&',
	        onListClick: '&',
	        monthCellTemplateUrl: '@',
	        monthCellEventsTemplateUrl: '@',
            list:'=',
            typeId:'=',
            type:'@',
            showTime: '=',
            eventClickCallback:'='
	      },
	      controller: controller
	    };

	  });