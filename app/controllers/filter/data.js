// Hostnames: anon-45-145.vpn.ipredator.se	


exports.banned_referers = [
  "doctorwho.outbrain.com", 
  "freevpn.ninja",
  "outbrain.my.salesforce.com",
  "paid.outbrain.com/network/redir?p=TV-",
  "trc.taboola.com/notarealpub", //added by Alexey 4.17
  "http://ocean.taboolasyndication.com", //added by Alexey 4.20
  // "http://trc.taboola.com/taboola-display-fallback", //added by Alex 4.21
  "https://backstage.taboola.com/backstage", //added by Alex 4.23
  'localhost',
  '127.0.0.1'
];

// TODO
exports.banned_referers_entire = [
  'https://paid.outbrain.com'
]

exports.banned_hosts = [
  "outbrain"
]


exports.banned_isps = [
  "digital ocean",
  "amazon",
  "taboola",
  "websense",
  "admin lan",
  "smile communications",
  "internap",
  "rcn",
  "Google",
  "Anonymizer",
  "scansafe",
  "GoDaddy",
  'YANDEX LLC',
  "DomainTools, LLC",
  'EGIHosting'
];
