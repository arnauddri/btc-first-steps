var fs     = require('fs');
var expect = require('chai').expect;
var Parser = require('../block.js');

var block  = fs.readFileSync('./block/blk00003.dat');

parser = new Parser();

block = parser.parseBlock(block);

var testBlock = {
  magicNumber: 3652501241,
  size:        30000,
  version:     1,
  prevBlock:   '000000000000000e5b44cb9b537e79227ba232b45cbd5af5112f186d03bca221',
  merkleRoot:  '49550619e67e78056c365dd9e2e0f1d3f2e1227bac0bf52d621b93476f1e5349',
  timestamp:   1311016847,
  bits:        436911055,
  totalTx:     64
};

describe('block', function() {
  it('should parse block', function() {
    expect(block.magicNumber).to.equal(testBlock.magicNumber);
    expect(block.size).to.equal(testBlock.size);
    expect(block.prevBlock.toString('hex').match(/.{2}/g).reverse().join("")).to.equal(testBlock.prevBlock);
    expect(block.merkleRoot.toString('hex').match(/.{2}/g).reverse().join("")).to.equal(testBlock.merkleRoot);
    expect(block.timestamp).to.equal(testBlock.timestamp);
    expect(block.bits).to.equal(testBlock.bits);
    expect(block.totalTx).to.equal(testBlock.totalTx);
  });
});
