export function hErr<T extends any[], R>(fn: (...args: T) => Promise<R>):
  ((...args: T) => Promise<[Error | any | null, R | null]>) {
  return async function(...args: T): Promise<[Error | any | null, R | null]> {
    try {
      return [null, await fn(...args)];
    } catch (error) {
      return [error, null];
    }
  }
}

export function hErrSync<T extends any[], R>(fn: (...args: T) => R):
  ((...args: T) => [Error | any | null, R | null]) {
  return function(...args: T): [Error | any | null, R | null] {
    try {
      return [null, fn(...args)];
    } catch (error) {
      return [error, null];
    }
  }
}

type DeferFunction<DR> = (fn: () => DR) => DR;
type WrappedAsyncFunction<DR, R> = ({ defer }: { defer: (fn: () => DR) => DR }) => Promise<R>;

export function withDeferred<T extends any[], DR, R>(fn: WrappedAsyncFunction<DR, R>): ((...args: T) => Promise<R>) {
  return async function(...args: T): Promise<R> {
    const deferredStack: Function[] = [];
    const context = {
      defer(deferredFn: Function) {
        deferredStack.push(deferredFn);
      }
    };
    try {
      return await fn.apply(this, [context, ...args]);
    } finally {
      // Execute deferred functions in LIFO order
      while (deferredStack.length > 0) {
        const deferredFn = deferredStack.pop();
        if (typeof deferredFn === "undefined") {
          continue;
        }
        try {
          var promiseMaybe = deferredFn();
          if (promiseMaybe instanceof Promise) {
            await promiseMaybe;
          }
        } catch (error) {
          console.error("Error in deferred function:", error);
        }
      }
    }
  };
}

type WrappedFunction<DR, R> = ({ defer }: { defer: DeferFunction<DR> }) => R;
export function withDeferredSync<T extends any[], DR, R>(fn: WrappedFunction<DR, R>): ((...args: T) => R) {
  return function(...args: T): R {
    const deferredStack: Function[] = [];
    const context = {
      defer(deferredFn: Function) {
        deferredStack.push(deferredFn);
      }
    };
    try {
      return fn.apply(this, [context, ...args]);
    } finally {
      // Execute deferred functions in LIFO order
      while (deferredStack.length !== 0) {
        const deferredFn = deferredStack.pop();
        if (typeof deferredFn === "undefined") {
          continue;
        }
        try {
          deferredFn();
        } catch (error) {
          console.error("Error in deferred function:", error);
        }
      }
    }
  };
}

