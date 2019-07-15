const async = require("async");
const moment = require("moment");
const json2csv = require("json2csv");
const useragent = require("useragent");
const helpers = require("./helpers.js");
const url = require("url");

const mongoose = require('mongoose');
const ConversionTraffic = mongoose.model('Traffic-Offer');

function parseUserAgent(userAgent) {
  let agent = useragent.parse(userAgent);

  if (userAgent && userAgent.includes('outbrain')) 
    return { 'browser': 'Outbrain Bot' }

  let browser_family = agent.family || "";

  if (browser_family.includes("UIWebView")) 
    browser_family = browser_family.replace("Mobile Safari ", "");

  browser_family = browser_family.replace('Safari UI/WKWebView', 'WKWebView')
  browser_family = browser_family.replace(/(Mobile)|(Internet)/g, "").trim();

  let browser = browser_family;
  let os = agent.os.family;

  if (parseInt(agent.major, 10)) browser += ' ' + agent.major;
  if (parseInt(agent.os.major, 10)) os += ' ' + agent.os.major;
  return { browser, os };
}

function getBaseQuery(req) {
  var { start, from, to, format } = req.query;
  var base = {};

  if (start && format !== 'csv') {
    base.access_time = {
      "$lte": new Date(parseInt(start))
    };
  }

  if (!start && (from || to)) {
    base.access_time = {};

    if (from)
      base.access_time["$gte"] = new Date(parseInt(from));

    if (to)
      base.access_time["$lte"] = new Date(parseInt(to));
  }


  if (req.query.country)
    base['connection.location'] = new RegExp(req.query.country);

  base.converted = {
    "$eq": true
  }

  return base;
}
function formatTrafficRecord(t) {
  let parsed = url.parse('http://'+t.url);
  let originalUrl = parsed.pathname;

  if (t.url_query)
    originalUrl += '?' + t.url_query;

  let short_location = (t.connection.location || '').trim();
  short_location = short_location.replace(/(, United States|\d)/, "");

  let hostnames = (t.connection.hostnames || '')

  let hostnameRegExs = ['\\d', '\\.{2,}', '-{2,}' , '-\\.', '^\\.']

  hostnameRegExs.map(regEx => {
    hostnames = hostnames.replace(new RegExp(regEx, 'g'), '')
  })

  let extra = Object.assign({
    'url_domain': parsed.hostname.replace('www.', ''),
    'url_path': originalUrl,
    'numHostnames': hostnames ? hostnames.split(',').length : 0,
    short_location,
    hostnames
  }, parseUserAgent(t.headers['user-agent']));

  if (t.link_generated) {
    extra.keywords = helpers.getUTMKeyWords(t.link_generated);
    extra.short_generated = helpers.parseGenerated(t.link_generated);
  }

  let referer = url.parse(t.headers.referer || '').hostname || '';

  extra.domain_referer = referer ? referer.replace("www.", "") : '';

  return Object.assign({}, t._doc, extra || {});
}

function formatTrafficRecordCSV(t) {
  delete t._id;
  t.access_time = moment(t.access_time).format('MM-DD-YYYY h:mm:ss a');
  t.result = 'Converted';

  t.userAgent = parseUserAgent(t.headers['user-agent']);

  return t;
}

function getConversionResult(res, format, err, results) {
  if (err) {
    console.error(err);
    return res.sendStatus(500);
  }
  var traffics = [];

  results.traffics.on("data", t => {
    if (format === 'csv')
      traffics.push(formatTrafficRecordCSV(t._doc));
    else
    traffics.push(formatTrafficRecord(t))
  });


  results.traffics.on("end", () => {
    if (format === "csv") {
      res.setHeader("Content-disposition", "attachment; filename=conversionTraffic.csv");

      res.write(
        json2csv({
          "data": traffics,
          'flatten': true
        })
      );
      res.end();
    } else {
      res.json({
        "traffics": traffics,
        "total": results.total || 0
      });
    }
  });
}
function getTraffics(req, res, model) {
  let { limit, format } = req.query;
  limit = limit ? parseInt(limit) : 10;

  if (format === 'csv') limit = 60000;

  let query = {};
  let base = getBaseQuery(req);
  let hasBase = Object.keys(base).length;

  if (hasBase) {
    query = base;
  }

  async.parallel({
    "total": cb => {
      model.count(query, cb);
    },
    "traffics": cb => {
      let cursor = model
        .find(query)
        .sort("-access_time")
        .batchSize(Math.min(20000, limit))
        .limit(limit)
        .cursor();

        cb(null, cursor);
    }

  }, (err, results) => {
    getConversionResult(res, format, err, results)
  });
}
function getConversionTraffics(req, res) {
  getTraffics(req, res, ConversionTraffic);
}
module.exports = {
  getConversionTraffics
};