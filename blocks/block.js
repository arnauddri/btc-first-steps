var utils = require('bitcoin-buffer');

function Parser() {
  if (!(this instanceof Parser))
    return new Parser();
}

module.exports = Parser;

Parser.prototype.parseBlock = function(buf) {
  if (buf.length < 81)
    return new Error('Invalid block size');

  var block  = {},
      offset = 0;

  block.magicNumber  = buf.slice(0,4).readUInt32LE(0);
  offset            += 4;
  block.size         = buf.readUInt32LE(offset);
  offset            += 4;
  block.header       = buf.slice(8);

  var blockContent = this.parseBlockHeader(block.header);

  return {
    magicNumber: block.magicNumber,
    size:        block.size,
    version:     blockContent.version,
    prevBlock:   blockContent.prevBlock,
    merkleRoot:  blockContent.merkleRoot,
    timestamp:   blockContent.timestamp,
    bits:        blockContent.bits,
    nonce:       blockContent.nonce,
    totalTx:     blockContent.totalTx,
    txs:         blockContent.txs
  };
};

Parser.prototype.parseBlockHeader = function(buf) {
  var result   = utils.readVarInt(buf, 80),
      txsCount = result.res,
      offset   = result.offset,
      txs      = [];

  if (buf.length >= offset + 10) {
    for (var i = 0; i < txsCount; i++) {
      var tx  = this.parseTx(buf.slice(offset));
      offset += tx._offset;
      txs.push(tx);
    }
  }

  return {
    version:    buf.readUInt32LE(0),
    prevBlock:  buf.slice(4, 36),
    merkleRoot: buf.slice(36, 68),
    timestamp:  buf.readUInt32LE(68),
    bits:       buf.readUInt32LE(72),
    nonce:      buf.readUInt32LE(76),
    totalTx:    txsCount,
    txs:        txs
  };
};

Parser.prototype.parseTx = function(buf) {
  if (buf.length < 10)
    return new Error('Invalid transaction size');

  var txInCount = utils.readVarInt(buf, 4); // get the number of inputs
  var offset    = txInCount.offset;
  txInCount     = txInCount.res;

  if (txInCount < 0 || offset + 41 * txInCount + 5 > buf.length)
    return new Error('Invalid transaction count');

  var txsIn = new Array(txInCount);

  // Iterates over all the input to parse the transactions
  for (var i = 0; i < txInCount; i ++) {
    var tx = this.parseTxIn(buf.slice(offset));

    if (!tx)
      return;

    txsIn[i]  = tx;
    offset   += tx.size;

    if (offset + 5 > buf.length)
      return new Error('Invalid transaction offset');
  }

  // same with Ouputs
  var txOutCount = utils.readVarInt(buf, offset);
  offset         = txOutCount.offset;
  txOutCount     = txOutCount.res;

  var txsOut     = new Array(txOutCount);

  for (var i = 0; i < txOutCount; i++) {
    var tx = this.parseTxOut(buf.slice(offset));

    if (!tx)
      return;

    txsOut[i]  = tx;
    offset    += tx.size;

    if (offset + 5 > buf.length)
      return new Error('Invalid transaction offset');
  }

  return {
    _raw:    buf,
    version: buf.readUInt32LE(0),
    inputs:  txsIn,
    outputs: txsOut,
    lock:    buf.readUInt32LE(offset),
    _offset: offset + 4
  };
};

Parser.prototype.parseTxIn = function(buf) {
  if (buf.length < 41)
    return new Error('Invalid transaction input size');

  var scriptSigLen = utils.readVarInt(buf, 36);
  var offset       = scriptSigLen.offset;
  scriptSigLen     = scriptSigLen.res;

  if (offset + scriptSigLen + 4 > buf.length)
    return new Error('Invalid Transaction script length');

  return {
    size:     offset + scriptSigLen + 4,
    out: {
      hash:   buf.slice(0, 32),
      index:  buf.readUInt32LE(32)
    },
    script:   buf.slice(offset, offset + scriptSigLen),
    sequence: buf.readUInt32LE(offset + scriptSigLen)
  };
};

Parser.prototype.parseTxOut = function(buf) {
  if (buf.length < 9)
    return new Error('Invalid transaction output size');

  var scriptLen = utils.readVarInt(buf, 8);
  var offset    = scriptLen.offset;
  scriptLen     = scriptLen.res;

  if (offset + scriptLen > buf.length)
    return new Error('Invalid transaction output length');

  return {
    size:   offset + scriptLen,
    value:  utils.readUInt64LE(buf.slice(0,8), 0),
    script: buf.slice(offset, offset + scriptLen)
  };
};

function toHexLE(buf) {
  if (!Buffer.isBuffer(buf)) return new Error('Invalid Buffer');

  return buf.toString('hex').match(/.{2}/g).reverse().join("");
}

