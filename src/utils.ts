export function chunk<T>(arr: Array<T>, n: number): Array<Array<T>> {
  return arr.reduce((result: Array<Array<T>>, item, index) => {
    const itemIndex: number = Math.floor(index / n);

    if (!result[itemIndex]) {
      result[itemIndex] = [];
    }

    result[itemIndex].push(item);

    return result;
  }, []);
}
