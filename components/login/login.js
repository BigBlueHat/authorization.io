define([
  'angular',
  'forge/forge'
], function(angular,forge) {

'use strict';

var module = angular.module('app.login', ['bedrock.alert']);

module.controller('LoginController', function($scope, $http, $window, config, DataService, brAlertService) {
  var self = this;

  if(config.data.credential) {
    DataService.set('credential', config.data.credential);
    //console.log('DataService.get(credential)', DataService.get('credential'));
  }
  if(config.data.idp) {
    DataService.set('idpInfo', config.data.idp);
  }
  if(config.data.callback) {
    DataService.set('callback', config.data.callback);
    //console.log('DataService.get(callback)', DataService.get('callback'));
  }
  //console.log('config.data', config.data);
  //console.log('DataService.get(idp)', DataService.get('idpInfo'));

  self.login = function(username,password) {
    //TODO: fix hash to use delimeters or any other improvements
    var md = forge.md.sha256.create();
    md.update(username + password);
    var loginHash = md.digest().toHex();

    var privateKey = localStorage.getItem(loginHash);

    Promise.resolve($http.get('/DID',{params:{hashQuery:loginHash}}))
      .then(function(response) {
        console.log('response from GET /DID', response);


        var did = null;

        var edid = response.data;
        //first order of business, get the did out of the response. it is now an encrypted did
        // On a new device, need to do something

        var pwKeyHashMethod = edid.pwKeyHashMethod;

        var key = '';
        var salt = edid.salt;
        var numIterations = edid.numIterations;
        // Checks which method to use for password based key derivation.
        if (pwKeyHashMethod == 'PKCS5'){
          key = forge.pkcs5.pbkdf2(password, salt, numIterations, 16)
        }

        var encryptionMethod = edid.encryptionMethod;

        var pass = false;

        //checks which method was used for encryption.
        if(encryptionMethod == 'AES-GCM'){
          
          var iv = forge.util.createBuffer(
            forge.util.decode64(edid.iv));

          var authTag = forge.util.createBuffer(
            forge.util.decode64(edid.authTag));

          var decipher = forge.cipher.createDecipher(encryptionMethod, key);
          decipher.start({
            iv:iv,
            tagLength:128,
            tag:authTag
          });

          var encrypted = forge.util.createBuffer(
            forge.util.decode64(edid.encrypted));

          decipher.update(encrypted);
          pass = decipher.finish();
          did = decipher.output.getBytes();
        }

        console.log('Passed', pass);
        console.log('DID', did);

        if(pass){
          //possible outcome
          // lead to IDP, which we can retrieve
          // Then have idp give authorization to create a key pair for them
          if(!privateKey){

          }
          // Coming from credential consumer
          else if(DataService.get('credential')) {
            Promise.resolve($http.get('/DID/Idp',{params:{did:did}}))
              .then(function(response) {
                console.log('/DID/Idp response.data', response.data);
                // TODO: Post to idp (start the key dance)
                $window.location.href = DataService.get('callback');
              })  
              .catch(function(err) {

              })
              .then(function() {
                $scope.$apply();
              });
          }
          // Coming from IDP site
          else if(DataService.get('idpInfo')) {
            Promise.resolve($http.post('/DID/Idp', {
              did: did,
              idp: DataService.get('idpInfo')
            }))
              .then(function(){
                // idp succesfully registered to did
                console.log('Idp succesfully registered to did.');
                $window.location.href = DataService.get('callback');
              })
              .catch(function(err){
                console.log('There was an error', err);
                brAlertService.add('error', 
                  'Idp unable to be registered'); 
              })
              .then(function() {
                $scope.$apply();
              }); 
          }
          //Logged in, but nothing to do..?
          else {

          }
        }
        // pass is false.
        // Bad login, unable to decrypt did with the password.
        else{
           brAlertService.add('error', 
          'Invalid login information'); 
        }

        // TODO: Post data to callback? (credential consummer?)
        // console.log('callback', DataService.get('callback'));
        // DataService.redirect(DataService.get('callback'));
      })
      .catch(function(err) {
        console.log('There was an error', err);
        brAlertService.add('error', 
          'Invalid login information'); 
      })
      .then(function() {
        $scope.$apply();
      });
  };
});


});