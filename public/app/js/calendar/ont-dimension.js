	angular
	  .module('mwl.calendar')
	  .directive('mwlElementDimensions', function() {
	  	var controller = ["$element", "$scope", "$parse", "$attrs", function($element, $scope, $parse, $attrs) {

	    $parse($attrs.mwlElementDimensions).assign($scope, {
	      width: $element[0].offsetWidth,
	      height: $element[0].offsetHeight
	    });

	  }];
	    return {
	      restrict: 'A',
	      controller: controller
	    };

	  });