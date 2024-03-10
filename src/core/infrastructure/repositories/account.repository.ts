import * as mongoDb from 'mongodb';
import { Account } from '../../domain';

export class AccountRepository {
  constructor(protected collection: mongoDb.Collection<Account>) {}

  public async reserve(reference: string, value: number): Promise<Account> {
    const account: Account | null = await this.collection.findOneAndUpdate(
      {
        balance: { $gte: value },
        reference,
      },
      {
        $inc: {
          balance: value,
        },
      },
    );

    if (!account) {
      throw new Error('unable to find account');
    }

    return {
      balance: account.balance + value,
      reference: account.reference,
    };
  }
}
