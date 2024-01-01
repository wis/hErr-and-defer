import { describe, expect, test } from '@jest/globals';
import { hErr, hErrSync, withDeferred, withDeferredSync } from './index';
import { promises as fsp } from 'fs';

describe('error handling functions', () => {
  test('returns an error if an async function throws', async () => {
    var [err] = await hErr(fsp.unlink)('nonexistentfile.txt');

    expect(err).not.toBeNull();
  });

  test('does not return an error if an async function does not throw', async () => {
    var [err, fd] = await hErr(fsp.open)('newfile.txt');

    expect(err).not.toBeNull();
    expect(fd).toBeNull();
  });
  test('returns an error if an sync function throws', () => {
    var [err, parsedJSON] = hErrSync(JSON.parse)("{");

    expect(err).not.toBeNull();
    expect(parsedJSON).toBeNull();
  });
  test('does not return an error if an sync function does not throw', () => {
    var [err, parsedJSON] = hErrSync(JSON.parse)("{}");

    expect(err).toBeNull();
    expect(parsedJSON).not.toBeNull();
  });
});

describe('withDeffered', () => {
  test('returns what the wrapped function returns', () => {
    var order: number[] = [];
    var [err, result] = withDeferredSync(({ defer }) => {
      defer(() => {
        console.log("this runs LAST after function returns");
        order.push(2);
      });
      defer(() => {
        console.log("this runs FIRST after function returns");
        order.push(1);
      });
      return [null, "result"];
    })();
    expect(result).toEqual("result");
    expect(err).toBeNull();
    expect(order[0]).toEqual(1);
    expect(order[1]).toEqual(2);
  });
  test('returns what the wrapped async function returns', async () => {
    var order: number[] = [];
    var [err, result] = await withDeferred(async ({ defer }) => {
      defer(() => {
        console.log("this runs LAST after (async) function returns");
        order.push(2);
      });
      defer(() => {
        console.log("this runs FIRST after (async) function returns");
        order.push(1);
      });
      return [null, "result"];
    })();
    expect(result).toEqual("result");
    expect(err).toBeNull();
    expect(order[0]).toEqual(1);
    expect(order[1]).toEqual(2);
  });
});
