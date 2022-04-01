import { KeyValue, TapLeafScript } from '../../interfaces';
import { InputTypes } from '../../typeFields';
import * as varuint from '../varint';

export function decode(keyVal: KeyValue): TapLeafScript {
  if (keyVal.key[0] !== InputTypes.TAP_LEAF_SCRIPT) {
    throw new Error(
      'Decode Error: could not decode tapLeafScript with key 0x' +
        keyVal.key.toString('hex'),
    );
  }
  if ((keyVal.key.length - 2) % 32 !== 0) {
    throw new Error(
      'Decode Error: tapLeafScript has invalid control block in key 0x' +
        keyVal.key.toString('hex'),
    );
  }

  const leafVersion = keyVal.value[keyVal.value.length - 1];
  if ((keyVal.key[1] & 0xfe) !== leafVersion) {
    throw new Error(
      'Decode Error: tapLeafScript bad leaf version in key 0x' +
        keyVal.key.toString('hex'),
    );
  }

  const script = keyVal.value.slice(0, -1);
  const controlBlock = keyVal.key.slice(1);
  return { controlBlock, script, leafVersion };
}

export function encode(tScript: TapLeafScript): KeyValue {
  const head = Buffer.from([InputTypes.TAP_LEAF_SCRIPT]);
  const _offset = varuint.encodingLength(tScript.script.length);
  const value = Buffer.allocUnsafe(_offset + tScript.script.length + 1);

  varuint.encode(tScript.script.length, value);
  value[_offset + tScript.script.length] = tScript.leafVersion;
  tScript.script.copy(value, _offset);

  return {
    key: Buffer.concat([head, tScript.controlBlock]),
    value,
  };
}

export const expected =
  '{ controlBlock: Buffer; leafVersion: number, script: Buffer; }';
export function check(data: any): data is TapLeafScript {
  return (
    Buffer.isBuffer(data.controlBlock) &&
    (data.controlBlock.length - 2) % 32 === 0 &&
    (data.leafVersion & 0xfe) === data.leafVersion &&
    Buffer.isBuffer(data.script)
  );
}

export function canAddToArray(
  array: TapLeafScript[],
  item: TapLeafScript,
  dupeSet: Set<string>,
): boolean {
  const dupeString = item.controlBlock.toString('hex');
  if (dupeSet.has(dupeString)) return false;
  dupeSet.add(dupeString);
  return (
    array.filter(v => v.controlBlock.equals(item.controlBlock)).length === 0
  );
}
