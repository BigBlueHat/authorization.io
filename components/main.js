/*!
 * New BSD License (3-clause)
 * Copyright (c) 2015-2016, Digital Bazaar, Inc.
 * Copyright (c) 2015-2016, Accreditrust Technologies, LLC
 * All rights reserved.
 */
define([
  'angular',
  './register-did/register-did-component',
  './register-component',
  './splash-component',
  './agent/agent',
  './identity/identity',
  './identity-chooser/identity-chooser',
  './idp-test/idp-test'
], function(angular, registerDidComponent, registerComponent, splashComponent) {

'use strict';

var module = angular.module('authio', [
  'authio.agent', 'authio.identity', 'authio.identityChooser',
  'authio.idp-test']);

registerDidComponent(module);
registerComponent(module);
splashComponent(module);

/* @ngInject */
module.config(function($routeProvider) {
  $routeProvider
    .when('/register', {
      vars: {
        title: 'Register',
        navbar: false
      },
      template: '<aio-register></aio-register>'
    })
    .when('/test/credentials/idpquery', {
      vars: {
        title: 'Mock Credential Consumer Query'
      },
      templateUrl: requirejs.toUrl('components/idp-test/idp-test.html')
    })
    .when('/test/credentials/composed-identity', {
      vars: {
        title: 'Mock Credential Consumer Query Results',
      },
      templateUrl: requirejs.toUrl('components/idp-test/idp-test.html')
    })
    .when('/test/credentials/stored-credential', {
      vars: {
        title: 'Mock Credential Storage Results'
      },
      templateUrl: requirejs.toUrl('components/idp-test/idp-test.html')
    });
});

});
