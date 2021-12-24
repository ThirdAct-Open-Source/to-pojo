import Chance from 'chance';
import {Binary, ObjectId} from 'bson';
import {assert} from "chai";
import {makeBinaryEncoders, ToPojo} from "../../toPojo";
import {BinaryEncoding, BinaryInputOutput, EncodeTools} from '@znetstar/encode-tools/lib/EncodeTools';

const chance = new Chance();

describe('ToPojo', async function () {
  describe('toPojo', async function () {
    it('should return null if I give a null input', function () {
      const toPojo = new ToPojo<null, null>();
      assert.isNull(
        toPojo.toPojo(null)
      );
    });
    it('should return undefined if I give an undefined input', function () {
      const toPojo = new ToPojo<undefined, null>();
      assert.isUndefined(
        toPojo.toPojo(void(0))
      );
    });

    it('should return a number if a number is given', function () {
      const toPojo = new ToPojo<number, number>();
      assert.isNumber(
        toPojo.toPojo(chance.integer())
      );
    });

    it('should return a string if a string is given', function () {
      const toPojo = new ToPojo<string, string>();
      assert.isString(
        toPojo.toPojo(chance.string())
      );
    });

    it('should return a bool if a bool is given', function () {
      const toPojo = new ToPojo<boolean, boolean>();
      assert.isBoolean(
        toPojo.toPojo(chance.bool())
      );
    });

    it('if toJSON is available it should use that function', function () {
      const toPojo = new ToPojo<any, any>();
      let num = chance.integer();
      assert.equal(
        toPojo.toPojo({
          toJSON: () => num
        }),
        num
      );
    });

    it('if toObject is available it should use that function', function () {
      const toPojo = new ToPojo<any, any>();
      let num = chance.integer();
      assert.equal(
        toPojo.toPojo({
          toObject: () => num
        }),
        num
      );
    });

    it('if the object is an `ObjectId` it should convert it to a string', function () {
      const toPojo = new ToPojo<any, any>();
      const id = new ObjectId();
      const val = toPojo.toPojo({
        id
      });
      assert.isString(val.id);
      assert.equal(
        val.id,
        id.toString()
      );
    });

    it('in an array of objects, each individual object should be run through toPojo', function () {
      const toPojo = new ToPojo<any, any>();
      let arr: any[] = [];

      for (let i = 0; i < chance.integer({ min: 0, max: 25 }); i++)
        arr.push({
          id: new ObjectId()
        });

      const val = toPojo.toPojo(arr);
      assert.isArray(val);
      for (let i = 0; i < val.length; i++) {
        let ele = val[i];
        assert.isString(ele.id);
        assert.equal(
          ele.id,
          arr[i].id.toString()
        );
      }
    });

    it('in an array of objects nested, each individual object should be run through toPojo', function () {
      const toPojo = new ToPojo<any, any>();
      let arr: any[] = [];

      for (let i = 0; i < chance.integer({ min: 0, max: 25 }); i++)
        arr.push({
          doc: {
            id: new ObjectId()
          }
        });

      const val = toPojo.toPojo(arr);
      assert.isArray(val);
      for (let i = 0; i < val.length; i++) {
        let ele = val[i];
        assert.isString(ele.doc.id);
        assert.equal(
          ele.doc.id,
          arr[i].doc.id.toString()
        );
      }
    });

    it('Buffer should be returned as an array of bytes (as numbers)', function () {
      const toPojo = new ToPojo<{ foo: Buffer  }, { foo:  number[] }>();
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = Buffer.from(bufArr);
      const val = toPojo.toPojo({ foo: buf });
      assert.isArray(val.foo);
      assert.deepEqual(val.foo, bufArr);
    });
    it('ArrayBuffer should be returned as an array of bytes (as numbers)', function () {
      const toPojo = new ToPojo<{ foo: ArrayBuffer  }, { foo:  number[] }>();
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = Buffer.from(bufArr);
      const val = toPojo.toPojo({ foo: buf });
      assert.isArray(val.foo);
      assert.deepEqual(val.foo, bufArr);
    });
    it('Uint8Array should be returned as an array of bytes (as numbers)', function () {
      const toPojo = new ToPojo<{ foo: ArrayBuffer  }, { foo:  number[] }>();
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = new Uint8Array(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf });
      assert.isArray(val.foo);
      assert.deepEqual(val.foo, bufArr);
    });
    it('BSON Binary should be returned as an array of bytes (as numbers)', function () {
      const toPojo = new ToPojo<{ foo: Binary }, { foo:  number[] }>();
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = new Binary(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf });
      assert.isArray(val.foo);
      assert.deepEqual(val.foo, bufArr);
    });
  });
  describe('makeBinaryEncoders', function (){
    it('Buffer should be returned as an encoded representation of bytes', function () {
      const toPojo = new ToPojo<{ foo: Buffer }, { foo: BinaryInputOutput }>();
      const encoder = new EncodeTools({ binaryEncoding: BinaryEncoding.base64 });
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = (Buffer.from(bufArr));
      const bufEnc = encoder.encodeBuffer(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf }, {
        conversions: [
          ...makeBinaryEncoders<{ foo: Buffer }, { foo: BinaryInputOutput }>(encoder, BinaryEncoding.base64),
          ...toPojo.DEFAULT_TO_POJO_OPTIONS.conversions
        ]
      });
      assert.isString(val.foo);
      assert.deepEqual(val.foo, bufEnc);
    });
    it('ArrayBuffer should be returned as an encoded representation of bytes', function () {
      const toPojo = new ToPojo<{ foo: ArrayBuffer }, { foo: BinaryInputOutput }>();
      const encoder = new EncodeTools({ binaryEncoding: BinaryEncoding.base64 });
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = (Buffer.from(bufArr));
      const bufEnc = encoder.encodeBuffer(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf }, {
        conversions: [
          ...makeBinaryEncoders<{ foo: ArrayBuffer }, { foo: BinaryInputOutput }>(encoder, BinaryEncoding.base64),
          ...toPojo.DEFAULT_TO_POJO_OPTIONS.conversions
        ]
      });
      assert.isString(val.foo);
      assert.deepEqual(val.foo, bufEnc);
    });
    it('Uint8Array should be returned as an encoded representation of bytes', function () {
      const toPojo = new ToPojo<{ foo: Uint8Array }, { foo: BinaryInputOutput }>();
      const encoder = new EncodeTools({ binaryEncoding: BinaryEncoding.base64 });
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = new Uint8Array(Buffer.from(bufArr));
      const bufEnc = encoder.encodeBuffer(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf }, {
        conversions: [
          ...makeBinaryEncoders<{ foo: Uint8Array }, { foo: BinaryInputOutput }>(encoder, BinaryEncoding.base64),
          ...toPojo.DEFAULT_TO_POJO_OPTIONS.conversions
        ]
      });
      assert.isString(val.foo);
      assert.deepEqual(val.foo, bufEnc);
    });
    it('BSON Binary should be returned as an encoded representation of bytes', function () {
      const toPojo = new ToPojo<{ foo: Binary }, { foo: BinaryInputOutput }>();
      const encoder = new EncodeTools({ binaryEncoding: BinaryEncoding.base64 });
      const bufArr: number[]  = [];
      for (let i = 0; i < chance.integer({ min: 1, max: 1024 }); i++) {
        bufArr.push(chance.integer({ min: 0, max: 255 }));
      }
      const buf = new Binary(Buffer.from(bufArr));
      const bufEnc = encoder.encodeBuffer(Buffer.from(bufArr));
      const val = toPojo.toPojo({ foo: buf }, {
        conversions: [
          ...makeBinaryEncoders<{ foo: Binary }, { foo: BinaryInputOutput }>(encoder, BinaryEncoding.base64),
          ...toPojo.DEFAULT_TO_POJO_OPTIONS.conversions
        ]
      });
      assert.isString(val.foo);
      assert.deepEqual(val.foo, bufEnc);
    });
  });
});
