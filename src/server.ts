import * as applicationinsights from 'applicationinsights';
import { faker } from '@faker-js/faker';
import fastify, { FastifyRequest } from 'fastify';
import * as mongoDb from 'mongodb';
import os from 'os';
import * as uuid from 'uuid';
import {
  Account,
  AccountRepository,
  Transaction,
  TransactionRepository,
  Voucher,
  VoucherRepository,
} from './core';
import { BUCKETS } from './constants';

export async function startServer() {
  if (process.env.CUSTOM_APPLICATIONINSIGHTS_CONNECTION_STRING) {
    applicationinsights
      .setup(process.env.CUSTOM_APPLICATIONINSIGHTS_CONNECTION_STRING)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(false, false) // true, true
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(false) // true
      .setAutoCollectConsole(true)
      .setUseDiskRetryCaching(false) // true
      .setSendLiveMetrics(false)
      .setDistributedTracingMode(applicationinsights.DistributedTracingModes.AI)
      .setAutoCollectHeartbeat(false);

    applicationinsights.start();
  }

  const mongoClient: mongoDb.MongoClient = await mongoDb.MongoClient.connect(
    process.env.MONGODB_CONNECTION_STRING as string,
    {
      ssl: true,
    },
  );

  const db: mongoDb.Db = mongoClient.db('pulse');

  const collectionAccounts: mongoDb.Collection<Account> =
    db.collection('accounts');

  const collectionTransactions: mongoDb.Collection<Transaction> =
    db.collection('transactions');

  const collectionDynamicVouchers: mongoDb.Collection<Voucher> =
    db.collection('dynamic-vouchers');

  const collectionStaticVouchers: mongoDb.Collection<Voucher> =
    db.collection('static-vouchers');

  const accountRepository: AccountRepository = new AccountRepository(
    collectionAccounts,
  );

  const transactionRepository: TransactionRepository =
    new TransactionRepository(collectionTransactions);

  const dynamicVoucherRepository: VoucherRepository = new VoucherRepository(
    'dynamic',
    collectionDynamicVouchers,
  );

  const staticVoucherRepository: VoucherRepository = new VoucherRepository(
    'static',
    collectionStaticVouchers,
  );

  const server = fastify({
    logger: process.env.DEBUG
      ? true
      : {
          level: 'error',
        },
  });

  // await server.register(fastifyCors, {
  //   allowedHeaders: '*',
  //   origin: '*',
  // });

  server.route({
    handler: async (request, reply) => {
      reply.status(200).send({
        cpus: os.cpus().length,
      });
    },
    method: 'GET',
    url: '/info',
  });

  server.route({
    handler: async (request: FastifyRequest, reply) => {
      const bucket: string = faker.helpers.arrayElement(BUCKETS);

      const reference: string = `${bucket}_${uuid.v4()}`;

      const value: number = 100;

      const account: Account = await accountRepository.reserve(
        (request.params as { reference: string }).reference,
        value * -1,
      );

      await transactionRepository.create(
        account,
        bucket,
        reference,
        value * -1,
      );

      const voucher: Voucher = await dynamicVoucherRepository.create(
        bucket,
        reference,
        value,
      );

      reply.status(200).send(voucher);
    },
    method: 'POST',
    url: '/api/v1/dynamic/:reference',
  });

  server.route({
    handler: async (request: FastifyRequest, reply) => {
      const bucket: string = faker.helpers.arrayElement(BUCKETS);

      const reference: string = `${bucket}_${uuid.v4()}`;

      const value: number = faker.helpers.arrayElement([10, 20, 50, 100, 200]);

      const account: Account = await accountRepository.reserve(
        (request.params as { reference: string }).reference,
        value * -1,
      );

      await transactionRepository.create(
        account,
        bucket,
        reference,
        value * -1,
      );

      const voucher: Voucher = await staticVoucherRepository.create(
        bucket,
        reference,
        value,
      );

      reply.status(200).send(voucher);
    },
    method: 'POST',
    url: '/api/v1/static/:reference',
  });

  await server.listen({
    host: '0.0.0.0',
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  });

  await server.ready();
}
