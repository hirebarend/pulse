import * as mongoDb from 'mongodb';
import { Account, Transaction } from '../../domain';

export class TransactionRepository {
  constructor(protected collection: mongoDb.Collection<Transaction>) {}

  public async create(
    account: Account,
    bucket: string,
    reference: string,
    value: number,
  ): Promise<boolean> {
    try {
      await this.collection.insertOne({
        account: account.reference,
        balance: account.balance,
        bucket,
        reference,
        status: 0,
        timestamp: new Date().getTime(),
        value,
      });

      return true;
    } catch {
      return false;
    }
  }
}
