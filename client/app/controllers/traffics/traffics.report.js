(() => {
  angular.module("app.traffics.report", [])
    .controller("TrafficsReportCtrl", ["$scope", "$stateParams", "Traffics", "Links", TrafficsReportCtrl]);

  function TrafficsReportCtrl($scope, $stateParams, Traffics, Links) {
    var $loading = $(".cl-panel-loading");

    Object.assign($scope, {
      starts: [],
      links: [],
      traffics: [],
      numPerPageOpt: [20, 50, 100, 200, 300, 400, 500],
      numPerPage: 100,
      total: 0,
      perPageSelected: true,
      searchUpdating: false,
      onNumPerPageChange: () => refresh(),

      page: () => $scope.starts.length + 1,

      dateSelected: () => $scope.fromDate || $scope.toDate,
      date: refresh,

      searchKeywordChange: () => {
        $scope.searchUpdating = true;
        $scope.firstPage();
      },

      hasPrev: () => !!$scope.starts.length,
      hasNext: () => Math.ceil($scope.total / $scope.numPerPage) !== $scope.starts.length,

      firstPage: () => {
        $scope.starts = [];

        refresh();
      },

      prevPage: () => {
        $scope.starts.pop();

        refresh(
          $scope.starts.length ? $scope.starts[$scope.starts.length - 1] : 0
        );
      },

      nextPage: () => {
        var time = +new Date($scope.traffics[$scope.traffics.length - 1].access_time);

        $scope.starts.push(time);

        refresh(time);
      },

      onSuccess: e => {
        var $el = $(e.trigger);
        var $next = $el.next();

        $el.hide();
        $next.fadeIn(1000);

        window.setTimeout(() => {
          $next.hide();
          $el.fadeIn(1000);
        }, 2000);
      },

      export: () => {
        Traffics.exportReport(buildQuery());
      },
      reload: () => refresh()
    });

    function buildQuery(start) {
      return {
        start,
        "links": $scope.links.map(l => l.id).join(","),
        "limit": $scope.numPerPage,
        "from": $scope.fromDate ? +$scope.fromDate : null,
        "to": $scope.toDate ? +$scope.toDate : null
      };
    }

    function refresh(start) {
      let query = buildQuery(start);

      $scope.traffics = [];
      $loading.addClass("cl-panel-loading");

      Traffics.getReport(query, result => {
        result.traffics.map(l => {
          l.icon = 'check-circle';
        })

        $scope.traffics = result.traffics;
        $scope.currentPage = result.page || 1;
        $scope.total = result.total || 0;
        $scope.pages = result.pages || 0;
        $scope.searchUpdating = false;

        $loading.removeClass("cl-panel-loading");
      });
    }

    if ($stateParams.linkID) {
      Links.get($stateParams.linkID, data => {
        let link = {
          "id": data.link._id,
          "text": data.link.link_safe,
          "desc": data.link.description
        }

        console.dir(link);

        $scope.links.push(link);
        refresh();
      });
    } else {
      refresh();
    }
  }
})();