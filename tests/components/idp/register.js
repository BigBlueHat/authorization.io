define([
  'angular',
  'forge/forge',
  'did-io',
  'node-uuid'
], function(angular, forge, didiojs, uuid) {

'use strict';

var module = angular.module('authio.register', ['bedrock.alert']);
var didio = didiojs({inject: {
  forge: forge,
  uuid: uuid
}});

module.controller('RegisterController', function(
  $scope, $http, $window, config, ipCookie, DataService, brAlertService) {
  var self = this;

  if(config.data.idp) {
    DataService.set('idp', config.data.idp);
  }
  if(config.data.registrationCallback) {
    DataService.set('callback', config.data.registrationCallback);
  }

  self.passphraseConfirmation = '';
  self.passphrase = '';
  self.username = '';
  self.registering = false;
  self.generating = false;

  if(!DataService.get('idp')) {
    DataService.redirect('/register/idp-error');
  }

  self.register = function() {
    // TODO: Add more validation checks
    if(self.passphrase != self.passphraseConfirmation) {
      return brAlertService.add('error',
        'The passphrases you entered do not match.');
    }
    if(self.username.length == 0) {
      return brAlertService.add('error',
        'You failed to provide an email address');
    }
    var idp = DataService.get('idp');

    // generate the private key
    self.generating = true;
    var pki = forge.pki;
    var keypair = null;
    var did = null;
    var hash = didio.generateHash(self.username, self.passphrase);

    new Promise(function(resolve, reject) {
      self.generating = true;
      pki.rsa.generateKeyPair({
        bits: 2048,
        workerScript: '/bower-components/forge/js/prime.worker.js'
      }, function(err, keypair) {
        if(err) {
          return reject(err);
        }
        return resolve(keypair);
      });
    }).then(function(kp) {
      keypair = kp;
      // store encrypted private key in browser local storage
      var encryptedPem =  pki.encryptRsaPrivateKey(
        keypair.privateKey, self.username + self.passphrase);
      localStorage.setItem(hash, encryptedPem);
      self.generating = false;

      // generate the DID
      did = didio.generateDid();

      // store the hash to did mapping
      var mappingData = {
        '@context': 'https://w3id.org/identity/v1',
        id: hash,
        did: did,
        accessControl: {
          writePermission: [{
            id: did + '/keys/1',
            type: 'CryptographicKey'
          }]
        }
      };

      return Promise.resolve($http.post('/mappings/', mappingData));
    }).then(function(response) {
      if(response.status !== 201) {
        throw response;
      }
    }).then(function() {
      // create the DID document
      var didDocument = {
        '@context': 'https://w3id.org/identity/v1',
        id: did,
        idp: idp,
        accessControl: {
          writePermission: [{
            id: did + '/keys/1',
            type: 'CryptographicKey'
          }, {
            id: idp,
            type: 'Identity'
          }],
        },
        publicKey: [{
          id: did + '/keys/1',
          type: 'CryptographicKey',
          owner: did,
          publicKeyPem: forge.pki.publicKeyToPem(keypair.publicKey)
        }]
      };
      return Promise.resolve($http.post('/dids/', didDocument))
        .then(function(response) {
          if(response.status !== 201) {
            throw response;
          }
        });
    }).then(function() {
      ipCookie('did', did);
      var emailCredential = {
        '@context': 'https://w3id.org/identity/v1',
        id: did,
        credential: [{
          '@context': 'https://w3id.org/identity/v1',
          type: 'EmailCredential',
          claim: {
            id: did,
            email: did + '@example.com'
          }
        }]
      }
      return Promise.resolve($http.post('/idp/credentials',
        JSON.stringify(emailCredential)))
        .then(function(response) {
          if(response.status !== 200) {
            throw response;
          }
          DataService.redirect(DataService.getUrl('idp'));
        });
    }).catch(function(err) {
      console.error('Failed to register with the network', err);
      brAlertService.add('error',
        'Failed to register with the network. Try a different email ' +
        'address and passphrase');
      self.generating = false;
      self.registering = false;
    }).then(function() {
      $scope.$apply();
    });
  };
});

module.controller('CredentialManagerController', function(
  $scope, $http, $location, config, brAlertService) {
  var self = this;
  self.idp = window.data.idp;
  self.action = 'request';

  if($location.search().action === 'store') {
    self.action = 'store';
  }

  // transmit the selected credential to the requestor
  self.transmit = function(identity) {
    navigator.credentials.transmit(self.idp.identity, {
      responseUrl: self.idp.credentialCallbackUrl
    });
  };

  self.store = function(identity) {
    Promise.resolve($http.post('/idp/credentials', identity)
    ).then(function() {

    }).catch(function(err) {
      console.error('Failed to store credential', err);
      brAlertService.add('error',
        'Failed to register with the network. Try a different email ' +
        'address and passphrase');
      self.generating = false;
      self.registering = false;
    });
  };

});

});