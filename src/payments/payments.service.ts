import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { envs } from '../config';

@Injectable()
export class PaymentsService {
  private readonly stripe = new Stripe(envs.stripeSecret);
}
