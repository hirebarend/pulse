/**
 * Definition of a voucher
 */
export type Voucher = {
  bucket: string;
  code: string;
  reference: string | null;
  status: number;
  timestamp: number | null;
  value: number;
};
