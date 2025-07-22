(function () {
    function ViewLanguagesCtrl(LanguageDAO, $rootScope, $stateParams, $state, $modal, Page, $debounce, $timeout, $formService) {
        var ctrl = this;
        
        function initialize(){
            $rootScope.maskLoading();
            Page.setTitle("Languages");
            ctrl.companyCode = ontime_data.company_code;
            ctrl.baseUrl = ontime_data.weburl;

            ctrl.languageList = [];
            
            ctrl.retrieveLanguages = retrieveLanguagesData;
            ctrl.activateDeactivatePopup = activateDeactivatePopup;
            ctrl.activateDeactivateLanguage = activateDeactivateLanguage;
            //ctrl.changeStatus = changeStatus;
            ctrl.retrieveLanguages();
        }

        function retrieveLanguagesData(){

            LanguageDAO.view({subAction: 'all'}).then(function (res) {
                showLoadingBar({
                    delay: .5,
                    pct: 100,
                    finish: function () {
                    }
                }); // showLoadingBar
                ctrl.languageList = res;
            }).catch(function (data, status) {
                toastr.error("Failed to retrieve languages.");
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

        function activateDeactivatePopup(language, modal_id, action, modal_size, modal_backdrop)
        {
            $rootScope.languageActivateModal = $modal.open({
                templateUrl: modal_id,
                size: modal_size,
                backdrop: typeof modal_backdrop == 'undefined' ? true : modal_backdrop,
                keyboard: false
            });
            
            $rootScope.languageActivateModal.action = action;
            $rootScope.languageActivateModal.language = language;
            
            if(action == 'activate'){
                $rootScope.languageActivateModal.title = 'Activate Language';
            }else{
                $rootScope.languageActivateModal.title = 'Deactivate Language';
            }
            

            $rootScope.languageActivateModal.confirm = function (language) {
                ctrl.activateDeactivateLanguage(language, action);
            };

            $rootScope.languageActivateModal.dismiss = function(){
                $rootScope.languageActivateModal.close();
            }

        }

        function activateDeactivateLanguage(language, action){
            LanguageDAO.changestatus({id: language.id, status: action}).then(function (res) {
                toastr.success("Language " + action + "d.");
                ctrl.retrieveLanguages();
            }).catch(function (data, status) {
                toastr.error("Language cannot be " +  action  + "d.");
            }).then(function () {
                $rootScope.languageActivateModal.close();
                $rootScope.unmaskLoading();
            });
        }

        initialize();
    };

    angular.module('xenon.controllers').controller('ViewLanguagesCtrl', ["LanguageDAO", "$rootScope", "$stateParams", "$state", "$modal", "Page", "$debounce", "$timeout", "$formService", ViewLanguagesCtrl]);
})();