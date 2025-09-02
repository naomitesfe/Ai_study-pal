import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const createPaymentIntent = action({
  args: {
    amount: v.number(),
    tokens: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // In a real app, you would use Stripe here
    // For demo purposes, we'll simulate a payment
    const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create a pending transaction
    await ctx.runMutation(internal.payments.createTransaction, {
      userId,
      type: "token_purchase",
      amount: args.amount,
      tokens: args.tokens,
      status: "pending",
      stripePaymentId: paymentIntentId,
      description: `Purchase ${args.tokens} tokens`,
    });

    return {
      clientSecret: `${paymentIntentId}_secret_demo`,
      paymentIntentId,
    };
  },
});

export const confirmPayment = mutation({
  args: {
    paymentIntentId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find the transaction
    const transaction = await ctx.db
      .query("transactions")
      .filter((q) => q.eq(q.field("stripePaymentId"), args.paymentIntentId))
      .first();

    if (!transaction || transaction.userId !== userId) {
      throw new Error("Transaction not found");
    }

    if (transaction.status !== "pending") {
      throw new Error("Transaction already processed");
    }

    // Update transaction status
    await ctx.db.patch(transaction._id, {
      status: "completed",
    });

    // Add tokens to user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (profile) {
      await ctx.db.patch(profile._id, {
        tokens: profile.tokens + (transaction.tokens || 0),
      });
    }

    // Create success notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Payment Successful",
      message: `Successfully purchased ${transaction.tokens} tokens!`,
      type: "success",
      read: false,
    });

    return true;
  },
});

export const createTransaction = internalMutation({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("token_purchase"),
      v.literal("tutoring_payment"),
      v.literal("tutor_earning"),
      v.literal("withdrawal")
    ),
    amount: v.number(),
    tokens: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    stripePaymentId: v.optional(v.string()),
    sessionId: v.optional(v.id("tutoringSessions")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("transactions", args);
  },
});

export const getUserTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(20);
  },
});
