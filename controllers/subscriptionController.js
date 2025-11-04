import Stripe from "stripe";
import { Subscription } from "../models/subscriptionModel.js";
import { Plan } from "../models/planModel.js";
import { User } from "../models/driver/userModel.js";

// Initialize Stripe (only if key is provided)
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn('⚠️ STRIPE_SECRET_KEY not found in environment variables');
}

// ✅ Get All Plans (for admin to view available plans)
export const getAllPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ status: 'active' })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Plans retrieved successfully",
      data: plans
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get Admin's Active Subscription
export const getMySubscription = async (req, res) => {
  try {
    const adminId = req.user._id;

    const subscription = await Subscription.findOne({
      admin: adminId,
      status: { $in: ['active', 'pending'] }
    })
      .populate('plan', 'planName planType description lifetime monthly')
      .sort({ createdAt: -1 });

    if (!subscription) {
      return res.json({
        success: true,
        message: "No active subscription found",
        data: null
      });
    }

    res.json({
      success: true,
      message: "Subscription retrieved successfully",
      data: subscription
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Get All Admin Subscriptions (for admin to view subscription history)
export const getMySubscriptions = async (req, res) => {
  try {
    const adminId = req.user._id;

    const subscriptions = await Subscription.find({ admin: adminId })
      .populate('plan', 'planName planType description')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: "Subscriptions retrieved successfully",
      data: subscriptions
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Create Subscription Checkout Session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, subscriptionType } = req.body;
    const adminId = req.user._id;
    const adminEmail = req.user.email;
    const adminName = req.user.name;

    // Validate Stripe configuration
    if (!stripe || !process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "Stripe is not configured. Please contact administrator.",
        stripeConfigured: false
      });
    }

    // Get plan
    const plan = await Plan.findById(planId);
    if (!plan || plan.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: "Plan not found or inactive"
      });
    }

    // Calculate price based on subscription type
    let amount = 0;
    let currency = 'CAD';
    let description = '';
    let isRecurring = false;

    if (plan.planType === 'lifetime') {
      if (subscriptionType === 'one-time') {
        amount = plan.lifetime?.oneTime?.price || 0;
        currency = plan.lifetime?.oneTime?.currency || 'CAD';
        description = `${plan.planName} - Lifetime (One-time payment)`;
      } else if (subscriptionType === '3-months') {
        if (!plan.lifetime?.installments?.threeMonths?.enabled) {
          return res.status(400).json({
            success: false,
            message: "3-month installment option is not available for this plan"
          });
        }
        amount = plan.lifetime?.installments?.threeMonths?.price || 0;
        currency = plan.lifetime?.installments?.threeMonths?.currency || 'CAD';
        description = `${plan.planName} - Lifetime (3 monthly installments)`;
        isRecurring = true;
      } else if (subscriptionType === '6-months') {
        if (!plan.lifetime?.installments?.sixMonths?.enabled) {
          return res.status(400).json({
            success: false,
            message: "6-month installment option is not available for this plan"
          });
        }
        amount = plan.lifetime?.installments?.sixMonths?.price || 0;
        currency = plan.lifetime?.installments?.sixMonths?.currency || 'CAD';
        description = `${plan.planName} - Lifetime (6 monthly installments)`;
        isRecurring = true;
      }
    } else if (plan.planType === 'monthly') {
      if (subscriptionType === 'full-app') {
        if (!plan.monthly?.fullApp?.enabled) {
          return res.status(400).json({
            success: false,
            message: "Full app option is not available for this plan"
          });
        }
        amount = plan.monthly?.fullApp?.price || 0;
        currency = plan.monthly?.fullApp?.currency || 'CAD';
        description = `${plan.planName} - Full App (Monthly)`;
        isRecurring = true;
      } else if (subscriptionType === 'without-hr') {
        if (!plan.monthly?.withoutHR?.enabled) {
          return res.status(400).json({
            success: false,
            message: "Without HR option is not available for this plan"
          });
        }
        amount = plan.monthly?.withoutHR?.price || 0;
        currency = plan.monthly?.withoutHR?.currency || 'CAD';
        description = `${plan.planName} - Without HR (Monthly)`;
        isRecurring = true;
      }
    }

    if (amount === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription type or pricing not configured"
      });
    }

    // Create or get Stripe customer
    let customerId = null;
    const admin = await User.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin user not found"
      });
    }
    
    if (!admin.stripeCustomerId) {
      if (!stripe) {
        return res.status(500).json({
          success: false,
          message: "Stripe is not configured. Please contact administrator."
        });
      }
      const customer = await stripe.customers.create({
        email: adminEmail,
        name: adminName,
        metadata: {
          adminId: adminId.toString(),
          companyId: admin.company?.toString() || ''
        }
      });
      customerId = customer.id;
      
      // Save customer ID to admin
      await User.findByIdAndUpdate(adminId, { stripeCustomerId: customer.id });
    } else {
      customerId = admin.stripeCustomerId;
    }

    // Create subscription record
    const subscription = new Subscription({
      admin: adminId,
      plan: planId,
      planType: plan.planType,
      subscriptionType: subscriptionType,
      amount: amount,
      currency: currency,
      status: 'pending',
      paymentStatus: 'pending',
      stripeCustomerId: customerId,
      installments: {
        total: subscriptionType === '3-months' ? 3 : subscriptionType === '6-months' ? 6 : 1,
        paid: 0,
        remaining: subscriptionType === '3-months' ? 3 : subscriptionType === '6-months' ? 6 : 1
      }
    });

    // Create Stripe checkout session
    const sessionConfig = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: plan.planName,
            description: description,
          },
          unit_amount: Math.round(amount * 100), // Convert to cents
          ...(isRecurring && {
            recurring: {
              interval: 'month',
              interval_count: 1
            }
          })
        },
        quantity: 1,
      }],
      mode: isRecurring ? 'subscription' : 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/subscription?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/admin/subscription?status=cancel`,
      metadata: {
        adminId: adminId.toString(),
        planId: planId.toString(),
        subscriptionType: subscriptionType,
        subscriptionId: subscription._id.toString()
      }
    };

    // For recurring subscriptions, set billing interval
    if (isRecurring && subscriptionType === '3-months') {
      sessionConfig.line_items[0].price_data.recurring.interval_count = 1;
      // Note: For 3/6 installments, we'll need to handle cancellation after the period
    }

    if (!stripe) {
      return res.status(500).json({
        success: false,
        message: "Stripe is not configured. Please contact administrator."
      });
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Save session ID to subscription
    subscription.stripeSessionId = session.id;
    await subscription.save();

    res.json({
      success: true,
      message: "Checkout session created successfully",
      data: {
        sessionId: session.id,
        url: session.url
      }
    });
  } catch (err) {
    console.error('Error creating checkout session:', err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

// ✅ Cancel Subscription
export const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const adminId = req.user._id;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      admin: adminId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found"
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: "Subscription is already cancelled"
      });
    }

    // Cancel Stripe subscription if exists
    if (subscription.stripeSubscriptionId && stripe) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (stripeErr) {
        console.error('Error cancelling Stripe subscription:', stripeErr);
      }
    }

    // Update subscription status
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: subscription
    });
  } catch (err) {
    console.error('Error cancelling subscription:', err);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message
    });
  }
};

