/*
 Copyright © 2017 World Wide Web Consortium, (Massachusetts Institute of Technology,
 European Research Consortium for Informatics and Mathematics, Keio University, Beihang).
 All Rights Reserved.

 This work is distributed under the W3C® Software License [1] in the hope that it will
 be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

 [1] http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231
*/

const references = require('./utils/reference.js');
const  URL = require("./utils/url.js");

var Links = {};

function getEntry(ar, key) {
  var entry = ar[key];
  if (entry === undefined) {
    entry = [];
    ar[key] = entry;
  }
  return entry;
}

function getNormativeHref(document, url) {
  var docURL = URL.hostPath(url);
  var anchors = null;
  if(document.querySelector("body main")) {
    anchors = document.querySelectorAll("body main a[href]");
  } else {
    anchors = document.querySelectorAll("a[href]");
  }

  var normative_anchors = {
    unknown: [],
    known: []
  };
  anchors.forEach(anchor => {
    if (!anchor.href) return; // https://drafts.csswg.org/css-transforms-1/
    var href = URL.hostPath(anchor.href);
    if (!href.startsWith(docURL)) {
      if (references.isNormativeReference(anchor)) {
        getEntry(normative_anchors.known, href).push(anchor);
      } else if (!references.isInformative(anchor) && !references.isInInformative(anchor)) {
        getEntry(normative_anchors.unknown, href).push(anchor);
      }
    }
  });
  return normative_anchors;
}

var deprecatedServices = [
  "dvcs.w3.org", "w3.org/Bugs/", "dev.w3.org"
]

function getHTMLLinks(document) {
  var anchors = document.querySelectorAll("a[href]");
  var html = [];
  anchors.forEach(anchor => {
    if (!anchor.href) return;
    if (anchor.href.match(new RegExp("^https://www.w3.org/TR/([0-9]+/)?((WD-)|(CR-)|(PR-)|(REC-))?html"))) {
      getEntry(html, anchor.href).push(anchor);
    }
    if (anchor.href.match(new RegExp("^https://www.w3.org/TR/([0-9]+/)?((WD-)|(CR-)|(PR-)|(REC-))?dom"))) {
      getEntry(html, anchor.href).push(anchor);
    }
  });
  return html;
}

function getDeprecatedLinks(document) {
  var anchors = document.querySelectorAll("a[href]");
  var deprecated = [];
  anchors.forEach(anchor => {
    if (!anchor.href) return;
    var href = URL.hostPath(anchor.href);
    var match = false;
    deprecatedServices.forEach(s => {
      if (href.indexOf(s) != -1)
        match = true;
    });
    if (match) {
      getEntry(deprecated, href).push(anchor);
    }
  });
  return deprecated;
}

Links.isBikeshed = function (document) {
  return (document.querySelector("*[data-fill-with]") !== null);
}

Links.isRespec = function (document) {
  return (document.querySelector("script.remove") !== null);
}

Links.getLinks = function(document, url) {
  var found = references.init(document);
  var anchors = getNormativeHref(document, url);
  anchors.foundNormativeSection = found;
  anchors.deprecated = getDeprecatedLinks(document);
  anchors.html = getHTMLLinks(document);
  return anchors;
};

module.exports = Links;
