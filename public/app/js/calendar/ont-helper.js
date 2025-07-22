angular
        .module('mwl.calendar')
        .factory('calendarHelper', ["$filter", "moment", "calendarConfig", "$rootScope", function ($filter, moment, calendarConfig, $rootScope) {
                function formatDate(date, format) {
                    if (calendarConfig.dateFormatter === 'angular') {
                        return $filter('date')(moment(date).toDate(), format);
                    } else if (calendarConfig.dateFormatter === 'moment') {
                        return moment(date).format(format);
                    }
                }

                function adjustEndDateFromStartDiff(oldStart, newStart, oldEnd) {
                    if (!oldEnd) {
                        return oldEnd;
                    }
                    var diffInSeconds = moment(newStart).diff(moment(oldStart));
                    return moment(oldEnd).add(diffInSeconds);
                }

                function eventIsInPeriod(event, periodStart, periodEnd) {

                    var eventStart = moment(new Date(event.startDate));
                    var eventEnd = moment(new Date(event.endDate));
                    periodStart = moment(periodStart);
                    periodEnd = moment(periodEnd);

                    return (eventStart.isAfter(periodStart) && eventStart.isBefore(periodEnd)) ||
                            (eventEnd.isAfter(periodStart) && eventEnd.isBefore(periodEnd)) ||
                            (eventStart.isBefore(periodStart) && eventEnd.isAfter(periodEnd)) ||
                            eventStart.isSame(periodStart,'day') ||
                            eventEnd.isSame(periodEnd,'day');

                }

                function filterEventsInPeriod(events, startPeriod, endPeriod) {
                    return events.filter(function (event) {
                        return eventIsInPeriod(event, startPeriod, endPeriod);
                    });
                }

                function getEventsInPeriod(calendarDate, period, allEvents) {
                    var startPeriod = moment(calendarDate).startOf(period);
                    var endPeriod = moment(calendarDate).endOf(period);
                    return filterEventsInPeriod(allEvents, startPeriod, endPeriod);
                }

                function getBadgeTotal(events) {
                    return events.filter(function (event) {
                        return event.incrementsBadgeTotal !== false;
                    }).length;
                }

                function getWeekDayNames() {
                    var weekdays = [];
                    var count = 0;
                    while (count < 7) {
                        weekdays.push(formatDate(moment().weekday(count++), calendarConfig.dateFormats.monthDay));
                    }
                    return weekdays;
                }

                function getMonthView(events, currentDay, id, type) {

                    var startOfMonth = moment(currentDay).startOf('month');
                    var day = startOfMonth.clone().startOf('week');
                    var endOfMonthView = moment(currentDay).endOf('month').endOf('week');
                    $rootScope.weekStart = new Date(startOfMonth);
                    $rootScope.weekEnd = new Date(endOfMonthView);
                    var eventsInPeriod;

                    if (type == "employee") {
                        var month_events = _.filter(events, function (data) {
                            return data.employeeId == id
                        })
                    } else if (type == "coordinator") {
                        var month_events = events;
                    } else {
                        var month_events = _.filter(events, function (data) {
                            return data.patientId == id
                        })
                    }

                    eventsInPeriod = filterEventsInPeriod(month_events, day, endOfMonthView);

                    var view = [];
                    var today = moment().startOf('day');

                    while (day.isBefore(endOfMonthView)) {

                        var inMonth = day.month() === moment(currentDay).month();
                        var monthEvents = [];
                        if (inMonth || calendarConfig.displayAllMonthEvents) {
                            monthEvents = filterEventsInPeriod(eventsInPeriod, day, day.clone().endOf('day'));
                        }

                        var cell = {
                            label: day.date(),
                            date: day.clone(),
                            inMonth: inMonth,
                            isPast: today.isAfter(day),
                            isToday: today.isSame(day),
                            isFuture: today.isBefore(day),
                            isWeekend: [0, 6].indexOf(day.day()) > -1,
                            events: monthEvents,
                            badgeTotal: getBadgeTotal(monthEvents)
                        };

                        view.push(cell);

                        day.add(1, 'day');
                    }

                    return view;

                }

                function getWeekView(events, currentDay, list, type) {
                    var startOfWeek = moment(currentDay).startOf('week');
                    var endOfWeek = moment(currentDay).endOf('week');
                    $rootScope.weekStart = new Date(startOfWeek);
                    $rootScope.weekEnd = new Date(endOfWeek);
                    var dayCounter = startOfWeek.clone();
                    var days = [];
                    var eventdays = [];
                    var today = moment().startOf('day');

                    while (days.length < 7) {
                        days.push({
                            weekDayLabel: formatDate(dayCounter, calendarConfig.dateFormats.weekDay),
                            date: dayCounter.clone(),
                            dayLabel: formatDate(dayCounter, calendarConfig.dateFormats.day),
                            isPast: dayCounter.isBefore(today),
                            isToday: dayCounter.isSame(today),
                            isFuture: dayCounter.isAfter(today),
                            isWeekend: [0, 6].indexOf(dayCounter.day()) > -1
                        });
                        dayCounter.add(1, 'day');
                    }
                    eventdays = days;

                    if (type == "employee") {
                        _.each(list, function (n) {
                            n.temp_events = _.filter(events, function (data) {
                                return data.employeeId == n.id
                            })
                        })
                    } else if(type == "patient"){
                        _.each(list, function (n) {
                            n.temp_events = _.filter(events, function (data) {
                                return data.patientId == n.id
                            })
                        })
                    } else {
                        _.each(list, function (n) {
                            n.temp_events = _.filter(events, function (data) {
                                return true
                            })
                        })
                    }

                    _.each(list, function (n) {
                        n.days = [];
                        _.each(eventdays, function (f) {
                            var e = {};
                            angular.copy(f, e);
                            e.events = _.remove(n.temp_events, function (content) {
                                return moment(f.date).isSame(moment(new Date(content.startDate)));
                            })
                            _.each(e.events, function (d) {
                                var startDate = moment(new Date(d.startDate));
                                var endDate = moment(new Date(d.endDate));
                                var diff = moment(endDate).diff(startDate, 'days');
                                d.daySpan = diff + 1;
                            })
                            n.days.push(e);
                        })
                    })
                    return {days: days, list: list};

                }

                return {
                    getWeekDayNames: getWeekDayNames,
                    getMonthView: getMonthView,
                    getWeekView: getWeekView,
                    adjustEndDateFromStartDiff: adjustEndDateFromStartDiff,
                    formatDate: formatDate,
                    eventIsInPeriod: eventIsInPeriod //expose for testing only
                };

            }]);