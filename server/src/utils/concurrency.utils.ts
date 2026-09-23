import { AppError } from './index.js';

/**
 * Wait for a specified number of milliseconds.
 */
const delay = async (milliseconds: number): Promise<void> => {
  await new Promise<void>((resolve) => {
    setTimeout(resolve, milliseconds);
  });
};

export interface BatchConcurrencyOptions {
  concurrency?: number;
  delayBetweenBatchesMs?: number;
}

/**
 * Process items in parallel batches with a delay between batches.
 *
 * Example:
 * - 4 items
 * - concurrency: 3
 * - delayBetweenBatchesMs: 60000
 *
 * Batch 1: Items 1, 2, 3 (parallel)
 * Wait 60 seconds after all 3 finish
 * Batch 2: Item 4
 */
export const runWithConcurrency = async <T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  options: BatchConcurrencyOptions = {}
): Promise<R[]> => {
  const {
    concurrency = 3,
    delayBetweenBatchesMs = 60000,
  } = options;

  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError(
      'No items were provided for concurrent processing.',
      400
    );
  }

  if (
    concurrency < 1 ||
    !Number.isInteger(concurrency)
  ) {
    throw new AppError(
      'Concurrency must be a positive integer.',
      400
    );
  }

  if (
    delayBetweenBatchesMs < 0 ||
    !Number.isFinite(delayBetweenBatchesMs)
  ) {
    throw new AppError(
      'Delay between batches must be a non-negative number.',
      400
    );
  }

  const results: R[] = new Array(items.length);

  // Process items in batches.
  for (
    let batchStart = 0;
    batchStart < items.length;
    batchStart += concurrency
  ) {
    const batchEnd = Math.min(
      batchStart + concurrency,
      items.length
    );

    const batch = items.slice(batchStart, batchEnd);

    console.log(
      `\n[Batch] Starting items ${batchStart + 1} to ${batchEnd} of ${items.length}`
    );

    const batchResults = await Promise.all(
      batch.map(async (item, batchIndex) => {
        const originalIndex = batchStart + batchIndex;

        console.log(
          `[Worker] Starting item ${originalIndex + 1}/${items.length}`
        );

        const result = await worker(
          item,
          originalIndex
        );

        console.log(
          `[Worker] Completed item ${originalIndex + 1}/${items.length}`
        );

        return {
          index: originalIndex,
          result,
        };
      })
    );

    // Store results in their original order.
    for (const { index, result } of batchResults) {
      results[index] = result;
    }

    const isLastBatch = batchEnd >= items.length;

    // Do not wait after the final batch.
    if (!isLastBatch && delayBetweenBatchesMs > 0) {
      console.log(
        `\n[Batch] Completed. Waiting ${
          delayBetweenBatchesMs / 1000
        } seconds before the next batch...`
      );

      await delay(delayBetweenBatchesMs);

      console.log(
        '[Batch] Cooldown completed. Starting next batch.'
      );
    }
  }

  console.log(
    '\n[Batch] All items processed successfully.'
  );

  return results;
};