/**
 * dirPagination - AngularJS module for paginating (almost) anything.
 *
 *
 * Credits
 * =======
 *
 * Daniel Tabuenca: https://groups.google.com/d/msg/angular/an9QpzqIYiM/r8v-3W1X5vcJ
 * for the idea on how to dynamically invoke the ng-repeat directive.
 *
 * I borrowed a couple of lines and a few attribute names from the AngularUI Bootstrap project:
 * https://github.com/angular-ui/bootstrap/blob/master/src/pagination/pagination.js
 *
 * Copyright 2014 Michael Bromley <michael@michaelbromley.co.uk>
 */

(function() {

    /**
     * Config
     */
    var moduleName = 'angularUtils.directives.dirPagination';
    var DEFAULT_ID = '__default';

    /**
     * Module
     */
    var module;
    try {
        module = angular.module(moduleName);
    } catch(err) {
        // named module does not exist, so create one
        module = angular.module(moduleName, []);
    }

    module.directive('dirPaginate', ['$compile', '$parse', '$timeout', 'paginationService', function($compile, $parse, $timeout, paginationService) {

        return  {
            terminal: true,
            multiElement: true,
            priority: 5000, // This setting is used in conjunction with the later call to $compile() to prevent infinite recursion of compilation
            compile: function dirPaginationCompileFn(tElement, tAttrs){

                var expression = tAttrs.dirPaginate;
                // regex taken directly from https://github.com/angular/angular.js/blob/master/src/ng/directive/ngRepeat.js#L211
                var match = expression.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);

                var filterPattern = /\|\s*itemsPerPage\s*:[^|]*/;
                if (match[2].match(filterPattern) === null) {
                    throw 'pagination directive: the \'itemsPerPage\' filter must be set.';
                }
                var itemsPerPageFilterRemoved = match[2].replace(filterPattern, '');
                var collectionGetter = $parse(itemsPerPageFilterRemoved);

                // If any value is specified for paginationId, we register the un-evaluated expression at this stage for the benefit of any
                // dir-pagination-controls directives that may be looking for this ID.
                var rawId = tAttrs.paginationId || DEFAULT_ID;
                paginationService.registerInstance(rawId);

                return function dirPaginationLinkFn(scope, element, attrs){

                    // Now that we have access to the `scope` we can interpolate any expression given in the paginationId attribute and
                    // potentially register a new ID if it evaluates to a different value than the rawId.
                    var paginationId = $parse(attrs.paginationId)(scope) || attrs.paginationId || DEFAULT_ID;
                    paginationService.registerInstance(paginationId);

                    var repeatExpression;
                    var idDefinedInFilter = !!expression.match(/(\|\s*itemsPerPage\s*:[^|]*:[^|]*)/);
                    if (paginationId !== DEFAULT_ID && !idDefinedInFilter) {
                        repeatExpression = expression.replace(/(\|\s*itemsPerPage\s*:[^|]*)/, "$1 : '" + paginationId + "'");
                    } else {
                        repeatExpression = expression;
                    }

                    // Add ng-repeat to the dom element
                    if (element[0].hasAttribute('dir-paginate-start') || element[0].hasAttribute('data-dir-paginate-start')) {
                        // using multiElement mode (dir-paginate-start, dir-paginate-end)
                        attrs.$set('ngRepeatStart', repeatExpression);
                        element.eq(element.length - 1).attr('ng-repeat-end', true);
                    } else {
                        attrs.$set('ngRepeat', repeatExpression);
                    }

                    var compiled =  $compile(element, false, 5000); // we manually compile the element again, as we have now added ng-repeat. Priority less than 5000 prevents infinite recursion of compiling dirPaginate

                    var currentPageGetter;
                    if (attrs.currentPage) {
                        currentPageGetter = $parse(attrs.currentPage);
                    } else {
                        // if the current-page attribute was not set, we'll make our own
                        var defaultCurrentPage = paginationId + '__currentPage';
                        scope[defaultCurrentPage] = 1;
                        currentPageGetter = $parse(defaultCurrentPage);
                    }
                    paginationService.setCurrentPageParser(paginationId, currentPageGetter, scope);

                    if (typeof attrs.totalItems !== 'undefined') {
                        paginationService.setAsyncModeTrue(paginationId);
                        scope.$watch(function() {
                            return $parse(attrs.totalItems)(scope);
                        }, function (result) {
                            if (0 <= result) {
                                paginationService.setCollectionLength(paginationId, result);
                            }
                        });
                    } else {
                        scope.$watchCollection(function() {
                            return collectionGetter(scope);
                        }, function(collection) {
                            if (collection) {
                                paginationService.setCollectionLength(paginationId, collection.length);
                            }
                        });
                    }

                    // Delegate to the link function returned by the new compilation of the ng-repeat
                    compiled(scope);
                };
            }
        }; 
    }]);

    module.directive('dirPaginationControls', ['paginationService', 'paginationTemplate', function(paginationService, paginationTemplate) {

        var numberRegex = /^\d+$/;

        /**
         * Generate an array of page numbers (or the '...' string) which is used in an ng-repeat to generate the
         * links used in pagination
         *
         * @param currentPage
         * @param rowsPerPage
         * @param paginationRange
         * @param collectionLength
         * @returns {Array}
         */
        function generatePagesArray(currentPage, collectionLength, rowsPerPage, paginationRange) {
            var pages = [];
            var totalPages = Math.ceil(collectionLength / rowsPerPage);
            var halfWay = Math.ceil(paginationRange / 2);
            var position;

            if (currentPage <= halfWay) {
                position = 'start';
            } else if (totalPages - halfWay < currentPage) {
                position = 'end';
            } else {
                position = 'middle';
            }

            var ellipsesNeeded = paginationRange < totalPages;
            var i = 1;
            while (i <= totalPages && i <= paginationRange) {
                var pageNumber = calculatePageNumber(i, currentPage, paginationRange, totalPages);

                var openingEllipsesNeeded = (i === 2 && (position === 'middle' || position === 'end'));
                var closingEllipsesNeeded = (i === paginationRange - 1 && (position === 'middle' || position === 'start'));
                if (ellipsesNeeded && (openingEllipsesNeeded || closingEllipsesNeeded)) {
                    pages.push('...');
                } else {
                    pages.push(pageNumber);
                }
                i ++;
            }
            return pages;
        }

        /**
         * Given the position in the sequence of pagination links [i], figure out what page number corresponds to that position.
         *
         * @param i
         * @param currentPage
         * @param paginationRange
         * @param totalPages
         * @returns {*}
         */
        function calculatePageNumber(i, currentPage, paginationRange, totalPages) {
            var halfWay = Math.ceil(paginationRange/2);
            if (i === paginationRange) {
                return totalPages;
            } else if (i === 1) {
                return i;
            } else if (paginationRange < totalPages) {
                if (totalPages - halfWay < currentPage) {
                    return totalPages - paginationRange + i;
                } else if (halfWay < currentPage) {
                    return currentPage - halfWay + i;
                } else {
                    return i;
                }
            } else {
                return i;
            }
        }

        return {
            restrict: 'AE',
            templateUrl: function(elem, attrs) {
                return attrs.templateUrl || paginationTemplate.getPath();
            },
            scope: {
                maxSize: '=?',
                onPageChange: '&?',
                paginationId: '=?'
            },
            link: function dirPaginationControlsLinkFn(scope, element, attrs) {

                // rawId is the un-interpolated value of the pagination-id attribute. This is only important when the corresponding dir-paginate directive has
                // not yet been linked (e.g. if it is inside an ng-if block), and in that case it prevents this controls directive from assuming that there is
                // no corresponding dir-paginate directive and wrongly throwing an exception.
                var rawId = attrs.paginationId ||  DEFAULT_ID;
                var paginationId = scope.paginationId || attrs.paginationId ||  DEFAULT_ID;

                if (!paginationService.isRegistered(paginationId) && !paginationService.isRegistered(rawId)) {
                    var idMessage = (paginationId !== DEFAULT_ID) ? ' (id: ' + paginationId + ') ' : ' ';
                    throw 'pagination directive: the pagination controls' + idMessage + 'cannot be used without the corresponding pagination directive.';
                }

                if (!scope.maxSize) { scope.maxSize = 9; }
                scope.directionLinks = angular.isDefined(attrs.directionLinks) ? scope.$parent.$eval(attrs.directionLinks) : true;
                scope.boundaryLinks = angular.isDefined(attrs.boundaryLinks) ? scope.$parent.$eval(attrs.boundaryLinks) : false;
                scope.showPageNumbers = angular.isDefined(attrs.showPageNumbers) ? scope.$parent.$eval(attrs.showPageNumbers) : true;

                var paginationRange = Math.max(scope.maxSize, 5);
                scope.pages = [];
                scope.pagination = {
                    last: 1,
                    current: 1
                };
                scope.range = {
                    lower: 1,
                    upper: 1,
                    total: 1
                };

                scope.$watch(function() {
                    return (paginationService.getCollectionLength(paginationId) + 1) * paginationService.getItemsPerPage(paginationId);
                }, function(length) {
                    if (0 < length) {
                        generatePagination();
                    }
                });
                
                scope.$watch(function() {
                    return (paginationService.getItemsPerPage(paginationId));
                }, function(current, previous) {
                    if (current != previous) {
                        goToPage(scope.pagination.current);
                    }
                });

                scope.$watch(function() {
                    return paginationService.getCurrentPage(paginationId);
                }, function(currentPage, previousPage) {
                    if (currentPage != previousPage) {
                        goToPage(currentPage);
                    }
                });

                scope.setCurrent = function(num) {
                    if (isValidPageNumber(num)) {
                        paginationService.setCurrentPage(paginationId, num);
                    }
                };

                function goToPage(num) {
                    if (isValidPageNumber(num)) {
                        scope.pages = generatePagesArray(num, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                        scope.pagination.current = num;
                        updateRangeValues();

                        // if a callback has been set, then call it with the page number as an argument
                        if (scope.onPageChange) {
                            scope.onPageChange({ newPageNumber : num });
                        }
                    }
                }

                function generatePagination() {
                    var page = parseInt(paginationService.getCurrentPage(paginationId)) || 1;

                    scope.pages = generatePagesArray(page, paginationService.getCollectionLength(paginationId), paginationService.getItemsPerPage(paginationId), paginationRange);
                    scope.pagination.current = page;
                    scope.pagination.last = scope.pages[scope.pages.length - 1];
                    if (scope.pagination.last < scope.pagination.current) {
                        scope.setCurrent(scope.pagination.last);
                    } else {
                        updateRangeValues();
                    }
                }

                /**
                 * This function updates the values (lower, upper, total) of the `scope.range` object, which can be used in the pagination
                 * template to display the current page range, e.g. "showing 21 - 40 of 144 results";
                 */
                function updateRangeValues() {
                    var currentPage = paginationService.getCurrentPage(paginationId),
                        itemsPerPage = paginationService.getItemsPerPage(paginationId),
                        totalItems = paginationService.getCollectionLength(paginationId);

                    scope.range.lower = (currentPage - 1) * itemsPerPage + 1;
                    scope.range.upper = Math.min(currentPage * itemsPerPage, totalItems);
                    scope.range.total = totalItems;
                }

                function isValidPageNumber(num) {
                    return (numberRegex.test(num) && (0 < num && num <= scope.pagination.last));
                }
            }
        };
    }]);

    module.filter('itemsPerPage', ['paginationService', function(paginationService) {

        return function(collection, itemsPerPage, paginationId) {
            if (typeof (paginationId) === 'undefined') {
                paginationId = DEFAULT_ID;
            }
            if (!paginationService.isRegistered(paginationId)) {
                throw 'pagination directive: the itemsPerPage id argument (id: ' + paginationId + ') does not match a registered pagination-id.';
            }
            var end;
            var start;
            if (collection instanceof Array) {
                itemsPerPage = parseInt(itemsPerPage) || 9999999999;
                if (paginationService.isAsyncMode(paginationId)) {
                    start = 0;
                } else {
                    start = (paginationService.getCurrentPage(paginationId) - 1) * itemsPerPage;
                }
                end = start + itemsPerPage;
                paginationService.setItemsPerPage(paginationId, itemsPerPage);

                return collection.slice(start, end);
            } else {
                return collection;
            }
        };
    }]);

    module.service('paginationService', function() {

        var instances = {};
        var lastRegisteredInstance;

        this.registerInstance = function(instanceId) {
            if (typeof instances[instanceId] === 'undefined') {
                instances[instanceId] = {
                    asyncMode: false
                };
                lastRegisteredInstance = instanceId;
            }
        };

        this.isRegistered = function(instanceId) {
            return (typeof instances[instanceId] !== 'undefined');
        };

        this.getLastInstanceId = function() {
            return lastRegisteredInstance;
        };

        this.setCurrentPageParser = function(instanceId, val, scope) {
            instances[instanceId].currentPageParser = val;
            instances[instanceId].context = scope;
        };
        this.setCurrentPage = function(instanceId, val) {
            instances[instanceId].currentPageParser.assign(instances[instanceId].context, val);
        };
        this.getCurrentPage = function(instanceId) {
            var parser = instances[instanceId].currentPageParser;
            return parser ? parser(instances[instanceId].context) : 1;
        };

        this.setItemsPerPage = function(instanceId, val) {
            instances[instanceId].itemsPerPage = val;
        };
        this.getItemsPerPage = function(instanceId) {
            return instances[instanceId].itemsPerPage;
        };

        this.setCollectionLength = function(instanceId, val) {
            instances[instanceId].collectionLength = val;
        };
        this.getCollectionLength = function(instanceId) {
            return instances[instanceId].collectionLength;
        };

        this.setAsyncModeTrue = function(instanceId) {
            instances[instanceId].asyncMode = true;
        };

        this.isAsyncMode = function(instanceId) {
            return instances[instanceId].asyncMode;
        };
    });
    
    module.provider('paginationTemplate', function() {

        var templatePath = 'directives/pagination/dirPagination.tpl.html';
        
        this.setPath = function(path) {
            templatePath = path;
        };
        
        this.$get = function() {
            return {
                getPath: function() {
                    return templatePath;
                }
            };
        };
    });
})();