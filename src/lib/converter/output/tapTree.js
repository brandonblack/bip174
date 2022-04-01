'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const typeFields_1 = require('../../typeFields');
const varuint = require('../varint');
function decode(keyVal) {
  if (keyVal.key[0] !== typeFields_1.OutputTypes.TAP_TREE) {
    throw new Error(
      'Decode Error: could not decode tapTree with key 0x' +
        keyVal.key.toString('hex'),
    );
  }
  let _offset = 0;
  const data = [];
  while (_offset < keyVal.value.length) {
    const depth = keyVal.value[_offset++];
    const leafVersion = keyVal.value[_offset++];
    const scriptLen = varuint.decode(keyVal.value, _offset);
    _offset += varuint.encodingLength(scriptLen);
    data.push({
      depth,
      leafVersion,
      script: keyVal.value.slice(_offset, _offset + scriptLen),
    });
    _offset += scriptLen;
  }
  return data;
}
exports.decode = decode;
function encode(tree) {
  const key = Buffer.from([typeFields_1.OutputTypes.TAP_TREE]);
  const bufs = new Array(tree.length * 2);
  for (const tapLeaf of tree) {
    const headBuf = Buffer.allocUnsafe(
      2 + varuint.encodingLength(tapLeaf.script.length),
    );
    headBuf[0] = tapLeaf.depth;
    headBuf[1] = tapLeaf.leafVersion;
    varuint.encode(tapLeaf.script.length, headBuf, 2);
    bufs.push(headBuf);
    bufs.push(tapLeaf.script);
  }
  return {
    key,
    value: Buffer.concat(bufs),
  };
}
exports.encode = encode;
exports.expected = '[{ depth: number; leafVersion: number, script: Buffer; }]';
function check(data) {
  return (
    Array.isArray(data) &&
    data.every(
      tapLeaf =>
        tapLeaf.depth >= 0 &&
        tapLeaf.depth <= 128 &&
        (tapLeaf.leafVersion & 0xfe) === tapLeaf.leafVersion &&
        Buffer.isBuffer(tapLeaf.script),
    )
  );
}
exports.check = check;
function canAdd(currentData, newData) {
  return !!currentData && !!newData && currentData.tapTree === undefined;
}
exports.canAdd = canAdd;
