/**
 * Definition of a transaction
 */
export type Transaction = {
  account: string;
  balance: number;
  bucket: string;
  reference: string;
  status: number;
  timestamp: number;
  value: number;
};
