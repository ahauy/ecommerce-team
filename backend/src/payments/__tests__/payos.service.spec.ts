import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';
import { PayosService } from '../payos.service';

const env: Record<string, string> = {
  PAYOS_CLIENT_ID: 'client-id',
  PAYOS_API_KEY: 'api-key',
  PAYOS_CHECKSUM_KEY: 'test-checksum-key',
};
const config = {
  getOrThrow: (key: string) => env[key],
} as unknown as ConfigService;

const webhookData = {
  orderCode: 1791277078123,
  amount: 59980000,
  description: '7F3K9QX2A',
  accountNumber: '12345678',
  reference: 'FT26275000001',
  transactionDateTime: '2026-10-02 10:05:12',
  currency: 'VND',
  paymentLinkId: '2e4acf1083304877bf1a8c108b30cccd',
  code: '00',
  desc: 'success',
  counterAccountBankId: '',
  counterAccountBankName: '',
  counterAccountName: '',
  counterAccountNumber: '',
  virtualAccountName: '',
  virtualAccountNumber: '',
};

const sign = (data: object, key = env.PAYOS_CHECKSUM_KEY) =>
  new PayOS({
    clientId: 'x',
    apiKey: 'x',
    checksumKey: key,
  }).crypto.createSignatureFromObj(data, key);

describe('PayosService.verifyWebhook (chữ ký thật của SDK)', () => {
  const service = new PayosService(config);

  it('chữ ký đúng: trả về data', async () => {
    const signature = await sign(webhookData);

    await expect(
      service.verifyWebhook({
        code: '00',
        desc: 'success',
        success: true,
        data: webhookData,
        signature,
      }),
    ).resolves.toMatchObject({ orderCode: 1791277078123, amount: 59980000 });
  });

  it('data bị sửa sau khi ký: từ chối', async () => {
    const signature = await sign(webhookData);

    await expect(
      service.verifyWebhook({
        code: '00',
        desc: 'success',
        success: true,
        data: { ...webhookData, amount: 1000 },
        signature,
      }),
    ).rejects.toThrow();
  });

  it('ký bằng checksum key khác: từ chối', async () => {
    const signature = await sign(webhookData, 'another-key');

    await expect(
      service.verifyWebhook({
        code: '00',
        desc: 'success',
        success: true,
        data: webhookData,
        signature,
      }),
    ).rejects.toThrow();
  });

  it('thiếu chữ ký hoặc data: từ chối', async () => {
    await expect(
      service.verifyWebhook({ data: webhookData }),
    ).rejects.toThrow();
    await expect(service.verifyWebhook({ signature: 'abc' })).rejects.toThrow();
  });
});
