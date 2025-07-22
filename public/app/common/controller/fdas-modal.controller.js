(function () {
    function FdasModalCtrl(
        $rootScope,
        $filter,
        $timeout,
        $scope,
        editMode,
        $modalInstance,
        MedicationBankRecordDAO,
    ) {
        "use strict";
        var ctrl = this;

        ctrl.editMode = editMode;
        if (ctrl.editMode == undefined) {
            ctrl.title = 'Add New Medication';
            ctrl.fdatype = { title: "", fdasDescription: "", isActive: true };
            ctrl.action = 'savefdatype';
        } else {
            ctrl.title = 'Edit Medication Type';
            ctrl.fdatype = '';
            ctrl.action = 'updatefdatype';
        }

        ctrl.medicationsData = [];

        ctrl.fdasModalForm = {
            medication: [], // Initialize with an empty array
            id: '',
            medicineName: '',
            medicationOther: '',
            dosageQuantity: '',
            dosageQuantityUnit: 'mg',
            type: 'Tablet',
            purpose: '',
            sideEffects: '',
            contraindication: '',
            source: 'DRUGS',
            sourceId: null
        };

        function initialize() {
            ctrl.fdaTypeList = [];
            ctrl.save = save;
            ctrl.cancel = cancel;
            ctrl.savefda = savefda;
            ctrl.update = update;
            ctrl.medicationChangePopulateCall = medicationChangePopulate;
            ctrl.medicationChangePopulateCall();
            refreshType();
            refreshUnit();
        }

        function refreshSelect2(id, placeholder) {
            $timeout(function () {
                $('#' + id).select2({
                    placeholder: placeholder,
                }).on('select2-open', function () {
                    $(this).data('select2').results.addClass('overflow-hidden').perfectScrollbar();
                });
            }, 200);
        }

        function refreshType() {
            refreshSelect2('type', 'Select Type');
        }

        function refreshUnit() {
            refreshSelect2('dosageQuantityUnit', 'Select unit');
        }

        function medicationChangePopulate(id) {

            refreshSelect2('medications', 'Select Medication');

            // Find the selected medication based on its ID
            var selectedMedication = ctrl.medicationsData.find(function (item) {
                return item.id == id;
            });

            if (selectedMedication && selectedMedication.id != 'Other') {
                ctrl.fdasModalForm.medication = selectedMedication;
                ctrl.fdasModalForm.id = selectedMedication.id;
                ctrl.fdasModalForm.medicineName = selectedMedication.genericName;
                ctrl.fdasModalForm.source = "DRUGS";
                ctrl.fdasModalForm.sourceId = selectedMedication.srcId;
                ctrl.fdasModalForm.dosageQuantity = '';
                ctrl.fdasModalForm.dosageQuantityUnit = 'mg';
                ctrl.fdasModalForm.type = 'Tablet';
                ctrl.fdasModalForm.purpose = '';
                ctrl.fdasModalForm.sideEffects = '';
                ctrl.fdasModalForm.contraindication = '';

                refreshType();
                refreshUnit();
            } else if (id === 'Other') {
                ctrl.fdasModalForm.medication = [];
                ctrl.fdasModalForm.dosageQuantity = '';
                ctrl.fdasModalForm.dosageQuantityUnit = 'mg';
                ctrl.fdasModalForm.type = 'Tablet';
                ctrl.fdasModalForm.purpose = '';
                ctrl.fdasModalForm.sideEffects = '';
                ctrl.fdasModalForm.contraindication = '';
                ctrl.fdasModalForm.source = "MANUAL";
                ctrl.fdasModalForm.sourceId = null;

                refreshType();
                refreshUnit();
            }

        }


        $scope.initializeSelect2 = function () {
            $timeout(function () {
                $('.itemSearch').select2({
                    multiple: false,
                    allowClear: true,
                    ajax: {
                        url: ontime_data.weburl + 'drugs',
                        dataType: 'json',
                        params: {
                            headers: {
                                "Authorization": getCookie("token"),
                                'company_code': ontime_data.company_code,
                                'requestToken': getCookie("token"),
                                'userName': getCookie("un")
                            }
                        },
                        delay: 500,
                        data: function (params) {
                            return {
                                pageNumber: 1,
                                pageSize: 15,
                                search: params
                            };
                        },
                        results: function (data) {
                            ctrl.medicationsData = [];
                            ctrl.fdaTypeList = [];

                            ctrl.medicationsData = data;
                            ctrl.fdaTypeList = data;
                            ctrl.fdaTypeList.unshift({ id: 'Other', genericName: 'OTHER' });
                            const results = ctrl.fdaTypeList.map(item => ({
                                id: item.id,
                                text: item.genericName || ''
                            }));

                            return {
                                results: results,
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 1,
                    placeholder: 'Search for medication...'
                })
            });
        };

        $scope.initializeSelect2();

        function cancel() {
            $modalInstance.close({ reverse: true });
        };

        function save() {
            if ($('#fdatype_form')[0].checkValidity()) {
                let fdasModalFormSave = angular.copy(ctrl.fdasModalForm);
                if (ctrl.action == "savefdatype") {
                    delete fdasModalFormSave.medication;
                    if (fdasModalFormSave.medicationOther != '') {
                        fdasModalFormSave.medicineName = fdasModalFormSave.medicationOther;
                        fdasModalFormSave.id = '';
                    }
                    delete fdasModalFormSave.medicationOther;

                    ctrl.savefda(JSON.stringify(fdasModalFormSave));
                } else {
                    delete fdasModalFormSave.medication;
                    if (fdasModalFormSave.medicationOther != '') {
                        fdasModalFormSave.medicineName = fdasModalFormSave.medicationOther;
                    }
                    delete fdasModalFormSave.medicationOther;
                }
            }
        }

        function savefda(fdatype) {
            $rootScope.maskLoading();
            MedicationBankRecordDAO.saveRecord(fdatype).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Medication Saved.");
                $modalInstance.close({ reverse: false, fdaSet: res });
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

        function update(fdatype) {
            $rootScope.maskLoading();
            MedicationBankRecordDAO.saveRecord(fdatype).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                toastr.success("Medication Type updated.");
                $modalInstance.close({ reverse: false, fdaSet: true });
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

        ctrl.typeList = [
            "Aerosol",
            "Bar, Chewable",
            "Bead",
            "Capsule",
            "Capsule, Coated",
            "Capsule, Coated Pellets",
            "Capsule, Coated, Extended Release",
            "Capsule, Delayed Release",
            "Capsule, Delayed Release Pellets",
            "Capsule, Extended Release",
            "Capsule, Film Coated, Extended Release",
            "Capsule, Gelatin Coated",
            "Capsule, Liquid Filled",
            "Cellular Sheet",
            "Chewable Gel",
            "Cloth",
            "Concentrate",
            "Cream",
            "Cream, Augmented",
            "Crystal",
            "Disc",
            "Douche",
            "Dressing",
            "Drug-Eluting Contact Lens",
            "Elixir",
            "Emulsion",
            "Enema",
            "Extract",
            "Fiber, Extended Release",
            "Film",
            "Film, Extended Release",
            "Film, Soluble",
            "For Solution",
            "For Suspension",
            "For Suspension, Extended Release",
            "Gas",
            "Gel",
            "Gel, Dentifrice",
            "Gel, Metered",
            "Globule",
            "Granule",
            "Granule, Delayed Release",
            "Granule, Effervescent",
            "Granule, For Solution",
            "Granule, For Suspension",
            "Granule, For Suspension, Extended Release",
            "Gum, Chewing",
            "Implant",
            "Inhalant",
            "Injectable Foam",
            "Injectable, Liposomal",
            "Injection",
            "Injection, Emulsion",
            "Injection, Lipid Complex",
            "Injection, Powder, For Solution",
            "Injection, Powder, For Suspension",
            "Injection, Powder, For Suspension, Extended Release",
            "Injection, Powder, Lyophilized, For Liposomal Suspension",
            "Injection, Powder, Lyophilized, For Solution",
            "Injection, Powder, Lyophilized, For Suspension",
            "Injection, Powder, Lyophilized, For Suspension, Extended Release",
            "Injection, Solution",
            "Injection, Solution, Concentrate",
            "Injection, Suspension",
            "Injection, Suspension, Extended Release",
            "Injection, Suspension, Liposomal",
            "Injection, Suspension, Sonicated",
            "Insert",
            "Insert, Extended Release",
            "Intrauterine Device",
            "Irrigant",
            "Jelly",
            "Kit",
            "Liniment",
            "Lipstick",
            "Liquid",
            "Liquid, Extended Release",
            "Lotion",
            "Lotion, Augmented",
            "Lotion/Shampoo",
            "Lozenge",
            "Mouthwash",
            "Not Applicable",
            "Oil",
            "Ointment",
            "Ointment, Augmented",
            "Paste",
            "Paste, Dentifrice",
            "Pastille",
            "Patch",
            "Patch, Extended Release",
            "Patch, Extended Release, Electrically Controlled",
            "Pellet",
            "Pellet, Implantable",
            "Pellets, Coated, Extended Release",
            "Pill",
            "Plaster",
            "Poultice",
            "Powder",
            "Powder, Dentifrice",
            "Powder, For Solution",
            "Powder, For Suspension",
            "Powder, Metered",
            "Ring",
            "Rinse",
            "Salve",
            "Shampoo",
            "Shampoo, Suspension",
            "Soap",
            "Solution",
            "Solution, Concentrate",
            "Solution, For Slush",
            "Solution, Gel Forming / Drops",
            "Solution, Gel Forming, Extended Release",
            "Solution/Drops",
            "Sponge",
            "Spray",
            "Spray, Metered",
            "Spray, Suspension",
            "Stick",
            "Strip",
            "Suppository",
            "Suppository, Extended Release",
            "Suspension",
            "Suspension, Extended Release",
            "Suspension/Drops",
            "Swab",
            "Syrup",
            "System",
            "Tablet",
            "Tablet, Chewable",
            "Tablet, Chewable, Extended Release",
            "Tablet, Coated",
            "Tablet, Coated Particles",
            "Tablet, Delayed Release",
            "Tablet, Delayed Release Particles",
            "Tablet, Effervescent",
            "Tablet, Extended Release",
            "Tablet, Film Coated",
            "Tablet, Film Coated, Extended Release",
            "Tablet, For Solution",
            "Tablet, For Suspension",
            "Tablet, Multilayer",
            "Tablet, Multilayer, Extended Release",
            "Tablet, Orally Disintegrating",
            "Tablet, Orally Disintegrating, Delayed Release",
            "Tablet, Soluble",
            "Tablet, Sugar Coated",
            "Tablet With Sensor",
            "Tampon",
            "Tape",
            "Tincture",
            "Troche",
            "Wafer"
        ];
        

        ctrl.unitList = [
            "AU",
            "Amb'a'1'U",
            "BAU",
            "arb'U",
            "CCID_50",
            "CFU",
            "Ci",
            "d",
            "D'ag'U",
            "dL",
            "FFU",
            "GC",
            "g",
            "hp_C",
            "kp_C",
            "hp_M",
            "hp_Q",
            "hp_X",
            "h",
            "iU",
            "kg",
            "Lf",
            "L",
            "uCi",
            "ug",
            "uL",
            "umol",
            "um",
            "mCi",
            "meq",
            "mg",
            "mL",
            "mm",
            "mmol",
            "min",
            "mol",
            "mo",
            "ng",
            "nmol",
            "PFU",
            "PNU",
            "s",
            "cm2",
            "TCID_50",
            "U",
            "USP'U",
            "VP",
            "wk",
            "a"
        ];
        

        initialize();

    }

    angular
        .module("xenon.controllers")
        .controller("FdasModalCtrl", [
            "$rootScope",
            "$filter",
            "$timeout",
            "$scope",
            "editMode",
            "$modalInstance",
            "MedicationBankRecordDAO",
            FdasModalCtrl,
        ]);
})();
