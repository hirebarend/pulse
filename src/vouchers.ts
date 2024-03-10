import { faker } from '@faker-js/faker';
import * as mongoDb from 'mongodb';
import * as uuid from 'uuid';
import { chunk } from './utils';
import { BUCKETS } from './constants';
import { Voucher } from './core';

export function generateVouchers(
  type: 'dynamic' | 'static',
  n: number,
): Array<Voucher> {
  const vouchers: Array<Voucher> = [];

  for (let i = 0; i < n; i++) {
    const bucket: string = faker.helpers.arrayElement(BUCKETS);

    vouchers.push({
      bucket,
      code: `${bucket}_${faker.string.numeric({
        length: 16,
      })}`,
      reference: type === 'dynamic' ? `${bucket}_${uuid.v4()}` : null,
      status: type === 'dynamic' ? 1 : 0,
      timestamp: type === 'dynamic' ? new Date().getTime() : null,
      value: faker.helpers.arrayElement([10, 20, 50, 100, 200]),
    });
  }

  return vouchers;
}

export async function loadVouchers(
  type: 'dynamic' | 'static',
  collection: mongoDb.Collection<Voucher>,
): Promise<void> {
  const vouchers = generateVouchers(type, 1_000_000);

  const vouchersChunks = chunk(vouchers, 10_000);

  for (const vouchersChunk of vouchersChunks) {
    await collection.insertMany(vouchersChunk, {
      ordered: false,
      writeConcern: {
        journal: false,
        w: 0,
      },
    });
  }
}
