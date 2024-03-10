import autocannon from 'autocannon';
import * as mongoDb from 'mongodb';
import { loadVouchers } from './vouchers';
import { loadAccounts } from './accounts';
import { loadTransactions } from './transactions';
import { Account, Transaction, Voucher } from './core';

(async () => {
  try {
    console.log(`waiting...`);

    for (let i = 0; i < 5 * 60; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // const mongoClient: mongoDb.MongoClient = await mongoDb.MongoClient.connect(
    //   (process.env.MONGODB_CONNECTION_STRING as string | null) ||
    //     'mongodb+srv://default:T8sSufqGMkRKh3YAdXWjDU@cosmon-pulse-prod.mongocluster.cosmos.azure.com/?tls=true&authMechanism=SCRAM-SHA-256&retrywrites=false&maxIdleTimeMS=120000',
    //   {
    //     ssl: true,
    //   },
    // );

    const mongoClient: mongoDb.MongoClient = await mongoDb.MongoClient.connect(
      (process.env.MONGODB_CONNECTION_STRING as string | null) ||
        'mongodb://cosmon-pulse-prod:M6SZrsF2jxVkrB7gjvAtnUpUKgrIkHWEV3pPYntCjwXgHwzL5r3k5CeAReLtmkaDSKWAkLMiwi1pACDbIk0kkQ==@cosmon-pulse-prod.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@cosmon-pulse-prod@',
      {
        ssl: true,
      },
    );

    const db: mongoDb.Db = mongoClient.db('pulse');

    const collections = await db.listCollections().toArray();

    if (collections.length) {
      await db.dropCollection('accounts');

      await db.dropCollection('transactions');

      await db.dropCollection('dynamic-vouchers');

      await db.dropCollection('static-vouchers');
    }

    const collectionAccounts: mongoDb.Collection<Account> =
      db.collection('accounts');

    const collectionTransactions: mongoDb.Collection<Transaction> =
      db.collection('transactions');

    const collectionDynamicVouchers: mongoDb.Collection<Voucher> =
      db.collection('dynamic-vouchers');

    const collectionStaticVouchers: mongoDb.Collection<Voucher> =
      db.collection('static-vouchers');

    console.log(`creating indexes`);

    await collectionAccounts.createIndex(
      { reference: 1 },
      { name: 'accounts_reference', unique: true },
    );

    await collectionTransactions.createIndex(
      { reference: 1 },
      { name: 'transactions_reference', unique: true },
    );

    await collectionDynamicVouchers.createIndex({ code: 1 });

    await collectionDynamicVouchers.createIndex(
      { reference: 1 },
      { name: 'dynamic_vouchers_reference', unique: true },
    );

    await collectionStaticVouchers.createIndex({ code: 1 });

    await collectionStaticVouchers.createIndex(
      {
        bucket: 1,
        status: 1,
        value: 1,
      },
      {
        name: 'static_vouchers_b_s_v',
      },
    );

    await collectionStaticVouchers.createIndex(
      { reference: 1 },
      {
        name: 'static_vouchers_reference',
      },
    );

    console.log(`created indexes`);

    console.log(`loading accounts`);

    await loadAccounts(collectionAccounts);

    console.log(`loaded accounts`);

    console.log(`loading transactions`);

    await loadTransactions(collectionTransactions);

    console.log(`loaded transactions`);

    console.log(`loading dynamic vouchers`);

    await Promise.all([
      loadVouchers('dynamic', collectionDynamicVouchers),
      loadVouchers('dynamic', collectionDynamicVouchers),
    ]);

    await Promise.all([
      loadVouchers('dynamic', collectionDynamicVouchers),
      loadVouchers('dynamic', collectionDynamicVouchers),
    ]);

    console.log(`loaded dynamic vouchers`);

    console.log(`loading static vouchers`);

    await Promise.all([
      loadVouchers('static', collectionStaticVouchers),
      loadVouchers('static', collectionStaticVouchers),
    ]);

    await Promise.all([
      loadVouchers('static', collectionStaticVouchers),
      loadVouchers('static', collectionStaticVouchers),
    ]);

    console.log(`loaded static vouchers`);

    await mongoClient.close();

    await autocannon({
      amount: 10_000,
      connections: 10,
      bailout: 100,
      method: 'POST',
      url: 'https://app-pulse-prod-001.azurewebsites.net/api/v1/TEST_ACCOUNT_1',
    });

    await autocannon({
      amount: 10_000,
      connections: 10,
      bailout: 100,
      method: 'POST',
      url: 'https://app-pulse-prod-001.azurewebsites.net/api/v1/TEST_ACCOUNT_2',
    });

    const result1 = await autocannon({
      amount: 300_000,
      connections: 20,
      bailout: 100,
      method: 'POST',
      url: 'https://app-pulse-prod-001.azurewebsites.net/api/v1/dynamic/TEST_ACCOUNT_1',
    });

    console.log(JSON.stringify(result1));

    const result2 = await autocannon({
      amount: 300_000,
      connections: 20,
      bailout: 100,
      method: 'POST',
      url: 'https://app-pulse-prod-001.azurewebsites.net/api/v1/static/TEST_ACCOUNT_2',
    });

    console.log(JSON.stringify(result2));
  } catch (error: any) {
    console.log(error.message);
  }
})();
