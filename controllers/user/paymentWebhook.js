// controllers/paymentWebhook.js
import Stripe from "stripe";
import { Invoice } from "../../models/hr/invoiceModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // You can attach invoiceId in metadata when creating session
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        await Invoice.findByIdAndUpdate(invoiceId, {
          status: "paid",
          paymentDate: new Date(),
        });
      }
    }

    res.json({ received: true });
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
