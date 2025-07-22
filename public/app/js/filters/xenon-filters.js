'use strict';

angular.module('xenon.filter', [])
    .filter('tel', function () {
        return function (tel) {
            if (!tel) {
                return '';
            }

            var value = tel.toString().trim().replace(/^\+/, '');

            if (value.match(/[^0-9]/)) {
                return tel;
            }

            var country, city, number;

            switch (value.length) {
                case 10: // +1PPP####### -> C (PPP) ###-####
                    country = 1;
                    city = value.slice(0, 3);
                    number = value.slice(3);
                    break;

                case 11: // +CPPP####### -> CCC (PP) ###-####
                    country = value[0];
                    city = value.slice(1, 4);
                    number = value.slice(4);
                    break;

                case 12: // +CCCPP####### -> CCC (PP) ###-####
                    country = value.slice(0, 3);
                    city = value.slice(3, 5);
                    number = value.slice(5);
                    break;

                default:
                    return tel;
            }

            if (country == 1) {
                country = "";
            }

            number = number.slice(0, 3) + '-' + number.slice(3);

            return (country + " (" + city + ") " + number).trim();
        };
    }).filter('ssn', function () {
        return function (ssn) {
            if (!ssn) {
                return '';
            }

            var value = ssn.toString().trim().replace(/^\+/, '');

            if (value.match(/[^0-9]/)) {
                return ssn;
            }

            ssn = ssn.slice(0, 3) + '-' + ssn.slice(3, 5) + '-' + ssn.slice(5);

            return ssn.trim();
        };
    })
    .filter('timecount', function () {
        return function (earlierdate, laterdate) {
            if (earlierdate != null && laterdate != null) {
                var valid1 = /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/.test(earlierdate);
                var valid2 = /^([0-1][0-9]|[2][0-3]):([0-5][0-9])$/.test(laterdate);
                if (valid1 && valid2) {
                    var d1 = earlierdate.split(":");
                    var d2 = laterdate.split(":");
                    var d12 = Number(d1[1]);
                    var d22 = Number(d2[1]);
                    var d11 = Number(d1[0]);
                    var d21 = Number(d2[0]);
                    var value;
                    var min;
                    var minus = 0;
                    var hr;
                    if (d22 >= d12) {
                        min = d22 - d12;
                    } else {
                        minus = 1;
                        min = (60 - d12) + d22;
                    }
                    if (d21 >= d11) {
                        if (d21 == d11 && minus != 0) {
                            hr = 24 - d11 + d21 - minus;
                        } else {
                            hr = d21 - d11 - minus;
                        }
                    } else {
                        hr = (24 - d11) + d21 - minus;
                    }
                    value = hr + " hr " + min + " min";
                    return value;
                }
            }
        };
    })
    .filter('duration', function () {
        return function (earlierdate, laterdate) {
            earlierdate = new Date(earlierdate);
            laterdate = new Date(laterdate);
            var difference = laterdate.getTime() - earlierdate.getTime();

            //                var daysDifference = Math.floor(difference / 1000 / 60 / 60 / 24);
            //                difference -= daysDifference * 1000 * 60 * 60 * 24

            var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
            if (hoursDifference.toString().length == 1) {
                hoursDifference = "0" + hoursDifference;
            }
            difference -= hoursDifference * 1000 * 60 * 60

            var minutesDifference = Math.floor(difference / 1000 / 60);
            difference -= minutesDifference * 1000 * 60
            if (minutesDifference.toString().length == 1) {
                minutesDifference = "0" + minutesDifference;
            }

            var secondsDifference = Math.floor(difference / 1000);
            return hoursDifference + ":" + minutesDifference;
        };
    })
    .filter('timesheetformat', function () {
        return function (input) {
            var weekDays = ['Sn', 'Mn', 'Tu', 'Wd', 'Th', 'Fr', 'St'];
            return weekDays[new Date(input).getDay()];
        };
    })
    .filter('extension', function () {
        return function (input) {
            if (input && input !== null) {
                return input.substring(input.lastIndexOf("."))
            } else {
                return input;
            }
            return weekDays[new Date(input).getDay()];
        };
    })
    .filter('durationtotal', ['$filter', function ($filter) {
        return function (objList, name) {
            var durationSum = 0;
            angular.forEach(objList, function (obj) {
                if (!isNaN(obj.roundedPunchOutTime) && !isNaN(obj.roundedPunchInTime) != null) {
                    if ((obj.unauthorizedTime && !obj[name] && obj.scheduleId) || !!obj.ut) {
                        var earlierdate = new Date(obj.scheduleId.roundedStartTime);
                        var laterdate = new Date(obj.scheduleId.roundedEndTime);
                        durationSum += laterdate.getTime() - earlierdate.getTime();
                    } else {
                        var earlierdate = new Date(obj.roundedPunchInTime);
                        var laterdate = new Date(obj.roundedPunchOutTime);
                        durationSum += laterdate.getTime() - earlierdate.getTime();
                    }
                }
            });

            //                    var daysDifference = Math.floor(durationSum / 1000 / 60 / 60 / 24);
            //                    durationSum -= daysDifference * 1000 * 60 * 60 * 24

            var hoursDifference = Math.floor(durationSum / 1000 / 60 / 60);
            if (hoursDifference.toString().length == 1) {
                hoursDifference = "0" + hoursDifference;
            }
            durationSum -= hoursDifference * 1000 * 60 * 60

            var minutesDifference = Math.floor(durationSum / 1000 / 60);
            durationSum -= minutesDifference * 1000 * 60
            if (minutesDifference.toString().length == 1) {
                minutesDifference = "0" + minutesDifference;
            }
            var secondsDifference = Math.floor(durationSum / 1000);
            return hoursDifference + ":" + minutesDifference;
        }
    }])
    .filter('ut', function () {
        return function (scheduleStart, scheduleEnd, punchIn, punchOut) {
            scheduleStart = new Date(scheduleStart);
            scheduleEnd = new Date(scheduleEnd);
            var difference = scheduleEnd.getTime() - scheduleStart.getTime();

            var hoursDifference = Math.floor(difference / 1000 / 60 / 60);
            difference -= hoursDifference * 1000 * 60 * 60;

            var minutesDifference = Math.floor(difference / 1000 / 60);
            difference -= minutesDifference * 1000 * 60;
            var scheduleDiff = hoursDifference * 60 + minutesDifference;

            punchIn = new Date(punchIn);
            punchOut = new Date(punchOut);

            var difference1 = punchOut.getTime() - punchIn.getTime();

            var hoursDifference1 = Math.floor(difference1 / 1000 / 60 / 60);
            difference1 -= hoursDifference1 * 1000 * 60 * 60;

            var minutesDifference1 = Math.floor(difference1 / 1000 / 60);
            difference1 -= minutesDifference1 * 1000 * 60;
            var punchDiff = hoursDifference1 * 60 + minutesDifference1;
            var string;
            if (punchDiff > scheduleDiff) {
                var diff = punchDiff - scheduleDiff;
                var hours = Math.floor(diff / 60);
                var minutes = diff % 60;
                if (hours.toString().length == 1) {
                    hours = "0" + hours;
                }
                if (minutes.toString().length == 1) {
                    minutes = "0" + minutes;
                }
                string = hours + ":" + minutes;
            }
            return string;

        };
    })
    .filter('ampm', function () {
        return function (time) {
            // Check correct time format and split into components
            if (time != undefined) {
                time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
                if (time.length > 1) { // If time format correct
                    time = time.slice(1);  // Remove full string match value
                    time[5] = +time[0] < 12 ? ' AM' : ' PM'; // Set AM/PM
                    time[0] = +time[0] % 12 || 12; // Adjust hours
                }
                if (time[0].toString().length == 1) {
                    time[0] = '0' + time[0];
                }
                return time.join(''); // return adjusted time or original string
            }
        };
    })
    .filter('ampmshort', function () {
        return function (time) {
            // Check correct time format and split into components
            if (time != undefined) {
                time = time.toString().match(/^([01]\d|2[0-3])(:)([0-5]\d)(:[0-5]\d)?$/) || [time];
                if (time.length > 1) { // If time format correct
                    time = time.slice(1);  // Remove full string match value
                    time[5] = +time[0] < 12 ? 'A' : 'P'; // Set AM/PM
                    time[0] = +time[0] % 12 || 12; // Adjust hours
                }
                if (time[0].toString().length == 1) {
                    time[0] = '0' + time[0];
                }
                return time.join(''); // return adjusted time or original string
            }
        };
    })
    .filter('to_trusted', ['$sce', function ($sce) {
        return function (text) {
            return $sce.trustAsHtml(text);
        };
    }])
    .filter('isEmptyOrAllFalse', function () {
        return function (input) {
            if (angular.isArray(input)) {
                return input.length === 0;
            } else if (angular.isObject(input)) {
                return Object.values(input).every(function (value) {
                    return value === false;
                });
            }
            return false;
        };
    })
    .filter('titleCase', function () {
        return function (input) {
            if (input) {
                return input.replace(/\w\S*/g, function (txt) {
                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                });
            }
            return input;
        };
    }).filter('dateOnly', function($filter) {
        return function(input) {
          if (input) {
            // Convert input to a JavaScript Date object
            var date = new Date(input);
      
            // Format the date as 'dd/MM/yyyy'
            var formattedDate = $filter('date')(date, 'MM/dd/yyyy');
      
            return formattedDate;
          } else {
            return '';
          }
        };
      });
      




