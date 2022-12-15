import { useCallback, useMemo, useRef, useState } from 'react';

export function useSet<T>(
  initialValues?: (() => Iterable<T>) | Iterable<T> | undefined,
): {
  add(value: T): void;
  delete(value: T): void;
  clear(): void;
  entries(): IterableIterator<[T, T]>;
  forEach(
    callback: (value: T, key: T, set: Set<T>) => void,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    thisArg?: any,
  ): void;
  has(value: T): boolean;
  keys(): IterableIterator<T>;
  readonly size: number;
  values(): IterableIterator<T>;
} {
  const set = useRef<Set<T>>();
  useMemo(() => {
    set.current = new Set(
      typeof initialValues == 'function' ? initialValues() : initialValues,
    );
  }, [initialValues]);
  const [, increment] = useState(0);

  const rerender = useCallback(() => increment((x) => x + 1), []);

  return useMemo(
    () => ({
      add(value: T) {
        if (!set.current?.has(value)) {
          set.current?.add(value);
          rerender();
        }
      },
      delete(value: T) {
        if (set.current?.has(value)) {
          set.current?.delete(value);
          rerender();
        }
      },
      clear() {
        if (set.current?.size) {
          set.current?.clear();
          rerender();
        }
      },
      entries() {
        /* istanbul ignore next: set.current should never throw, but TypeScript needs the type safety */
        if (!set.current) {
          throw new Error('Uninitialized Set');
        }
        return set.current.entries();
      },
      forEach(
        callback: (value: T, key: T, set: Set<T>) => void,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        thisArg?: any,
      ) {
        set.current?.forEach(callback, thisArg);
      },
      has(value: T) {
        /* istanbul ignore next: set.current should be undefined, but TypeScript needs the type safety */
        return set.current?.has(value) ?? false;
      },
      keys() {
        /* istanbul ignore next: set.current should never throw, but TypeScript needs the type safety */
        if (!set.current) {
          throw new Error('Uninitialized Set');
        }
        return set.current.keys();
      },
      get size() {
        /* istanbul ignore next: set.current should be undefined, but TypeScript needs the type safety */
        return set.current?.size ?? 0;
      },
      values() {
        /* istanbul ignore next: set.current should never throw, but TypeScript needs the type safety */
        if (!set.current) {
          throw new Error('Uninitialized Set');
        }
        return set.current.keys();
      },
    }),
    [rerender],
  );
}
