(function() {

  angular.module("app")
    .service("AsoBlacklist", ["$http", "$window", "appConfig", "AuthenticationService", AsoBlacklistService]);

  function AsoBlacklistService($http, $window, appConfig, AuthenticationService) {

    function apiUrl(path) {
      return appConfig.server + "/api" + path;
    }

    this.isValid = function (aso) {
      return (aso.aso != "");
    }

    this.getPage = function (page, limit, sort, keyword, callback) {
      var data = {
        page: page,
        pagesize: limit
      };

      if (sort) data.sort = sort;
      if (keyword) data.keyword = keyword;

      $http
        .post(apiUrl("/asoblacklist/page"), data)
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    }

    this.get = function (id, callback) {
      if (!id) {
        callback({ id: false });
      }
      
      $http
        .get(apiUrl("/asoblacklist/" + id))
        .then(response => {
          callback(response.data);
        })
        .catch(response => {
          AuthenticationService.checkAuth(response);
        });
    }

    this.newOrUpdate = function (aso, success, error) {
      if (!this.isValid(aso)) {
        if (error) {
          error();
        }
        return;
      }
      
      $http
        .post(apiUrl("/asoblacklist"), aso)
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success(response);
            }
          }
        })
        .error(response => {
          if (error) {
            error(response);
          }
        });
    }

    this.delete = function (id, success, error) {
      if (!id) {
        if (error) {
          error();
        }
        return;
      }
      
      $http.post(
        apiUrl("/asoblacklist/delete"),
        { _id: id }
      )
        .success(response => {
          if (AuthenticationService.checkAuth(response)) {
            if (success) {
              success();
            }
          }
        })
        .error(response => {
          if (error) {
            error();
          }
        });
    }

    // this.exportCSV = function () {
    //   $window.location.href = apiUrl("/geoblacklist/export");
    // }
  }

})();