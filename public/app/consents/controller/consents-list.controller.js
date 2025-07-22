(function () {
    function ConsentsListCtrl(
        $rootScope,
        $modal,
        ConsentsDAO
    ) {
        "use strict";
        var ctrl = this;

        function initialize() {
            ctrl.consentTypeList = [];
            ctrl.retrieveConsentTypes = retrieveConsentTypes;
            ctrl.addEditPopup = addEditPopup;
            ctrl.activateDeactivatePopup = activateDeactivatePopup;
            ctrl.activateDeactivateConsentType = activateDeactivateConsentType;
            ctrl.retrieveConsentTypes();
            ctrl.save = save;
            ctrl.update = update;

            ctrl.OrderSetConsentPopUp = OrderSetConsentPopUp;
            ctrl.saveOrder = saveOrder;
            ctrl.deletePopUp = deletePopUp;

        }

        function retrieveConsentTypes() {
            $rootScope.maskLoading();
            ConsentsDAO.view().then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.consentTypeList = res;
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve consenttypes.");
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function addEditPopup(consenttype) {
            var consenttypeCopy = angular.copy(consenttype);
            $rootScope.consentsModal = $modal.open({
                templateUrl: 'consentsModal',
                size: "lg",
                backdrop: false,
            });

            if (consenttypeCopy == undefined) {
                $rootScope.consentsModal.title = 'Add New Consent Type';
                $rootScope.consentsModal.consenttype = { title: "", consentsDescription: "", isActive: true,inputType:'SELECTION' };
                $rootScope.consentsModal.consenttype.action = 'saveconsenttype';
            } else {
                $rootScope.consentsModal.title = 'Edit Consent Type';
                $rootScope.consentsModal.consenttype = consenttypeCopy;
                $rootScope.consentsModal.consenttype.action = 'updateconsenttype';
            }

            // Initialize CKEditor when the modal is opened
            $rootScope.consentsModal.opened.then(function () {
                // Ensure CKEditor is initialized after the DOM is ready
            $(document).ready(function () {
                    setTimeout(function () {
                        var editor = CKEDITOR.replace('editor3', {
                            toolbar:[
                                { name: 'basicstyles', items: ['Bold', 'Italic', 'Strike', "Underline", 'Subscript', 'Superscript', '-', 'RemoveFormat'] },
                                { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
                                { name: 'clipboard', items: [ 'Undo', 'Redo', '-', 'Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord'] },
                                { name: 'tools', items: ['Maximize', 'ShowBlocks'] },
                                //It's used to customize the toolbar controls
                                //We may need to customize in future 
                                // '/',
                                // { name: 'document', items: ['Source'] },
                                // { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
                                // { name: 'colors', items: ['TextColor', 'BGColor'] },
                                // { name: 'insert', items: ['Image', 'Table', 'HorizontalRule', 'SpecialChar'] },
                                // { name: 'others', items: ['About'] } // Additional section 'others' with 'About' item
                            ],
                           
                            language: 'en' // Optional: set the language
                        });

                        // Update ng-model value when CKEditor content changes
                        editor.on('change', function () {
                            $rootScope.$apply(function () {
                                $rootScope.consentsModal.consenttype.consentsDescription = editor.getData();
                            });
                        });
                    });
                }, 200);
            });

            $rootScope.consentsModal.cancel = function () {
                $rootScope.consentsModal.close();
            };

            $rootScope.consentsModal.save = function () {
                if ($('#consenttype_form')[0].checkValidity()) {
                    if ($rootScope.consentsModal.consenttype.inputType === 'TEXT_INPUT') {
                        $rootScope.consentsModal.consenttype.consentsDescription = ''
                    }
                    if ($rootScope.consentsModal.consenttype.action == "saveconsenttype") {
                        ctrl.save($rootScope.consentsModal.consenttype);
                    } else {
                        ctrl.update($rootScope.consentsModal.consenttype);
                    }
                }
            }

        }

        function save(consenttype) {
            ConsentsDAO.save(consenttype).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Consent Type saved.");
                $rootScope.consentsModal.close();
                ctrl.retrieveConsentTypes();
                //Reset dirty status of form
                if ($.fn.dirtyForms) {
                    $('form').dirtyForms('setClean');
                    $('.dirty').removeClass('dirty');
                }
            }).catch(function (data, status) {
                toastr.error(data.data);
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function update(consenttype) {
            ConsentsDAO.update(consenttype).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Consent Type updated.");
                $rootScope.consentsModal.close();
                ctrl.retrieveConsentTypes();
                //Reset dirty status of form
                if ($.fn.dirtyForms) {
                    $('form').dirtyForms('setClean');
                    $('.dirty').removeClass('dirty');
                }
            }).catch(function (data, status) {
                toastr.error(data.data);
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in retrieving data')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function activateDeactivatePopup(consenttype, modal_id, action, modal_size, modal_backdrop) {
            $rootScope.consentTypeActivateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.consentTypeActivateModal.action = action;
            $rootScope.consentTypeActivateModal.consenttype = consenttype;
            if (action == 'activate') {
                $rootScope.consentTypeActivateModal.title = 'Activate Consent Type';
            } else {
                $rootScope.consentTypeActivateModal.title = 'Deactivate Consent Type';
            }

            $rootScope.consentTypeActivateModal.confirm = function (consenttype) {
                if (action == 'activate') {
                    consenttype.isActive = "active"
                } else {
                    consenttype.isActive = "inActive"
                }
                ctrl.activateDeactivateConsentType(consenttype, action);
            };

            $rootScope.consentTypeActivateModal.dismiss = function () {
                $rootScope.consentTypeActivateModal.close();
            }

        }

        function activateDeactivateConsentType(consenttype, action) {
            ConsentsDAO.changestatus(consenttype).then(function (res) {
                toastr.success("Consent Type " + action + "d.");
                ctrl.retrieveConsentTypes();
            }).catch(function (data, status) {
                toastr.error("Consent Type cannot be " + action + "d.");
            }).then(function () {
                $rootScope.consentTypeActivateModal.close();
                $rootScope.unmaskLoading();
            });
        }


        //order set
        function OrderSetConsentPopUp() {
            var consentTypeListOrder = angular.copy(ctrl.consentTypeList);

            $rootScope.consentsOrderModal = $modal.open({
                templateUrl: 'consentsOrderModal',
                backdrop: false,
                size: 'md'
            });

            $rootScope.consentsOrderModal.consentTypeOrderedList = [];
            $rootScope.consentsOrderModal.title = 'Set Consents Order';

            $rootScope.consentsOrderModal.consentTypeListOrder = consentTypeListOrder;
            $rootScope.consentsOrderModal.OrderSelectedSave = [];
            $rootScope.consentsOrderModal.order = [];
            angular.forEach(consentTypeListOrder, function (item, i) {
                $rootScope.consentsOrderModal.OrderSelectedSave.push({
                    id: item.id,
                    order: i + 1  // Adding 1 to start order from 1
                });
            });

            initMultiSelect();

            $rootScope.consentsOrderModal.closePopup = function () {
                $rootScope.consentsOrderModal.close();
            }


            function initMultiSelect() {
                setTimeout(function () {
                    jQuery(document).ready(function ($) {
                        $("#nestable-list-1").on('nestable-stop', function (ev) {
                            var serialized = $(this).data('nestable').serialize(),
                                str = '';
                            str = iterateList(serialized, 0);

                            $("#nestable-list-1-ev").val(str);
                        });
                    });

                    function iterateList(items, depth) {
                        var str = '';
                        if (!depth)
                            depth = 0;
                        $rootScope.consentsOrderModal.OrderSelectedSave = [];
                        jQuery.each(items, function (i, obj) {
                            $rootScope.consentsOrderModal.OrderSelectedSave.push({
                                id: obj.item,
                                order: i + 1
                            });
                            if (obj.children) {
                                str += iterateList(obj.children, depth + 1);
                            }
                        });

                        return str;
                    }

                    jQuery.UIkit.nestable(jQuery('#nestable-list-1'));
                    jQuery.UIkit.nestable(jQuery('.grouped-nestables'), {
                        group: 'consents-list',
                        maxDepth: 1
                    });

                }, 1000);
            }

            $rootScope.consentsOrderModal.saveOrdersWithId = function () {
                ctrl.saveOrder($rootScope.consentsOrderModal.OrderSelectedSave);
            }
        }

        function saveOrder(OrderSelectedSave) {
            ConsentsDAO.order(OrderSelectedSave).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Order saved successfully.");
                $rootScope.consentsOrderModal.close();
                ctrl.retrieveConsentTypes();
                //Reset dirty status of form
                if ($.fn.dirtyForms) {
                    $('form').dirtyForms('setClean');
                    $('.dirty').removeClass('dirty');
                }
            }).catch(function (data, status) {
                toastr.error(data.data);
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {

                    }
                }); // showLoadingBar
                console.log('Error in save ordering')
            }).then(function () {
                $rootScope.unmaskLoading();
            });
        }

        function deletePopUp(consenttype, modal_id, action, modal_size, modal_backdrop) {
            $rootScope.deleteModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });

            $rootScope.deleteModal.action = action;
            $rootScope.deleteModal.consenttype = consenttype;
            $rootScope.deleteModal.title = 'Delete';

            $rootScope.deleteModal.confirm = function (consenttype) {

                ConsentsDAO.delete(consenttype).then(function (res) {
                    toastr.success("Consent Type " + action + "d.");
                    ctrl.retrieveConsentTypes();
                }).catch(function (data, status) {
                    toastr.error("Consent Type cannot be " + action + "d.");
                }).then(function () {
                    $rootScope.deleteModal.close();
                    $rootScope.unmaskLoading();
                });
            };

            $rootScope.deleteModal.dismiss = function () {
                $rootScope.deleteModal.close();
            }

        }

        initialize();

    }

    angular
        .module("xenon.controllers")
        .controller("ConsentsListCtrl", [
            "$rootScope",
            "$modal",
            "ConsentsDAO",
            ConsentsListCtrl,
        ]);
})();
