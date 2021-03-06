// @flow
import has from 'lodash/get';
import range from 'lodash/range';
import shuffle from 'lodash/shuffle';
import { Channel, Box } from './channels';
import { AltHandler } from './handlers';
import { AltResult, DEFAULT } from './results';

// TODO: Accept a priority function or something
export function doAlts( // eslint-disable-line
  operations: Channel[] | [Channel, any][], callback: Function, options: Object
) {
  if (operations.length === 0) {
    throw new Error('Empty alt list');
  }

  const flag: Box<boolean> = new Box(true);
  const indexes: number[] = shuffle(range(operations.length));
  const hasPriority: boolean = !!(options && options.priority);
  let result: ?Box<any>;

  for (let i = 0; i < operations.length; i++) {
    const operation: Channel | [Channel, any] = operations[hasPriority ? i : indexes[i]];
    let ch: Channel;

    if (operation instanceof Channel) {
      ch = operation;
      result = ch.take(
        new AltHandler(flag, (value) => callback(new AltResult(value, ch)))
      );
    } else {
      ch = operation[0];
      result = ch.put(
        operation[1], new AltHandler(flag, (ok) => callback(new AltResult(ok, ch)))
      );
    }

    if (result) {
      callback(new AltResult(result.value, ch));
      break;
    }
  }

  if (!result && has(options, 'default') && flag.value) {
    flag.value = false;
    callback(new AltResult(options.default, DEFAULT));
  }
}
