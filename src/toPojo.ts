import * as _ from 'lodash';
import { Buffer } from 'buffer';

/**
 * Function that will match input
 */
export type MatchFn<I> = (input: I) => boolean;
/**
 * Function that will transform input to output.
 *
 * Returning `undefined` will cause the key to be deleted.
 */
export type TransformFn<I,O> = (input: I, ...args: any[]) => O;
/**
 * A pair of functions that match and transform input to output
 */
export interface Conversion<I,O> {
  match: MatchFn<I>;
  transform: TransformFn<I,O>;

}
/**
 * Options for the class
 */
export interface ToPojoOptions<I,O> {
  /**
   * Fallback transform if all match runs return `false`
   */
  defaultTransform: TransformFn<I, O>
  /**
   * List of `Conversion` to attempt to match against, and if successful, transform.
   */
  conversions?: Conversion<I, O>[]
}

/**
 * Creates a `MatchFn` that can match against a list of constructor names
 * @param constructors - List of constructor names
 */
export function makePrototypeMatcher<I>(constructors: string[]|string): MatchFn<I> {
  return (input: I): boolean => {
    return typeof(input) === 'object' && [].concat(constructors).includes(Object.getPrototypeOf(input as any).constructor.name);
  }
}

/**
 * Class that contains functions to turn a complex JavaScript object into a POJO (plain old javascript object),
 * for serialization.
 *
 * Generic types are the input type ("I"), and the output type ("O").
 */
export class ToPojo<I,O> {
  /**
   * Contains the default conversions
   */
  public DEFAULT_TO_POJO_OPTIONS: ToPojoOptions<I, O> = Object.freeze({
    conversions: [
      /**
       * If `null` is provided `null` should be returned
       */
      {
        match: (input: I) => input === null,
        transform: (input: I) => null as any
      },
      /**
       * If NumberDecimal is the constructor convert to number
       */
      {
        match: makePrototypeMatcher<I>([ 'NumberDecimal', 'Decimal128' ]),
        transform: (input: I, ...args: any[]) => Number((input as any).toString(...args))
      },
      /**
       * If Binary convert to array of numbers
       */
      {
        match: makePrototypeMatcher<I>([ 'Binary' ]),
        transform: (input: I, ...args: any[]) => {
          return [...Buffer.from((input as any).buffer)];
        }
      },
      {
        match: makePrototypeMatcher<I>([ 'Buffer', 'ArrayBuffer', 'Uint8Array']),
        transform: (input: I, ...args: any[]) => {
          return [...Buffer.from((input as any))];
        }
      },
      /**
       * If ObjectId is the constructor convert to string
       */
      {
        match: makePrototypeMatcher<I>([ 'ObjectId' ]),
        transform: (input: I, ...args: any[]) => (input as any).toString(...args)
      },
      /**
       * If `toJSON` is found, call them
       */
      {
        match: (input: I) => typeof(input) === 'object' && typeof((input as any).toJSON) === 'function',
        transform: function (input: I, ...args: any[]) { return this.toPojo((input as any).toJSON(...args)); }
      },
      /**
       * If `toObject` is found, call them
       */
      {
        match: (input: I) => typeof(input) === 'object' && typeof((input as any).toObject) === 'function',
        transform: function (input: I, ...args: any[]) { return this.toPojo((input as any).toObject(...args)); }
      },
    ],
    defaultTransform: (input: I) => _.cloneDeep(input) as unknown as O
  })

  /**
   * Attempts to turn a complex JavaScript object, into a simple serializable one,
   * by recursively walking through the object and running the provided conversions, or
   * the default transformation.
   *
   * Will stop at the first matched conversion and then return the output
   * of the `transform` function.
   *
   * @param input
   * @param options
   */
  public toPojo(input: I, options: ToPojoOptions<I, O> = this.DEFAULT_TO_POJO_OPTIONS): O {
    for (let {match, transform} of options.conversions) {
      if (match.call(this, input)) {
        return transform.call(this, input);
      }
    }

    if (typeof(input) === 'object' && input !== null) {
      const $input = input as any;
      if (Array.isArray($input)) {
        for (let i = 0; i < $input.length; i++) {
          $input[i] = this.toPojo($input[i], options) as any;
          if (typeof($input[i]) === 'undefined') {
            delete $input[i];
          }
        }
      } else {
        for (let k in $input) {
          $input[k] = this.toPojo($input[k], options) as any;
          if (typeof($input[k]) === 'undefined') {
            delete $input[k];
          }
        }
      }
    }

    return options.defaultTransform(input);
  }
}

/**
 * Attempts to turn a complex JavaScript object, into a simple serializable one,
 * by recursively walking through the object and running the provided conversions, or
 * the default transformation.
 *
 * Will stop at the first matched conversion and then return the output
 * of the `transform` function.
 *
 * @param input
 * @param options
 */
export function toPojo<I,O>(input: I, options?: ToPojoOptions<I, O>): O {
  const instance = new ToPojo<I, O>();

  return instance.toPojo(input, options);
}

export default toPojo;
