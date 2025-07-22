/* global _, appHelper */

angular.module('xenon.directives').directive('notesDirective', function ($compile, $rootScope, EmployeeDAO, PatientDAO, ApplicationDAO) {
    return {
        restrict: 'E',
        scope: {
            defaultTemplate: "=?",
            userId: "=?",
            hasCreate: "=?",
            hasRetrieve: "=?",
            canDelete: "=?",
            canEdit: "=?",
            type: '=?',
            readNotes: '=?'
        },
        link: function (scope) {
            var FeatureDAO;
            if (scope.type === 'patient') {
                FeatureDAO = PatientDAO;
            } else if (scope.type === 'application') {
                FeatureDAO = ApplicationDAO;
            } else {
                FeatureDAO = EmployeeDAO;
            }

            function readNotes() {
                FeatureDAO.readNotes({userId: scope.userId}).then(function (res) {
                    console.log("read documents", res);
                });
            }

            function initData() {
                scope.notes = [];
                scope.noteTypeCategoriesMap = {'Case Offered': ['Accepted', 'No Answer', 'Declined']};
                scope.noteCategories = [];
                scope.allLoaded = false;
                scope.data = {note: ""};
                if (scope.type === 'patient') {
                    scope.noteTypes = ['Accidents/Incidents', 'Communication', 'Falls', 'Schedule', 'MLTC Update'];
                } else if (scope.type === 'application') {
                    scope.noteTypes = ['Missing Data', 'Suspecious', 'Other'];
                } else {
                    scope.noteTypes = ['Case Offered', 'Company Outreach', 'Compliance', 'Disciplinary',
                        'Employee Message', 'Miscellaneous', 'Proxy Communication', 'Schedule', 'Standard Communication'];
                }
                scope.searchParams = {userId: scope.userId, pageNo: 1, limit: 10, action: scope.userId, subAction: 'notes'};
                if (scope.hasRetrieve) {
                    scope.rerenderDataTable();
                    if (scope.readNotes)
                        readNotes();
                } else {
                    $rootScope.unmaskLoading();
                }
            }

            scope.onNoteTypeChange = function () {
                if (scope.noteTypeCategoriesMap[scope.data.noteType]) {
                    scope.noteCategories = scope.noteTypeCategoriesMap[scope.data.noteType];
                } else {
                    scope.noteCategories = [];
                    delete scope.data.noteCategory;
                }
            }

            scope.rerenderDataTable = function () {
                FeatureDAO.getNotes(scope.searchParams).then(function (res) {
                    if (res.length < scope.searchParams.limit)
                        scope.allLoaded = true;
                    scope.loading = false;
                    scope.notes = _.concat(scope.notes, angular.copy(res));
                    setTimeout(function () {
                        (function ($) {
                            $.fn.hasScrollBar = function () {
                                return this.get(0).scrollHeight > this.height();
                            }
                        })(jQuery);
                        $(function () {
                            scope.hasScroll = $('#my_div1').hasScrollBar();
                        });
                    }, 0);
                }).catch(function (data, status) {
                    toastr.error("Note cannot be retrieved.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };

            scope.addNote = function () {
                if ($('#NotesData')[0].checkValidity()) {
                    $rootScope.maskLoading();
                    FeatureDAO.addNotes(
                            {userId: scope.userId,
                                note: {note: scope.data.note, noteType: scope.data.noteType, noteCategory: scope.data.noteCategory}}).then(function (res) {
                        if (scope.hasRetrieve)
                            initData();
                        scope.data = {note: ""};
                        toastr.success("Note added.");
                    }
                    ).catch(function (data, status) {
                        toastr.error("Note cannot be added.");
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }
            };

            scope.saveNote = function () {
                if ($('#NotesData')[0].checkValidity()) {
                    $rootScope.maskLoading();
                    FeatureDAO.updateNotes(
                            {userId: scope.userId,
                                noteId: scope.data.id,
                                note: {note: scope.data.note, noteType: scope.data.noteType, noteCategory: scope.data.noteCategory}}).then(function (res) {
                        if (scope.hasRetrieve)
                            initData();
                        scope.data = {note: ""};
                        toastr.success("Note updated successfully.");
                    }
                    ).catch(function (data, status) {
                        toastr.error("Note cannot be updated.");
                    }).then(function () {
                        $rootScope.unmaskLoading();
                    });
                }
            };

            scope.deleteNote = function (noteId) {
                $rootScope.maskLoading();
                FeatureDAO.deleteNotes(
                        {userId: scope.userId,
                            noteId: noteId}).then(function (res) {
                    if (scope.hasRetrieve)
                        initData();
                    toastr.success("Note deleted successfully.");
                }
                ).catch(function (data, status) {
                    toastr.error("Note cannot be deleted.");
                }).then(function () {
                    $rootScope.unmaskLoading();
                });
            };

            scope.editNote = function (note) {
                scope.data = angular.copy(note);
                scope.onNoteTypeChange();
            };
            scope.loadMoreNotes = function () {
                if (scope.loading !== true && scope.allLoaded !== true) {
                    scope.loading = true;
                    scope.searchParams.pageNo++;
                    scope.rerenderDataTable();
                }
            };

            initData();
        },
        templateUrl: function (elem, attrs) {
            return appHelper.viewTemplatePath('common', 'notes-directive');
        }
    };
});
