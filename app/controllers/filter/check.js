const mongoose = require("mongoose");
const async = require("async");

const helpers = require("./helpers");
const conn = require("./connection");

let Blacklist    = mongoose.model("BlacklistedIP");
let Whitelist    = mongoose.model("WhitelistedIP");
let GeoBlacklist = mongoose.model("GeoBlacklist");
let AsoBlacklist = mongoose.model("AsoBlacklist");

module.exports.checkFilter = (req, link, ip, connection, isOfferPage, usePage, cb) => {
  let isBannedReferrer = conn.isBannedReferer(req);
  let isBannedCache    = conn.isBannedCache(req);
  let isBannedISP      = conn.isBannedISP(connection);
  let isBannedHost     = conn.isBannedHost(connection);
  let isProxy          = conn.isProxy(connection);
  let passesLinkGeo    = helpers.checkLinkGeoCriteria(link, connection);

  let asoWildCard      = helpers.asoWildCardBlocking(connection);
  let device_os        = helpers.getUserAgent(req); // 4/16/2018 added by Jin

  // let block_corporate  = helpers.blockCorporate(connection); // 4/29/2019 added by Jin

  let trafficRecord = { req, ip, link, connection }

  if (usePage) {
    trafficRecord.filter = { usePage };
    return cb(usePage === 'dirty', trafficRecord);
  }

  // Link disabled
  if (!link.status && !isOfferPage)
    return cb(false, trafficRecord)
  
  // if (!isOfferPage && link.network === 'Outbrain') {
  //   let referer = req.get("referer");
    
  //   if (!referer || !referer.toLowerCase().includes('paid.outbrain.com')) 
  //     return cb(false, trafficRecord);
  // }
  if (!isOfferPage) {
    let referer = req.get("referer");
    if (link.network === 'Outbrain') {
      if (!referer || !referer.toLowerCase().includes('paid.outbrain.com'))
        return cb(false, trafficRecord);
    }
    if (link.network === 'Facebook') {
      if (!referer || !referer.toLowerCase().includes('m.facebook.com') || !referer.toLowerCase().includes('facebook.com'))
        return cb(false, trafficRecord)
    }
  }

  if (isBannedReferrer || isBannedISP || isProxy || isBannedHost || isBannedCache) {
    trafficRecord.filter = { isBannedReferrer, isBannedISP, isProxy, isBannedHost, isBannedCache };
    return cb(false, trafficRecord);
  }

  // No geodata
  if (!connection.location)
    return cb(false, trafficRecord);

  // Fails link geo restriction
  if (!passesLinkGeo) {
    trafficRecord.filter = { passesLinkGeo };
    return cb(false, trafficRecord);
  }

  // Blacklist first X
  if (link.auto_blacklist.length < link.auto_blacklist_count) {
    let alreadyAutoBL = link.auto_blacklist.includes(ip);

    if (alreadyAutoBL)
      trafficRecord.filter = { 'inBlacklist': true }
    else
      trafficRecord.filter = { 'autoblacklisted': true }

    if (!alreadyAutoBL) 
      Blacklist.autoblacklist(req, ip, link, connection);

    return cb(false, trafficRecord);
  }

  //4.16 2018 added by alexey
  //block when traffic is from Linux or Ubuntu
  if (device_os.indexOf('Linux') > -1 || device_os.indexOf('Ubuntu') > -1) {
    return cb(false, trafficRecord);
  }
  /*
    4.17 2018 added by Alex
    block when traffic is from MCI Communications Services
    let aso_string = 'MCI Communications Services, Inc.d/b/a Verizon Business';
    let aso_string_lowercase = aso_string.toLowerCase();
    let req_aso = connection.aso.toLowerCase();
    if (req_aso.includes(aso_string_lowercase))
      return cb(false, trafficRecord);
  */
  /* 3/1/2019 added by Jin
    block when traffic is from ASO contains "department or federal"
  */
  if (!asoWildCard) {
    return cb(false, trafficRecord);
  }

  // added by Jin 4/29/2019
  // when block_corporate is true, all traffic that has corporate as connection type will be banned
  if (link.block_corporate) {
    if (connection.type.toLowerCase() === 'corporate') {
      return cb(false, trafficRecord)
    }
  }

  //4.20/2018 added by Alexey
  //block when traffic is coming using firefox 10
  if (device_os.includes('Firefox 10')) {
    return cb(false, trafficRecord);
  }
  //4.26 2018 added by Jin
  if (device_os.includes('Firefox 51')) {
    return cb(false, trafficRecord);
  }
  /*
    12.19 2018 added by Jin
    block when facebook crawler is detected
    facebookexternalhit/1.1 or facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)
  */
  if (req.headers['user-agent'].includes('facebookexternalhit/1.1')) {
    return cb(false, trafficRecord);
  }
  
  // 4/29/2019 added by Jin
  async.parallel({
    "isWhiteListed": done => {
      Whitelist.findOne({ ip }, (err, doc) => done(err, !!doc));
    },
    "inBlacklist": done => {
      if (!link.use_ip_blacklist)
        Blacklist.findOne({ ip }, 'ip', done);
      else
        done(null, false);
    },
    "inAsoBlacklist": done => {
      AsoBlacklist.find().exec((err, asoBlackList) => {
        if (!err)
          done(null, helpers.inAsoBlacklist(asoBlackList, connection))
        else 
          done(err);
      });
    },
    "inGeoBlacklist": done => {
      GeoBlacklist.find().exec((err, geoBlackList) => {
        if (!err)
          done(null, helpers.inGeoBlacklist(geoBlackList, connection))
        else 
          done(err);
      });
    }
  }, (err, r) => {
    if (err) {
      console.error("Error filtering", err);
      return cb(false, trafficRecord);
    }

    let passes = r.isWhiteListed || (!r.inBlacklist && !r.inGeoBlacklist && !r.inAsoBlacklist);
    trafficRecord.filter = r;

    cb(passes, trafficRecord);
  });
}