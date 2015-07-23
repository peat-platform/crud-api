/*
 * peat_data_api
 * peat-platform.org
 *
 * Copyright (c) 2013 dmccarthy
 */

'use strict';

var zmq    = require('m2nodehandler');
//var rrd    = require('peat-rrd');

var peatLogger  = require('peat-logger');
var peatUtils   = require('cloudlet-utils');
var querystring  = require('querystring');
var https        = require('https');
//var loglet       = require('loglet');
var uuid         = require('uuid');

//loglet = loglet.child({component: 'crud-api'});

var logger;

var crudApi = function(config) {

   logger = peatLogger(config.logger_params);
   //rrd.init("crud");
   //zmq.addPreProcessFilter(rrd.filter);

   var senderToDao    = zmq.sender(config.dao_sink);
   var senderToClient = zmq.sender(config.mongrel_handler.sink);

    zmq.receiver(config.api_handler.source, config.api_handler.sink, function (msg) {
        //console.log("msg:" + JSON.stringify(msg));
        /*Your postprocessing here*/
        var b = msg.body.response;
        senderToClient.send(msg.uuid, msg.connId, msg.status, msg.headers, b);
    });

   zmq.receiver(config.mongrel_handler.source, config.mongrel_handler.sink, function(msg) {

       var action = undefined;
       var p = msg.path.split('/');

       var query = querystring.parse(msg.headers.QUERY);

       logger.logMongrel2Message(msg);

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

      if(!msg.headers || typeof msg.headers.authorization !== 'string') {
          senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'No Authorization provided.' });
          return;
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

       if(!(p[1] === 'api' || p[2] === 'v1' || p[3] === 'crud')) {
          senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'Base Path incorect (' + path + ').' });
          return;
       }

       if(action === 'GENERIC_CREATE')
       {
          var match = true;
          switch(p[4]) {
            case 'query':
               action = 'GENERIC_QUERY';
               p.push('queries');
               break;
            case 'create':
               action = 'GENERIC_CREATE';
               break;
            case 'read':
               action = 'GENERIC_READ';
               break;
            case 'update':
               action = 'GENERIC_UPDATE';
               break;
            case 'delete':
               action = 'GENERIC_DELETE';
               break;
            case 'patch':
               action = 'GENERIC_PATCH';
               break;
            case 'upsert':
               action = 'GENERIC_UPSERT';
               break;
            default:
              match = false;
          }

          if(match)
            p.shift();
       }

       if(p.length < 6) {
          //if(action === 'GENERIC_CREATE') {
             p.push(p[p.length - 1] + '_' + uuid.v4());
          //}
          //else { /* to get collections (all docs) - extend this*/
          //   senderToClient.send(msg.uuid, msg.connId, zmq.status.BAD_REQUEST_400, zmq.standard_headers.json, {'error' : 'No ID specified.' });
          //   return;
          //}
       }

      msg.headers.authorization = msg.headers.authorization.replace("Bearer ", "");

      if(msg.headers.authorization.indexOf('dbkeys_') != 0)
        msg.headers.authorization = 'dbkeys_' + msg.headers.authorization;

       senderToDao.send({
          'dao_actions'      : [
             {
                'action'       : action,
                'database'     : p[4],
                'id'           : p[5],
                'data'         : msg.json || {},
                'authorization': msg.headers.authorization,
                'options'      : {}
             }
          ],
          'mongrel_sink' : config.api_handler.sink, //config.mongrel_handler.sink,
          'clients'      : [
             {
                'uuid' : msg.uuid,
                'connId' : msg.connId
             }
          ]
       });
   });

};


module.exports = crudApi;