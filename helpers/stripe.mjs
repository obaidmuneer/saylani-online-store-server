import Stripe from 'stripe';
import * as dotenv from "dotenv";

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_PRIVATE_KEY);
export default stripe