import { faker } from '@faker-js/faker';
import * as mongoDb from 'mongodb';
import * as uuid from 'uuid';
import { chunk } from './utils';
import { Transaction } from './core';
import { BUCKETS } from './constants';

export function generateTransactions(n: number): Array<Transaction> {
  const transactions: Array<Transaction> = [];

  for (let i = 0; i < n; i++) {
    const bucket: string = faker.helpers.arrayElement(BUCKETS);

    transactions.push({
      account: faker.helpers.arrayElement([
        'TEST_ACCOUNT_1',
        'TEST_ACCOUNT_2',
        'TEST_ACCOUNT_3',
      ]),
      balance: 0,
      bucket,
      reference: `${bucket}_${uuid.v4()}`,
      status: 0,
      timestamp: new Date().getTime(),
      value: faker.helpers.arrayElement([10, 20, 50, 100, 200]),
    });
  }

  return transactions;
}

export async function loadTransactions(
  collection: mongoDb.Collection<Transaction>,
): Promise<void> {
  const transactions = generateTransactions(1_000_000);

  const transactionsChunks = chunk(transactions, 10_000);

  for (const transactionsChunk of transactionsChunks) {
    await collection.insertMany(transactionsChunk, {
      ordered: false,
      writeConcern: {
        journal: false,
        w: 0,
      },
    });
  }
}
