// controllers/paymentWebhook.js
import Stripe from "stripe";
import { Invoice } from "../../models/hr/invoiceModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers["stripe-signature"];
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not set");
      return res.status(400).send("Webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(req.rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);

    console.log(`Received webhook event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log("Payment session completed:", session.id);

      // Get invoiceId from metadata
      const invoiceId = session.metadata?.invoiceId;
      if (invoiceId) {
        console.log(`Updating invoice ${invoiceId} to paid status`);
        
        const updatedInvoice = await Invoice.findByIdAndUpdate(
          invoiceId, 
          {
            status: "paid",
            paymentDate: new Date(),
          },
          { new: true }
        );

        if (updatedInvoice) {
          console.log(`Invoice ${invoiceId} updated successfully`);
        } else {
          console.error(`Invoice ${invoiceId} not found`);
        }
      } else {
        console.error("No invoiceId found in session metadata");
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
};
