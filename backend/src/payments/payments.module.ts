import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PayosService } from './payos.service';
import { Payment, PaymentSchema } from './schemas/payment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
  ],
  providers: [PayosService],
  exports: [PayosService, MongooseModule],
})
export class PaymentsModule {}
