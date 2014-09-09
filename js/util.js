'use strict';
if (typeof Bs58 == "undefined" || ! Bs58)
{
(function() {


  // Global Bs object
  var Bs58 = window.Bs58 = {};

  // Bs functions
  var util = Bs58.util = {
    decode: decodeBs58,
    encode: encodeBs58
  };

  var ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var ALPHABET_MAP = {};
  for(var i = 0; i < ALPHABET.length; i++) {
    ALPHABET_MAP[ALPHABET.charAt(i)] = i;
  }
  var BASE = 58;

  function decodeBs58(string) {

    if (string.length === 0) return Crypto.util.bytesToHex(0);

    var input = string.split('').map(function(c){
      return ALPHABET_MAP[c];
    });

    var i, j, bytes = [0];
    for (i = 0; i < input.length; i++) {
      for (j = 0; j < bytes.length; j++) bytes[j] *= BASE;
      bytes[0] += input[i];

      var carry = 0;
      for (j = 0; j < bytes.length; ++j) {
        bytes[j] += carry;

        carry = bytes[j] >> 8;
        bytes[j] &= 0xff;
      }

      while (carry) {
        bytes.push(carry & 0xff);

        carry >>= 8;
      }
    }

    // deal with leading zeros
    for (i = 0; i < input.length - 1 && input[i] === 0; i++) bytes.push(0);

    return bytes.reverse();
  }

  function encodeBs58(buffer) {

    if (buffer.length === 0) return '';

    var i, j, digits = [0];
    for (i = 0; i < buffer.length; i++) {
      for (j = 0; j < digits.length; j++) digits[j] <<= 8;

      digits[0] += buffer[i];

      var carry = 0;
      for (j = 0; j < digits.length; ++j) {
        digits[j] += carry;

        carry = (digits[j] / BASE) | 0;
        digits[j] %= BASE;
      }

      while (carry) {
        digits.push(carry % BASE);

        carry = (carry / BASE) | 0;
      }
    }

    // deal with leading zeros
    for (i = 0; i < buffer.length - 1 && buffer[i] === 0; i++) digits.push(0);

    return digits.reverse().map(function(digit) { return ALPHABET[digit]; }).join('');
  }

})();

}