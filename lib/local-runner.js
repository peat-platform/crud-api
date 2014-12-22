/**
 * Created by dmccarthy on 14/11/2013.
 */


'use strict';

var crudApi = require('./main.js');

var config = {
   dao_sink        : {
      spec:'tcp://127.0.0.1:49999',
      bind:false,
      type:'push',
      id:'a'
   },
   mongrel_handler : {
      source : {
         spec:'tcp://127.0.0.1:49915',
         bind:false, id:'b',
         type:'pull',
         isMongrel2:true
      },
      sink   : {
         spec:'tcp://127.0.0.1:49916',
         bind:false,
         id:'c',
         type:'pub',
         isMongrel2:true
      }
   },
   api_handler : {
      source : {spec : 'tcp://127.0.0.1:49551', bind : true, type : 'sub', subscribe : '', id : 'CRUD'},
      sink : {spec : 'tcp://127.0.0.1:49551', bind : false, type : 'pub', subscribe : '', id : 'CRUD'}
      //notif_broadcaster : {spec : 'tcp://127.0.0.1:49501', bind : true, type : 'pub', id : 'NotificationBroadcaster'},
   },
   logger_params : {
      'path'     : '/opt/openi/cloudlet_platform/logs/crud_api',
      'log_level': 'debug',
      'as_json'  : false
   }
};


crudApi(config);