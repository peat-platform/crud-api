/*
 * openi_data_api
 * openi-ict.eu
 *
 * Copyright (c) 2013 dmccarthy
 */

'use strict';

var openiLogger  = require('openi-logger');
var openiUtils   = require('openi-cloudlet-utils');
var zmq          = require('m2nodehandler');
var querystring  = require('querystring');
var https        = require('https');
var loglet       = require('loglet');
var uuid         = require('uuid');

loglet = loglet.child({component: 'crud-api'});

var init = function(logger_params) {
   this.logger = openiLogger(logger_params);
};

var allowedAPIs = ['users', 'clients', 'authorizations'];


var processMongrel2Message = function (msg, senderToDao, senderToClient, terminal_handler) {

   var action = undefined;
   var p = msg.path.split('/');

   var query = querystring.parse(msg.headers.QUERY);

   this.logger.logMongrel2Message(msg);

   for(var key in msg.json) { /*no knowledge why this may be tainted*/
      if(msg.json.hasOwnProperty(key)) {
         if(msg.json[key] === null) {
            delete msg.json[key];
         }
      }
   }

   switch(msg.headers['METHOD']) {
      case 'POST':
         action = 'GENERIC_CREATE';
         break;
      case 'GET':
         action = 'GENERIC_READ';
         break;
      case 'PUT':
         action = 'GENERIC_UPDATE';
         break;
      case 'DELETE':
         action = 'GENERIC_DELETE';
         break;
      case 'PATCH':
         action = 'GENERIC_PATCH';
         break;
   }

   if(action == undefined) {
      senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'Incorrect HTTP action.' });
      return;
   }

   if(p.length < 5)
   {
      senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'Incompatible URL format.' });
      return;
   }

   if(action === 'GENERIC_CREATE') {
      if(p.length < 6) {
         p.push(p[4] + '_' + uuid.v4());
      }
      /*else {
         senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'ID specified.' });
         return;
      }*/
   }

   if(!(p[1] === 'api' || p[2] === 'v1' || p[3] === 'crud')) {
      
   }

   if(!allowedAPIs.indexOf(p[4]) < 0) {
      senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'API is not allowed or does not exist.' });
      return;
   }

   //if(!(p[4] has format xyz)
   {
      
   }

   senderToDao.send({
      'dao_actions'      : [
         {
            'action'       : action,
            'database'     : p[5],
            'id'           : p[5],
            'object_name'  : p[5],
            'object_data'  : msg.json,
            'content-type' : query['content-type'],
            'resp_type'    : 'crud',
            'authorization': msg.headers.authorization,
            'bucket'       : p[4]
         }
      ],
      'mongrel_sink' : terminal_handler,
      'clients'      : [
         {
            'uuid' : msg.uuid,
            'connId' : msg.connId
         }
      ]
   });
};

module.exports.init                   = init;
module.exports.processMongrel2Message = processMongrel2Message;