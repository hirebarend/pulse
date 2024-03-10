import * as mongoDb from 'mongodb';
import { Account } from './core';

/**
 * Load accounts into collection
 * @param {mongoDb.Collection<Account>} collection - The collection
 */
export async function loadAccounts(
  collection: mongoDb.Collection<Account>,
): Promise<void> {
  await collection.insertOne({
    balance: 971_992_547_409,
    reference: 'TEST_ACCOUNT_1',
  });

  await collection.insertOne({
    balance: 971_992_547_409,
    reference: 'TEST_ACCOUNT_2',
  });

  await collection.insertOne({
    balance: 971_992_547_409,
    reference: 'TEST_ACCOUNT_3',
  });
}
