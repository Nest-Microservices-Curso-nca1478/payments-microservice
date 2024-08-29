import { Request, Response } from 'express';
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config';
import { PaymentSessionDto } from './dto/payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items } = paymentSessionDto;
    const lineItems = items.map((item) => {
      return {
        price_data: {
          currency,
          product_data: { name: item.name },
          unit_amount: Math.round(item.price * 100), // 20 dolares -> 2000 / 100 = 20.00
        },
        quantity: item.quantity,
      };
    });

    const session = await this.stripe.checkout.sessions.create({
      // colocar el id de la orden
      payment_intent_data: {
        metadata: {},
      },
      line_items: lineItems,
      mode: 'payment',
      success_url: 'http://localhost:3003/payments/success', // url del front
      cancel_url: 'http://localhost:3003/payments/cancel', // url del front
    });

    return session;
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    console.log(sig);

    return res.status(200).json({
      sig,
    });
  }
}
