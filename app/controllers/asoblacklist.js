var multiparty = require("multiparty");

var helpers = require("./helpers");

var mongoose = require("mongoose");
var AsoBlacklist = mongoose.model("AsoBlacklist");

var asoBlacklistController = function() {

  this.getAsoBlacklist = function(req, res) {
    var page = req.body.page;
    var pagesize = req.body.pagesize;
    var params = { 
      page: parseInt(page), 
      limit: parseInt(pagesize)
    };
    if(req.body.sort) {
      params.sort = req.body.sort;
    }
    var query = {};
    var keyword = req.body.keyword;
    var query = helpers.formSearchQuery(keyword, "aso");
    query = helpers.formSearchQuery(keyword, "description", query);
    
    AsoBlacklist.paginate(query, params, function(err, result) {
      var return_value = {};
      if(result) {
        return_value.items = result.docs;
        return_value.total = result.total;
        return_value.limit = result.limit;
        return_value.page = result.page;
        return_value.pages = result.pages;
      } else {
        return_value.items = [];
        return_value.total = 0;
        return_value.limit = pagesize;
        return_value.page = 1;
        return_value.pages = 0;
      }
      res.json(return_value);
    });
  }

  this.getAsoBlacklistItem = function(req, res) {
    var id = req.params.id;
    AsoBlacklist.findById(id, function(err, doc) {
      if(err) {
        console.error(err);
        res.json({ id: false });
        return;
      }
      res.json({
        item: doc
      });
    });
  }

  function updateExistingAsoBlacklistItem(res, id, editingAso) {
    AsoBlacklist.findByIdAndUpdate(id, editingAso, function(err, doc) {
      if(err) {
        res.json({ 
          id: false,
          result: false
        });
        return;
      }
      res.json({
        result: true,
        item: doc
      });
    });
  }

  function addAsoBlacklistItem(res, data) {
    AsoBlacklist.create(data, function(err) {
      res.json({ result: !err });
    });
  }

  this.editAsoBlacklistItem = function(req, res) {
    var data = {
      aso: req.body.aso.toUpperCase(),
      description: req.body.description
    };
    if(req.body._id) {
      if(req.session.role == "admin") {
        updateExistingAsoBlacklistItem(res, req.body._id, data);
      } else {
        res.status(401).json({ "message": "API access unauthorized" });
      }
    } else {
      addAsoBlacklistItem(res, data);
    }
  }

  this.deleteAsoBlacklistItem = function(req, res) {
    var rst = { result: false };
    if(req.session.role != "admin") {
      res.status(401).json({ "message": "API access unauthorized" });
      return;
    }
    if(req.body._id) {
      AsoBlacklist.findByIdAndRemove(req.body._id, function(err) {
        if(err) {
          console.error(err);
          res.json(rst);
          return;
        }
        rst.result = true;
        res.json(rst);
      });
    } else {
      res.json(rst);
    }
  }

}

module.exports = new asoBlacklistController();
