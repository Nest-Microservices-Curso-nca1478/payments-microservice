import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession() {
    const session = await this.stripe.checkout.sessions.create({
      // colocar el id de la orden
      payment_intent_data: {
        metadata: {},
      },

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Teclado',
            },
            unit_amount: 2000, // 20 dolares -> 2000 / 100 = 20.00
          },
          quantity: 2,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success', // url del front
      cancel_url: 'http://localhost:3003/payments/cancel', // url del front
    });

    return session;
  }
}
