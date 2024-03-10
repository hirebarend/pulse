import { faker } from '@faker-js/faker';
import * as mongoDb from 'mongodb';
import { Voucher } from '../../domain';
import { BUCKETS } from '../../../constants';

export class VoucherRepository {
  constructor(
    protected type: 'dynamic' | 'static',
    protected collection: mongoDb.Collection<Voucher>,
  ) {}

  public async create(
    bucket: string,
    reference: string,
    value: number,
  ): Promise<Voucher> {
    try {
      if (this.type === 'dynamic') {
        const voucher: Voucher = {
          bucket,
          code: faker.string.numeric({
            length: 16,
          }),
          reference,
          status: 1,
          timestamp: new Date().getTime(),
          value,
        };

        await this.collection.insertOne(voucher);

        return voucher;
      }

      if (this.type === 'static') {
        let voucher: Voucher | null = await this.collection.findOne({
          bucket,
          reference,
        });

        if (voucher) {
          return voucher;
        }

        voucher = await this.collection.findOneAndUpdate(
          {
            bucket: faker.helpers.arrayElement(BUCKETS),
            status: 0,
            value,
          },
          {
            $set: {
              reference,
              status: 1,
              timestamp: new Date().getTime(),
            },
          },
        );

        if (!voucher) {
          throw new Error('unable to find voucher');
        }

        return voucher;
      }

      throw new Error('unable to find voucher');
    } catch (error) {
      const voucher: Voucher | null = await this.collection.findOne({
        reference,
      });

      if (!voucher) {
        throw error;
      }

      return voucher;
    }
  }
}
