	angular
	  .module('mwl.calendar')
	  .factory('calendarTitle', ["moment", "calendarConfig", "calendarHelper", function(moment, calendarConfig, calendarHelper) {

	    function day(currentDay) {
	      return calendarHelper.formatDate(currentDay, calendarConfig.titleFormats.day);
	    }

	    function week(currentDay) {
	      var weekTitleLabel = calendarConfig.titleFormats.week;

	        if(moment(currentDay).weekday(0).format('MMM') == moment(currentDay).weekday(6).format('MMM')) {
	      		return weekTitleLabel.replace('{month}', moment(currentDay).format('MMM'))
	      						.replace('{startDate}', moment(currentDay).weekday(0).format('D'))
	      						.replace('{month2}', '')
	      						.replace('{endDate}', moment(currentDay).weekday(6).format('D'))
	      						.replace('{year}', moment(currentDay).format('YYYY'));
	      	} else {
	      		return weekTitleLabel.replace('{month}', moment(currentDay).weekday(0).format('MMM'))
	      						.replace('{startDate}', moment(currentDay).weekday(0).format('D'))
	      						.replace('{month2}', moment(currentDay).weekday(6).format('MMM'))
	      						.replace('{endDate}', moment(currentDay).weekday(6).format('D'))
	      						.replace('{year}', moment(currentDay).format('YYYY'));
	      	}
	    }

	    function month(currentDay) {
	      return calendarHelper.formatDate(currentDay, calendarConfig.titleFormats.month);
	    }

	    function year(currentDay) {
	      return calendarHelper.formatDate(currentDay, calendarConfig.titleFormats.year);
	    }

	    return {
	      day: day,
	      week: week,
	      month: month,
	      year: year
	    };

	  }]);