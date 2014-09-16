'use strict';
var Buffer = require('buffer').Buffer;
var util = require('../util/bit-util.js');
var _ = require("underscore");
var opcodes = require('../util/opcodes.js');

var ParserCtrl = function($scope) {
  $scope.txHex = '0100000001c3d062be6c104a9c68460f7b7cfa77eef0f600d6213bdc41ac210741341629d5000000006a4730440220503f07e749c6b7ed1de6c37bdf5f6a50e7a4df583cedf91bff88e86178fe488e02206fd4a669956b678c979f36f6b8c835bbf488437c0e3d0cf2b74e0d26725e18880121033b8355a26f4633d20bd1e7a6ac03d04126cd873bdadddd7da6971d681e6abc05ffffffff02002d3101000000001976a9140f4abcfc846effe508bcabfd35e736f6685fba0a88ac56b43a02000000001976a9145c8a4241bcfb047f69f00b3518425da251e6214e88ac00000000';
  $scope.tx = {};

  $scope.$watch('txHex', function() {
    if ($scope.txHex === '') return;

    var txBuff = new Buffer($scope.txHex, 'hex');
    var tx = {};

    // Version
    tx.version = txBuff.readUInt32LE(0);

    // Tx inputs
    tx.inputsCount = util.readVarInt(txBuff, 4).res;
    var offset = util.readVarInt(txBuff, 4).offset;


    tx.inputs = [];

    for (var i = 0; i < tx.inputsCount; i++) {
      var input = parseVin(txBuff.slice(offset));
      tx.inputs.push(input);
      offset += input.size;
    }

    // Tx outputs
    var outputsCount = util.readVarInt(txBuff, offset);
    offset = outputsCount.offset;
    tx.outputsCount = outputsCount.res;

    tx.outputs = [];

    for (i = 0; i < tx.outputsCount; i++) {
      var output = parseVout(txBuff.slice(offset));
      tx.outputs.push(output);
      offset += output.size;
    }

    // lockTime
    tx.lockTime = txBuff.readUInt32LE(offset);

    // binds the tx to the DOM
    $scope.tx = tx;

    var a = decodeScriptPubKey(new Buffer($scope.tx.outputs[0].scriptPubKey, 'hex'));
  });// end $watch

  function parseVin(buf) {
    var txin = {};

    txin.prevHash = buf.slice(0, 32).toString('hex');
    txin.outputIndex = buf.readUInt32LE(32);

    var scriptLength = util.readVarInt(buf, 36);
    var offset = scriptLength.offset;
    txin.scriptLength = scriptLength.res;
    txin.scriptSig = buf.slice(offset, offset + txin.scriptLength).toString('hex');

    txin.sequence = buf.readUInt32LE(offset + txin.scriptLength);
    txin.size = offset + txin.scriptLength + 4;
    return txin;
  }

  function parseVout(buf) {
    var txout = {};

    txout.value = util.readUInt64LE(buf, 0);

    var scriptPubKeyLength = util.readVarInt(buf, 8);
    var offset = scriptPubKeyLength.offset;
    txout.scriptPubKeyLength = scriptPubKeyLength.res;
    txout.scriptPubKey = buf.slice(offset, offset + txout.scriptPubKeyLength).toString('hex');
    txout.asm = decodeScriptPubKey(new Buffer(txout.scriptPubKey, 'hex')).asm;

    txout.size = offset + txout.scriptPubKeyLength;
    return txout;
  }

  function decodeScriptPubKey(buffer) {
    var chunks = [];

    var i = 0;

    while (i < buffer.length) {
      var opcode = buffer.readUInt8(i);
      if ((opcode > opcodes.OP_0) && (opcode <= opcodes.OP_PUSHDATA4)) {
        var d = readPushDataInt(buffer, i);
        i += d.size;

        var data = buffer.slice(i, i + d.number);
        i += d.number;

        chunks.push(data);

      } else {
        chunks.push(opcode);

        i += 1;
      }
    }

    var opcodesInv = _.invert(opcodes);
    var asm = opcodesInv[chunks[0]] + ' ' +
              opcodesInv[chunks[1]] + ' ' +
              chunks[2].toString('hex') + ' ' +
              opcodesInv[chunks[3]] + ' ' +
              opcodesInv[chunks[4]];

    return { 'buffer': buffer, 'chunks': chunks, 'asm': asm };
  }

  function readPushDataInt(buffer, offset) {
    var opcode = buffer.readUInt8(offset);
    var number, size;

    // ~6 bit
    if (opcode < opcodes.OP_PUSHDATA1) {
      number = opcode;
      size = 1;

    // 8 bit
    } else if (opcode === opcodes.OP_PUSHDATA1) {
      number = buffer.readUInt8(offset + 1);
      size = 2;

    // 16 bit
    } else if (opcode === opcodes.OP_PUSHDATA2) {
      number = buffer.readUInt16LE(offset + 1);
      size = 3;

    // 32 bit
    } else {
      console.log('Unexpected opcode');

      number = buffer.readUInt32LE(offset + 1);
      size = 5;

    }
    return {
      opcode: opcode,
      number: number,
      size: size
    };
  }
};

module.exports = ParserCtrl;
