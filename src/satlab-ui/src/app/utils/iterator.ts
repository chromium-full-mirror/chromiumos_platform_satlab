function* map<T, U>(iter: Iterator<T>, f: (elem: T) => U) {
  let next = iter.next();

  while (next.done === false) {
    yield f(next.value);
    next = iter.next();
  }
}

function* filter<T>(iter: Iterator<T>, f: (elem: T) => boolean) {
  let next = iter.next();

  while (next.done === false) {
    if (f(next.value)) {
      yield next.value;
    }
    next = iter.next();
  }
}

function* uniqueBy<T>(iter: Iterator<T>) {
  const seen: T[] = [];
  let next = iter.next();

  while (next.done === false) {
    if (seen.indexOf(next.value) === -1) {
      seen.push(next.value);
      yield next.value;
    }
    next = iter.next();
  }
}

function* uniqueByWhere<T>(iter: Iterator<T>, f: (a: T, b: T) => boolean) {
  const seen: T[] = [];
  let next = iter.next();

  while (next.done === false) {
    if (seen.length === 0) {
      seen.push(next.value);
      yield next.value;
    } else {
      for (const s of seen) {
        if (!f(s, next.value)) {
          seen.push(next.value);
          yield next.value;
        }
      }
    }
    next = iter.next();
  }
}

function* flatten<T>(iter: Iterator<T>) {
  let next = iter.next();

  while (next.done === false) {
    if (Array.isArray(next.value)) {
      for (const v of next.value) {
        yield v;
      }
    } else {
      yield next.value;
    }

    next = iter.next();
  }
}

function forEach<T>(iter: Iterator<T>, f: (elem: T) => void) {
  let next = iter.next();

  while (next.done === false) {
    f(next.value);
    next = iter.next();
  }
}

/**
 * find the first element that match the condition. If we don't find
 * it, we will return null.
 * @param iter the iterator object.
 * @param f the filter function
 */
function firstWhere<T>(iter: Iterator<T>, f: (elem: T) => boolean) {
  let next = iter.next();

  while (next.done === false) {
    if (f(next.value)) {
      return next.value;
    }
    next = iter.next();
  }

  return null;
}

function* fromArray<T>(array: T[]) {
  for (const v of array) {
    yield v;
  }
}

function collect<T>(iter: Iterator<T>) {
  const result: T[] = [];
  let next = iter.next();
  while (next.done == false) {
    result.push(next.value);
    next = iter.next();
  }

  return result;
}

export const fromIter = <T>(iter: Iterator<T>) => {
  return {
    filter: (f: (elem: T) => boolean) => fromIter(filter(iter, f)),
    map: <U>(f: (elem: T) => U) => fromIter(map(iter, f)),
    unique_by: () => fromIter(uniqueBy(iter)),
    unique_by_where: (f: (a: T, b: T) => boolean) =>
      fromIter(uniqueByWhere(iter, f)),
    flatten: () => fromIter(flatten(iter)),
    first_where: (f: (elem: T) => boolean) => firstWhere(iter, f),
    forEach: (f: (elem: T) => void) => forEach(iter, f),
    collect: () => collect(iter),
  };
};

export const toIterator = <T>(array: T[]) => fromIter(fromArray(array));
