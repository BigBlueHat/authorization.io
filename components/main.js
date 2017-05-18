/*!
 * New BSD License (3-clause)
 * Copyright (c) 2015-2016, Digital Bazaar, Inc.
 * Copyright (c) 2015-2016, Accreditrust Technologies, LLC
 * All rights reserved.
 */
define([
  'angular',
  './agent-component',
  './find-identity-modal-component',
  './identity-chooser-component',
  './identity-service',
  './operation-service',
  './permission-service',
  './register-component',
  './util-service',/*
  './idp-test/idp-test'*/
], function(angular) {

'use strict';

var module = angular.module('authio', [
  /* 'authio.idp-test',*/
  'ngRoute', 'ngSanitize', 'bedrock.alert', 'bedrock.form',/* 'bedrock-navbar',
  'ngError'*/]);

Array.prototype.slice.call(arguments, 1).forEach(function(register) {
  register(module);
});

/* @ngInject */
module.config(function($routeProvider) {
  /* @ngInject */
  function setupRootContainer($rootScope, $route) {
    var vars = $route.current.vars;

    if(!vars || !('ngClass' in vars)) {
      $rootScope.app.ngClass = {};
    } else {
      $rootScope.app.ngClass = vars.ngClass;
    }

    if(!vars || !('ngStyle' in vars)) {
      $rootScope.app.ngStyle = {};
    } else {
      $rootScope.app.ngStyle = vars.ngStyle;
    }
  }

  $routeProvider
    .when('/agent', {
      vars: {
        title: 'Credential Agent',
        navbar: false,
        ngClass: {
          rootContainer: {}
        },
        ngStyle: {
          body: {'background-color': 'transparent'}
        }
      },
      resolve: {
        setupRootContainer: setupRootContainer
      },
      template: '<aio-agent></aio-agent>'
    })
    .when('/register', {
      vars: {
        title: 'Register',
        navbar: false,
        ngClass: {
          rootContainer: {}
        },
        ngStyle: {
          body: {'background-color': 'transparent'}
        }
      },
      resolve: {
        setupRootContainer: setupRootContainer
      },
      template: '<aio-register></aio-register>'
    })
    .when('/test/credentials/idpquery', {
      vars: {
        title: 'Mock Credential Consumer Query'
      },
      resolve: {
        setupRootContainer: setupRootContainer
      },
      templateUrl: requirejs.toUrl('authio/idp-test/idp-test.html')
    })
    .when('/test/credentials/composed-identity', {
      vars: {
        title: 'Mock Credential Consumer Query Results'
      },
      resolve: {
        setupRootContainer: setupRootContainer
      },
      templateUrl: requirejs.toUrl('authio/idp-test/idp-test.html')
    })
    .when('/test/credentials/stored-credential', {
      vars: {
        title: 'Mock Credential Storage Results'
      },
      resolve: {
        setupRootContainer: setupRootContainer
      },
      templateUrl: requirejs.toUrl('authio/idp-test/idp-test.html')
    });
});

});
