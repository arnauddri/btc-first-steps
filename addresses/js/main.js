'use strict';
angular.module('addressApp', []);

function wifToPrivateCtrl ($scope) {
  $scope.wif = 'cVXckEtbMkswxDveXFPCxXMrrZtUKUKZWUpRGwS8o4no1satSZb1';

  $scope.$watch('wif', function(d) {
    $scope.decodedWif = Crypto.util.bytesToHex(Bs58.util.decode(d));
    $scope.pubWithoutChecksum = $scope.decodedWif.slice(0, $scope.decodedWif.length - 8);
    $scope.private = $scope.pubWithoutChecksum.slice(2, $scope.pubWithoutChecksum.length);
  });

}

function privateToWifCtrl ($scope) {
  $scope.private = '4E999A81791792D01855758CED7463676ECF06D1FE8F563FB8C46914926A27FCCA4384467122';
  $scope.version = 'Bitcoin Public Address     0x00';

  $scope.$watchGroup(['private', 'version'], function() {
    $scope.versionedWif = $scope.version.substring($scope.version.length - 2) + $scope.private;
    $scope.firstSHA = Crypto.SHA256(Crypto.util.hexToBytes($scope.versionedWif));
    $scope.secondSHA = Crypto.SHA256(Crypto.util.hexToBytes($scope.firstSHA));
    $scope.checkSum = $scope.secondSHA.slice(0, 8);
    $scope.bs58Wif =  Bs58.util.encode(Crypto.util.hexToBytes($scope.versionedWif + $scope.checkSum));
  });
}

function privateToPublicCtrl ($scope) {
  $scope.privateHex = '1184CD2CDD640CA42CFC3A091C51D549B2F016D454B2774019C2B2D2E08529FD';
  updateKeys();

  $scope.$watch('privateHex', function() {
    updateKeys();
  })

  $scope.randomPrivateKey = function() {
    var randArr = new Uint8Array(32);
    $scope.privateHex = Crypto.util.bytesToHex(window.crypto.getRandomValues(randArr));
    updateKeys();
  }

  function updateKeys() {
    $scope.publicKey = generatePublic(Crypto.util.hexToBytes($scope.privateHex));
    $scope.publicKeyHex = $scope.publicKey.pubHex;
    $scope.pubKeyCompressed = compressPublicHex($scope.publicKey);
  }

  function generatePublic(input) {
    var curve = getSECCurveByName('secp256k1');
    var privateKeyBN = BigInteger.fromByteArrayUnsigned(input);

    var curvePt = curve.getG().multiply(privateKeyBN);
    var x = curvePt.getX().toBigInteger();
    var y = curvePt.getY().toBigInteger();
    var publicKeyBytes = integerToBytes(x,32); //integerToBytes is found in bitcoinjs-lib/src/ecdsa.js

    publicKeyBytes = publicKeyBytes.concat(integerToBytes(y,32));
    publicKeyBytes.unshift(0x04);

    return {
      pubHex: Crypto.util.bytesToHex(publicKeyBytes),
      x: x,
      y: x
    };
  }

  function compressPublicHex(pub) {
    var publicKeyBytesCompressed = integerToBytes(pub.x,32);
    if (pub.y.isEven())
      publicKeyBytesCompressed.unshift(0x02)
    else
      publicKeyBytesCompressed.unshift(0x03)

    var publicKeyHexCompressed = Crypto.util.bytesToHex(publicKeyBytesCompressed)
    return publicKeyHexCompressed;
  }

  function integerToBytes (i, len) {
    var bytes = i.toByteArrayUnsigned();

    if (len < bytes.length) {
      bytes = bytes.slice(bytes.length - len);
    } else {
      while (len > bytes.length) {
        bytes.unshift(0);
      }
    }
    return bytes;
  };
}

angular
  .module('addressApp')
  .controller('wifToPrivateCtrl', wifToPrivateCtrl)
  .controller('privateToWifCtrl', privateToWifCtrl)
  .controller('privateToPublicCtrl', privateToPublicCtrl);
