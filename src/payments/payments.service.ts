import { Request, Response } from 'express';
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config';
import { PaymentSessionDto } from './dto/payment-session.dto';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);

  async createPaymentSession(paymentSessionDto: PaymentSessionDto) {
    const { currency, items, orderId } = paymentSessionDto;
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
        metadata: {
          orderId,
        },
      },
      line_items: lineItems,
      mode: 'payment',

      // urls del front
      success_url: envs.stripeSuccessUrl,
      cancel_url: envs.stripeCancelUrl,
    });

    return {
      cancelUrl: session.cancel_url,
      successUrl: session.success_url,
      url: session.url,
    };
  }

  async stripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    let event: Stripe.Event;
    // testing: https://dashboard.stripe.com/test/webhooks/create?endpoint_location=local
    // const endpointSecret = "crear para testing"

    // production
    const endpointSecret = envs.stripeEndpointSecret;

    try {
      event = this.stripe.webhooks.constructEvent(
        req['rawBody'],
        sig,
        endpointSecret,
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'charge.succeeded':
        // TODO: llamar nuestro microservicio
        const chargeSucceeded = event.data.object;
        console.log({
          metadata: chargeSucceeded.metadata,
          orderId: chargeSucceeded.metadata.orderId,
        });
        break;

      default:
        console.log(`Event ${event.type} not handle!`);
        break;
    }

    return res.status(200).json({
      sig,
    });
  }
}
