import { Router } from 'express'
import stripe from '../helpers/stripe.mjs';
import paymentModel from '../models/paymentModel.mjs';
import * as dotenv from "dotenv";
dotenv.config()

const router = Router()

router.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

router.post("/create-payment-intent", async (req, res) => {
  // console.log(JSON.stringify(req.body.cart));

  //you should fetch cart from server
  try {
    const customer = await stripe.customers.create({
      metadata: {
        user_id: req.body.userId,
        cart_id: req.body.cart_id,
      },
    });

    const paymentIntent = await stripe.paymentIntents.create({
      currency: "usd",
      amount: req.body.amount,
      // automatic_payment_methods: { enabled: true },
      payment_method_types: ['card'],
      metadata: { integration_check: 'accept_a_payment' },
      receipt_email: req.body.email,
      customer: customer.id,
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});


const endpointSecret = process.env.ENDPOINT_SECRET;
router.post('/webhook', async (request, response) => {
  // console.log(request.body);
  const sig = request.headers['stripe-signature'];

  let event;

  try {
    event = stripe.webhooks.constructEvent(request.rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(err);
    response.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const checkoutSessionCompleted = event.data.object;
      // console.log(checkoutSessionCompleted);
      // Then define and call a function to handle the event checkout.session.completed
      break;
    case 'payment_intent.succeeded':
      const paymentIntentSucceeded = event.data.object;
      // console.log(paymentIntentSucceeded);
      await stripe.customers
        .retrieve(paymentIntentSucceeded.customer)
        .then(async (customer) => {
          try {
            // create payment
            // console.log(customer.metadata);
            const payment = new paymentModel({
              cart_id: customer.metadata.cart_id,
              user_id: customer.metadata.user_id,
              payment_id: paymentIntentSucceeded.id,
              payment_email: paymentIntentSucceeded.receipt_email,
              total: paymentIntentSucceeded.amount / 100
            })
            await payment.save()
            console.log(payment + ' saved');
          } catch (err) {
            console.log(typeof createOrder);
            console.log(err);
          }
        })
        .catch((err) => console.log(err.message));

      // Then define and call a function to handle the event payment_intent.succeeded
      break;
    // ... handle other event types
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  // Return a 200 response to acknowledge receipt of the event
  response.send();
});


export default router