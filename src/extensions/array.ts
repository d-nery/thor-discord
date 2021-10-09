declare global {
  interface ArrayConstructor {
    range(start: number, end: number): number[];
  }
}

Array.range = (start, end) => Array.from({ length: end - start }, (v, k) => k + start);

export {};
