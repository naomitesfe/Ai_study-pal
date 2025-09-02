import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createProfile = mutation({
  args: {
    role: v.union(v.literal("student"), v.literal("tutor")),
    firstName: v.string(),
    lastName: v.string(),
    bio: v.optional(v.string()),
    expertise: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (existingProfile) {
      throw new Error("Profile already exists");
    }

    const profileId = await ctx.db.insert("profiles", {
      userId,
      role: args.role,
      firstName: args.firstName,
      lastName: args.lastName,
      bio: args.bio,
      expertise: args.expertise,
      hourlyRate: args.hourlyRate,
      tokens: args.role === "student" ? 10 : 0, // Give students 10 free tokens
      totalEarnings: args.role === "tutor" ? 0 : undefined,
      isApproved: args.role === "tutor" ? false : undefined,
    });

    // Create welcome notification
    await ctx.db.insert("notifications", {
      userId,
      title: "Welcome!",
      message: `Welcome to AI Study Partner! Your ${args.role} account has been created successfully.`,
      type: "success",
      read: false,
    });

    return profileId;
  },
});

export const updateProfile = mutation({
  args: {
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    bio: v.optional(v.string()),
    expertise: v.optional(v.array(v.string())),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    const updates: any = {};
    if (args.firstName !== undefined) updates.firstName = args.firstName;
    if (args.lastName !== undefined) updates.lastName = args.lastName;
    if (args.bio !== undefined) updates.bio = args.bio;
    if (args.expertise !== undefined) updates.expertise = args.expertise;
    if (args.hourlyRate !== undefined) updates.hourlyRate = args.hourlyRate;

    await ctx.db.patch(profile._id, updates);
    return profile._id;
  },
});

export const getProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();
  },
});

export const getTutors = query({
  args: {
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("profiles")
      .withIndex("by_tutor_approved", (q) => 
        q.eq("role", "tutor").eq("isApproved", true)
      );

    const tutors = await query.collect();

    // Filter by subject if provided
    if (args.subject) {
      return tutors.filter(tutor => 
        tutor.expertise?.some(exp => 
          exp.toLowerCase().includes(args.subject!.toLowerCase())
        )
      );
    }

    return tutors;
  },
});

export const getTutorById = query({
  args: { tutorId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.tutorId))
      .unique();

    if (!profile || profile.role !== "tutor") {
      return null;
    }

    // Get user info
    const user = await ctx.db.get(args.tutorId);
    
    return {
      ...profile,
      email: user?.email,
    };
  },
});

export const addTokens = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      tokens: profile.tokens + args.amount,
    });

    return profile.tokens + args.amount;
  },
});

export const deductTokens = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.tokens < args.amount) {
      throw new Error("Insufficient tokens");
    }

    await ctx.db.patch(profile._id, {
      tokens: profile.tokens - args.amount,
    });

    return profile.tokens - args.amount;
  },
});
