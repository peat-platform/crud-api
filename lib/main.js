/*
 * openi_data_api
 * openi-ict.eu
 *
 * Copyright (c) 2013 dmccarthy
 */

'use strict';

var zmq    = require('m2nodehandler');
var helper = require('./helper.js');
var rrd    = require('openi_rrd');

var crudApi = function(config) {

   helper.init(config.logger_params);
   rrd.init("crud");
   zmq.addPreProcessFilter(rrd.filter);

   var senderToDao    = zmq.sender(config.dao_sink);
   var senderToClient = zmq.sender(config.mongrel_handler.sink);

   zmq.receiver(config.mongrel_handler.source, config.mongrel_handler.sink, function(msg) {
      helper.processMongrel2Message(msg, senderToDao, senderToClient, config.mongrel_handler.sink);
   });
};


module.exports = crudApi;