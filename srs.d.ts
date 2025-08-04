
declare module "srs" {
  export default class SRSRewriter {
    constructor(options: {
      key: string;
      prefix: string;
      domain?: string;
      validityDays?: number;
    });

    srsKey: string;
    srsPrefix: string;
    alphabet32: string;
    srsDomain: string;
    validityDays: number;

    parseEmail(email: string): { username: string; domain: string };
    timestamp2date(timestamp: number): string;
    date2timestamp(date?: string): Date;
    is(srsAddress: string): boolean;
    getParts(
      srsAddress: string
    ): {
      prefix: string;
      hash: string;
      encodedTimestamp: string;
      domain: string;
      username: string;
    };
    decode(srsAddress: string): { date: string; email: string };
    encode(email: string, date?: string): string;
    decodeInt32(encoded: string): number;
    encodeInt32(n: number, acc?: string): string;
  }
}
