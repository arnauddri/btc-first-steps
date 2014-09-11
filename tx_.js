var buffertools = require('buffertools');
buffertools.extend();
var EC = require('elliptic').ec;
var hash = require('hash.js');

// Define the amount of the transaction in Satoshis
var transactionAmount = 20000000;

// Define the destination address
//var recipientAddressHex = 'mjyxkdjbWsg3e1m1yxLyaEr16T5Hnzn4b8';

// Previous Transaction details
var prevRawTx = new Buffer('0100000001c3d062be6c104a9c68460f7b7cfa77eef0f600d6213bdc41ac210741341629d5000000006a4730440220503f07e749c6b7ed1de6c37bdf5f6a50e7a4df583cedf91bff88e86178fe488e02206fd4a669956b678c979f36f6b8c835bbf488437c0e3d0cf2b74e0d26725e18880121033b8355a26f4633d20bd1e7a6ac03d04126cd873bdadddd7da6971d681e6abc05ffffffff02002d3101000000001976a9140f4abcfc846effe508bcabfd35e736f6685fba0a88ac56b43a02000000001976a9145c8a4241bcfb047f69f00b3518425da251e6214e88ac00000000', 'hex');
var prevTxHash = new Buffer('334545d08a6228a0bff039fa72bda8eb91044286f6149238fbbe9c045fd016bd', 'hex');
var prevTxHash = sha256x2(prevRawTx);
var prevTxScriptPubKey = new Buffer('76a9140f4abcfc846effe508bcabfd35e736f6685fba0a88ac', 'hex');

// Generating public Key
var privateKey = new Buffer('803F0D07C2CD057ED67445218745C3491A6448679BE45BAE729EA1C5365125AF01', 'hex');
var ec = new EC('secp256k1');
var keypair = ec.keyPair(privateKey);
var publicKey = new Buffer(keypair.getPublic(true, 'hex'), 'hex');

// Define the OPCODE for the scriptPubKey
var OPCODES = {
  OP_DUP: new Buffer('76', 'hex'),
  OP_HASH160: new Buffer('a9', 'hex'),
  OP_EQUALVERIFY: new Buffer('88', 'hex'),
  OP_CHECKSIG: new Buffer('ac', 'hex')
};
// Hash 160 used in the OPCODE
var hash160 = new Buffer('30fc1ddd198e6f43edcbbf3d574179a0d15c620a', 'hex');

// #################################
// ########## TRANSACTION ##########
// #################################

var tx = {};

// ########## Version ##########
tx.version = new Buffer('01000000', 'hex');

// ########## Inputs ##########
tx.inCount = numToVarInt(1); // number of inputs as a var_int

tx.input = {
  prevTxHash:       prevTxHash, // 32 Bytes hash of prev tx
  prevOutputIndex:  new Buffer('00000000', 'hex'),
  scriptSigLgth:    new Buffer('19', 'hex'),
  scriptSig:        prevTxScriptPubKey,
  sequence:         new Buffer('ffffffff', 'hex')
};

// ########## Outputs##########
tx.outCount = numToVarInt(1); // number of outputs as a var_int

tx.output = {
  value:              new Buffer(8),
  scriptPubKeyLgth:   new Buffer('19', 'hex'),
  scriptPubKey:       ''
};

// Turns the opcode into the scriptPubKey
tx.output.scriptPubKey = buffertools.concat(
                                      OPCODES.OP_DUP,
                                      OPCODES.OP_HASH160,
                                      new Buffer('14', 'hex'),
                                      hash160,
                                      OPCODES.OP_EQUALVERIFY,
                                      OPCODES.OP_CHECKSIG
                                    );

tx.output.value.clear();
writeUInt64LE(tx.output.value, transactionAmount, 0); // turns the amount into a 64 bits integer

// ########## Lock Time ##########
tx.lockTime = new Buffer('00000000', 'hex');

// ########## Hash Code ##########
tx.hashCode = new Buffer('01000000', 'hex');

// #################################
// #################################
// #################################

var transaction = buffertools.concat(
  tx.version,
  tx.inCount,
  tx.input.prevTxHash,
  tx.input.prevOutputIndex,
  tx.input.scriptSigLgth,
  tx.input.scriptSig,
  tx.input.sequence,
  tx.outCount,
  tx.output.value,
  tx.output.scriptPubKeyLgth,
  tx.output.scriptPubKey,
  tx.lockTime,
  tx.hashCode
);

// Double Sha-256 of the transaction
var doubleHashedTx = sha256x2(transaction);

// Sign the transaction with the private key
var signature = new Buffer(ec.sign(doubleHashedTx, privateKey).toDER('hex'), 'hex');

// append a 1-byte hash code type
signature = signature.concat(new Buffer('01', 'hex'));

// Construct the final scriptSig:
// < One-byte script OPCODE containing the length of the DER-encoded signature plus the one-byte hash code type>
// < The actual DER-encoded signature plus the one-byte hash code type>
// < One-byte script OPCODE containing the length of the public key>
// < The actual public key>

var scriptSig = buffertools.concat(
  new Buffer(signature.length.toString(16), 'hex'),
  signature,
  new Buffer(publicKey.length.toString(16), 'hex'),
  publicKey
);

var scriptSigLgth = numToVarInt(scriptSig.length);

var finalTransaction = buffertools.concat(
  tx.version,
  tx.inCount,
  tx.input.prevTxHash,
  tx.input.prevOutputIndex,
  scriptSigLgth,
  scriptSig,
  tx.input.sequence,
  tx.outCount,
  tx.output.value,
  tx.output.scriptPubKeyLgth,
  tx.output.scriptPubKey,
  tx.lockTime
);

console.log(tx.version);
console.log(tx.inCount);
console.log(tx.input.prevTxHash);
console.log(scriptSigLgth);
console.log(scriptSig);
console.log(tx.input.sequence);
console.log(tx.outCount);
console.log(tx.output.value);
console.log(tx.output.scriptPubKeyLgth);
console.log(tx.output.scriptPubKey);

console.log('sendrawtransaction ' + finalTransaction.toString('hex'));

// Utilities
function ripemdSha(buf) {
  return new Buffer(hash.ripemd160().update(hash.sha256().update(buf).digest()).digest('hex'), 'hex');
}

function sha256x2(buf) {
  return new Buffer(hash.sha256().update(hash.sha256().update(buf).digest()).digest('hex'), 'hex');
}

function numToVarInt (n) {
  var res;
  if (n < 0xfd) {
    res = new Buffer(1);
    res.clear();
    res.writeUInt8(n, 0);
    return res;
  } else if (n <= 0xffff) {
    res = new Buffer(3);
    res.clear();
    res[0] = 0xfd;
    res.writeUInt16LE(n);
    return res;
  } else if (n <= 0xffffffff) {
    res = new Buffer(5);
    res.clear();
    res[0] = 0xfe;
    res.writeUInt32LE(n);
    return res;
  } else {
    res = new Buffer(9);
    res.clear();
    res[0] = 0xff;
    writeUInt64LE(res, n, 1);
    return res;
  }
}

function writeUInt64LE(buffer, value, offset) {
  buffer.writeInt32LE(value & -1, offset);
  buffer.writeUInt32LE(Math.floor(value / 0x100000000), offset + 4);
}

