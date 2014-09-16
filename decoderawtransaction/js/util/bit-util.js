exports.readVarInt = function (buf, offset) {
  if (!offset)
    offset = 0;

  var res, size;

  if (buf[offset] < 0xfd) {
    res = buf.readUInt8(offset);
    size = 1
  } else if (buf[offset] === 0xfd) {
    res = buf.readUInt16LE(offset+1);
    size = 3
  } else if (buf[offset] === 0xfe) {
    res = buf.readUInt32LE(offset+1);
    size = 5
  } else if (buf[offset] === 0xff) {
    res = readUInt64LE(buf, offset+1);
    size = 9
  }

  return { res: res, offset: offset + size };
}

exports.readUInt64LE = function(buf, offset) {
  var a = buf.readUInt32LE(offset)
  var b = buf.readUInt32LE(offset + 4)
  b *= 0x100000000
  return b + a
}

