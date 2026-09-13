export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>,
) {
  const results: R[] = [];

  for (let index = 0; index < items.length; index += concurrency) {
    results.push(...(await Promise.all(items.slice(index, index + concurrency).map(mapper))));
  }

  return results;
}
