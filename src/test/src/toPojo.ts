import Chance from 'chance';
import { ObjectId } from 'bson';
import {assert} from "chai";
import * as _ from "lodash";
import {ToPojo} from "../../toPojo";

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
  });
});
