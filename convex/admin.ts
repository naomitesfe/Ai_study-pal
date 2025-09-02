import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

async function requireAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_user", (q: any) => q.eq("userId", userId))
    .unique();

  if (!profile || profile.role !== "admin") {
    throw new Error("Admin access required");
  }

  return { userId, profile };
}

export const getAllUsers = query({
  args: {
    role: v.optional(v.union(v.literal("student"), v.literal("tutor"), v.literal("admin"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.role) {
      const profiles = await ctx.db
        .query("profiles")
        .withIndex("by_role", (q: any) => q.eq("role", args.role))
        .collect();
      
      // Get user emails
      const usersWithEmails = await Promise.all(
        profiles.map(async (profile) => {
          const user = await ctx.db.get(profile.userId);
          return {
            ...profile,
            email: user?.email,
          };
        })
      );

      return usersWithEmails;
    }

    const profiles = await ctx.db.query("profiles").collect();

    // Get user emails
    const usersWithEmails = await Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          email: user?.email,
        };
      })
    );

    return usersWithEmails;
  },
});

export const approveTutor = mutation({
  args: {
    tutorId: v.id("users"),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const tutorProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.tutorId))
      .unique();

    if (!tutorProfile || tutorProfile.role !== "tutor") {
      throw new Error("Tutor not found");
    }

    await ctx.db.patch(tutorProfile._id, {
      isApproved: args.approved,
    });

    // Create notification for tutor
    await ctx.db.insert("notifications", {
      userId: args.tutorId,
      title: args.approved ? "Application Approved" : "Application Rejected",
      message: args.approved 
        ? "Congratulations! Your tutor application has been approved. You can now receive tutoring requests."
        : "Your tutor application has been rejected. Please contact support for more information.",
      type: args.approved ? "success" : "warning",
      read: false,
    });

    return true;
  },
});

export const getAllNotes = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const notes = await ctx.db.query("notes").order("desc").collect();

    // Get user info for each note
    const notesWithUsers = await Promise.all(
      notes.map(async (note) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", note.userId))
          .unique();
        
        return {
          ...note,
          user: profile,
        };
      })
    );

    return notesWithUsers;
  },
});

export const getAllSessions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const sessions = await ctx.db.query("tutoringSessions").order("desc").collect();

    // Get user info for each session
    const sessionsWithUsers = await Promise.all(
      sessions.map(async (session) => {
        const studentProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", session.studentId))
          .unique();
        
        const tutorProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", session.tutorId))
          .unique();
        
        return {
          ...session,
          student: studentProfile,
          tutor: tutorProfile,
        };
      })
    );

    return sessionsWithUsers;
  },
});

export const getAllTransactions = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const transactions = await ctx.db.query("transactions").order("desc").collect();

    // Get user info for each transaction
    const transactionsWithUsers = await Promise.all(
      transactions.map(async (transaction) => {
        const profile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", transaction.userId))
          .unique();
        
        return {
          ...transaction,
          user: profile,
        };
      })
    );

    return transactionsWithUsers;
  },
});

export const getSystemStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const [
      totalUsers,
      totalStudents,
      totalTutors,
      approvedTutors,
      totalNotes,
      totalSessions,
      completedSessions,
      totalTransactions,
    ] = await Promise.all([
      ctx.db.query("profiles").collect().then(profiles => profiles.length),
      ctx.db.query("profiles").withIndex("by_role", (q) => q.eq("role", "student")).collect().then(profiles => profiles.length),
      ctx.db.query("profiles").withIndex("by_role", (q) => q.eq("role", "tutor")).collect().then(profiles => profiles.length),
      ctx.db.query("profiles").withIndex("by_tutor_approved", (q) => q.eq("role", "tutor").eq("isApproved", true)).collect().then(profiles => profiles.length),
      ctx.db.query("notes").collect().then(notes => notes.length),
      ctx.db.query("tutoringSessions").collect().then(sessions => sessions.length),
      ctx.db.query("tutoringSessions").withIndex("by_status", (q) => q.eq("status", "completed")).collect().then(sessions => sessions.length),
      ctx.db.query("transactions").collect().then(transactions => transactions.length),
    ]);

    // Calculate total revenue
    const transactions = await ctx.db.query("transactions").collect();
    const totalRevenue = transactions
      .filter(t => t.type === "tutoring_payment" && t.status === "completed")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalUsers,
      totalStudents,
      totalTutors,
      approvedTutors,
      totalNotes,
      totalSessions,
      completedSessions,
      totalTransactions,
      totalRevenue,
    };
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Delete user profile
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();

    if (profile) {
      await ctx.db.delete(profile._id);
    }

    // Delete user's notes and associated data
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const note of notes) {
      // Delete flashcards
      const flashcards = await ctx.db
        .query("flashcards")
        .withIndex("by_note", (q) => q.eq("noteId", note._id))
        .collect();
      for (const flashcard of flashcards) {
        await ctx.db.delete(flashcard._id);
      }

      // Delete quizzes
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_note", (q) => q.eq("noteId", note._id))
        .collect();
      for (const quiz of quizzes) {
        await ctx.db.delete(quiz._id);
      }

      // Delete summaries
      const summaries = await ctx.db
        .query("summaries")
        .withIndex("by_note", (q) => q.eq("noteId", note._id))
        .collect();
      for (const summary of summaries) {
        await ctx.db.delete(summary._id);
      }

      await ctx.db.delete(note._id);
    }

    // Delete user's transactions
    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const transaction of transactions) {
      await ctx.db.delete(transaction._id);
    }

    // Delete user's notifications
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const notification of notifications) {
      await ctx.db.delete(notification._id);
    }

    // Finally delete the user
    await ctx.db.delete(args.userId);

    return true;
  },
});
