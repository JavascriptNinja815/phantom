(function () {
  "use strict";

  angular.module("app.asoblacklist", [])
    .controller("AsoBlacklistListCtrl", ["$scope", "$filter", "$location", "$mdDialog", "AsoBlacklist", "Dialog", AsoBlacklistListCtrl])
    .controller("AsoBlacklistEditCtrl", ["$scope", "$state", "$location", "$mdDialog", "$stateParams", "AsoBlacklist", "Networks", "Dialog", AsoBlacklistEditCtrl])
    
  function AsoBlacklistListCtrl($scope, $filter, $location, $mdDialog, AsoBlacklist, Dialog) {
    $scope.items = [];
    $scope.orderCol = "";
    $scope.numPerPageOpt = [3, 5, 10, 20];
    $scope.numPerPage = $scope.numPerPageOpt[2];
    $scope.currentPage = 1;
    $scope.total = 0;
    $scope.searchKeyword = "";
    $scope.searchUpdating = false;
    $scope.userRole = authData.role;

    $scope.select = select;
    $scope.onNumPerPageChange = onNumPerPageChange;
    $scope.order = order;
    $scope.searchKeywordChange = searchKeywordChange;

    $scope.gotoCreatePage = gotoCreatePage;
    $scope.editAso = editAso;
    $scope.deleteAso = deleteAso;

    function select(page) {
      refresh(page);
    }

    function onNumPerPageChange() {
      select(1);
    }

    function order(colName) {
      if ($scope.orderCol === colName) {
        return;
      }
      $scope.orderCol = colName;
      select(1);
    }

    function searchKeywordChange() {
      $scope.searchUpdating = true;
      select(1);
    }

    function gotoCreatePage() {
      $location.path("/asoblacklist/new");
    }

    function editAso(id) {
      if($scope.userRole != "admin") {
        return;
      }
      $location.path("/asoblacklist/" + id + "/edit");
    }

    function deleteAso(ev, id) {
      ev.stopPropagation();
      ev.preventDefault();
      Dialog.showConfirm(ev, "Are you sure to remove this ASO from blacklist?", () => {

        AsoBlacklist.delete(id, () => refresh(), () => {
          Dialog.showAlert(ev, "Request to remove ASO from blacklist has failed.");
        });

      });
    }

    function refresh(page) {
      if(!page) {
        page = $scope.currentPage;
      }
      AsoBlacklist.getPage(page, $scope.numPerPage, $scope.orderCol, $scope.searchKeyword, function(result) {
        $scope.items = result.items;
        $scope.currentPage = (result.page) ? result.page : 1;
        $scope.total = (result.total) ? result.total : 0;
        $scope.pages = (result.pages) ? result.pages : 0;
        $scope.searchUpdating = false;
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      });
    }

    function _init() {
      refresh();
    }

    _init();
  }

  function AsoBlacklistEditCtrl($scope, $state, $location, $mdDialog, $stateParams, AsoBlacklist, Dialog) {
    
    $scope.title = "Add an ASO to Blacklist";
    $scope.submitButtonTitle = "Create";
    $scope.aso = {};
    $scope.goBack = goBack;
    $scope.submit = ev => {
      ev.stopPropagation();
      ev.preventDefault();

      if (!AsoBlacklist.isValid($scope.aso))
        return Dialog.showAlert(ev, "One of the fields are empty. Please check before submit.");

        AsoBlacklist.newOrUpdate($scope.aso, () => {
          $location.path('/asoblacklist/list');
        }, () => {
          Dialog.showAlert(ev, 'Request to add/update blacklisted ASO has failed.');
        });
    };
    
    function goBack() {
      $location.path("/asoblacklist/list");
    }

    function _init() {
      if($stateParams.id) {
        $scope.title = "Edit Blacklisted ASO";
        $scope.submitButtonTitle = "Update";

        AsoBlacklist.get($stateParams.id, data => {
          $scope.aso = data.item
          $(".cl-panel-loading").removeClass("cl-panel-loading");
        });
      } else {
        console.log("no params");
        // if($state.selectedASOs) {
        //   $scope.aso.aso = $state.selectedASOs.join(", ");
        //   $state.selectedASOs = false;
        // }
        $(".cl-panel-loading").removeClass("cl-panel-loading");
      }
    }

    _init();
  }

})(); 
