'use strict';

angular
        .module('mwl.calendar')
  .directive('mwlDateModifier', function() {

            return {
                restrict: 'A',
                scope: {
                    date: '=',
                    increment: '=',
                    decrement: '='
                },
      controller: function($element, $attrs, $scope, moment, $rootScope) {

                    function onClick() {
                        if (angular.isDefined($attrs.setToToday)) {
                            $scope.date = new Date();
                        } else if (angular.isDefined($attrs.increment)) {
                            $scope.date = moment($scope.date).add(1, $scope.increment).toDate();
                        } else if (angular.isDefined($attrs.decrement)) {
                            $scope.date = moment($scope.date).subtract(1, $scope.decrement).toDate();
                        }
                        $scope.$apply();
                        $rootScope.refreshCalendarView();
                    }

                    $element.bind('click', onClick);

          $scope.$on('$destroy', function() {
                        $element.unbind('click', onClick);
                    });

                }
            };

        });
