export function getRPCHost() {
  return 'http://10.240.102.38:8080/satlab/rpc';
}

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

function* fromArray<T>(array: T[]) {
  for (const v of array) {
    yield v;
  }
}

function collect<T>(iter: Iterator<T>) {
  const result: T[] = [];
  let next = iter.next();
  while (next.done === false) {
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
    flatten: () => fromIter(flatten(iter)),
    collect: () => collect(iter),
  };
};

export const toIterator = <T>(array: T[]) => fromIter(fromArray(array));
