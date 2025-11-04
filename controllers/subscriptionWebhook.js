import Stripe from "stripe";
import { Subscription } from "../models/subscriptionModel.js";
import { User } from "../models/driver/userModel.js";

// Initialize Stripe (only if key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables');
}

export const handleSubscriptionWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      console.error("Stripe is not configured");
      return res.status(400).send("Stripe not configured");
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return res.status(400).send("Webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log(`Received webhook event: ${event.type}`);

    // Handle checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Checkout session completed:", session.id);

      const subscriptionId = session.metadata?.subscriptionId;
      const adminId = session.metadata?.adminId;
      const planId = session.metadata?.planId;
      const subscriptionType = session.metadata?.subscriptionType;

      if (subscriptionId) {
        const subscription = await Subscription.findById(subscriptionId);
        if (subscription) {
          subscription.paymentStatus = 'paid';
          subscription.status = 'active';
          subscription.stripePaymentIntentId = session.payment_intent;
          subscription.lastPaymentDate = new Date();
          subscription.startDate = new Date();

          // Handle installments
          if (subscriptionType === '3-months' || subscriptionType === '6-months') {
            subscription.installments.paid = 1;
            subscription.installments.remaining = subscription.installments.total - 1;
            
            // Calculate next billing date
            const nextBilling = new Date();
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            subscription.nextBillingDate = nextBilling;
          } else if (subscriptionType === 'one-time') {
            subscription.installments.paid = 1;
            subscription.installments.remaining = 0;
            // Lifetime one-time has no end date
          } else if (subscriptionType === 'full-app' || subscriptionType === 'without-hr') {
            // Monthly subscription
            const nextBilling = new Date();
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            subscription.nextBillingDate = nextBilling;
          }

          await subscription.save();
          console.log(`Subscription ${subscriptionId} activated`);
        }
      }
    }

    // Handle subscription updates
    if (event.type === "customer.subscription.updated") {
      const stripeSubscription = event.data.object;
      console.log("Subscription updated:", stripeSubscription.id);

      const subscription = await Subscription.findOne({
        stripeSubscriptionId: stripeSubscription.id
      });

      if (subscription) {
        if (stripeSubscription.status === 'active') {
          subscription.status = 'active';
        } else if (stripeSubscription.status === 'canceled') {
          subscription.status = 'cancelled';
          subscription.cancelledAt = new Date();
        } else if (stripeSubscription.status === 'past_due') {
          subscription.status = 'past_due';
        }

        await subscription.save();
      }
    }

    // Handle invoice payment succeeded (for recurring payments)
    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      console.log("Invoice payment succeeded:", invoice.id);

      const stripeSubscriptionId = invoice.subscription;
      
      if (stripeSubscriptionId) {
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscriptionId
        });

        if (subscription) {
          subscription.paymentStatus = 'paid';
          subscription.lastPaymentDate = new Date();
          
          // Update installment tracking
          if (subscription.installments.remaining > 0) {
            subscription.installments.paid += 1;
            subscription.installments.remaining -= 1;
          }

          // Update next billing date
          if (subscription.nextBillingDate) {
            const nextBilling = new Date(subscription.nextBillingDate);
            nextBilling.setMonth(nextBilling.getMonth() + 1);
            subscription.nextBillingDate = nextBilling;
          }

          await subscription.save();
        }
      }
    }

    // Handle invoice payment failed
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      console.log("Invoice payment failed:", invoice.id);

      const stripeSubscriptionId = invoice.subscription;
      
      if (stripeSubscriptionId) {
        const subscription = await Subscription.findOne({
          stripeSubscriptionId: stripeSubscriptionId
        });

        if (subscription) {
          subscription.paymentStatus = 'failed';
          subscription.status = 'past_due';
          await subscription.save();
        }
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};

