import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const requestTutoringSession = mutation({
  args: {
    tutorId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    scheduledTime: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get student profile
    const studentProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .unique();

    if (!studentProfile || studentProfile.role !== "student") {
      throw new Error("Only students can request tutoring sessions");
    }

    // Get tutor profile
    const tutorProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.tutorId))
      .unique();

    if (!tutorProfile || tutorProfile.role !== "tutor" || !tutorProfile.isApproved) {
      throw new Error("Tutor not found or not approved");
    }

    const price = (tutorProfile.hourlyRate || 0) * (args.duration / 60);

    // Check if student has enough tokens
    if (studentProfile.tokens < price) {
      throw new Error("Insufficient tokens");
    }

    const sessionId = await ctx.db.insert("tutoringSessions", {
      studentId: userId,
      tutorId: args.tutorId,
      subject: args.subject,
      description: args.description,
      scheduledTime: args.scheduledTime,
      duration: args.duration,
      status: "pending",
      price,
    });

    // Create notification for tutor
    await ctx.db.insert("notifications", {
      userId: args.tutorId,
      title: "New Tutoring Request",
      message: `You have a new tutoring request for ${args.subject}`,
      type: "info",
      read: false,
      actionUrl: `/tutor/sessions/${sessionId}`,
    });

    return sessionId;
  },
});

export const respondToTutoringRequest = mutation({
  args: {
    sessionId: v.id("tutoringSessions"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
    meetingLink: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tutorId !== userId) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "pending") {
      throw new Error("Session is not pending");
    }

    await ctx.db.patch(args.sessionId, {
      status: args.response,
      meetingLink: args.meetingLink,
    });

    if (args.response === "accepted") {
      // Deduct tokens from student
      const studentProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", session.studentId))
        .unique();

      if (studentProfile) {
        await ctx.db.patch(studentProfile._id, {
          tokens: studentProfile.tokens - session.price,
        });

        // Create transaction record
        await ctx.db.insert("transactions", {
          userId: session.studentId,
          type: "tutoring_payment",
          amount: session.price,
          tokens: session.price,
          status: "completed",
          sessionId: args.sessionId,
          description: `Payment for tutoring session: ${session.subject}`,
        });
      }

      // Add earnings to tutor
      const tutorProfile = await ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .unique();

      if (tutorProfile) {
        await ctx.db.patch(tutorProfile._id, {
          totalEarnings: (tutorProfile.totalEarnings || 0) + session.price,
        });

        // Create earning record
        await ctx.db.insert("transactions", {
          userId: userId,
          type: "tutor_earning",
          amount: session.price,
          status: "completed",
          sessionId: args.sessionId,
          description: `Earnings from tutoring session: ${session.subject}`,
        });
      }
    }

    // Create notification for student
    await ctx.db.insert("notifications", {
      userId: session.studentId,
      title: `Tutoring Request ${args.response === "accepted" ? "Accepted" : "Rejected"}`,
      message: args.response === "accepted" 
        ? `Your tutoring request for ${session.subject} has been accepted!`
        : `Your tutoring request for ${session.subject} has been rejected.`,
      type: args.response === "accepted" ? "success" : "warning",
      read: false,
      actionUrl: `/student/sessions/${args.sessionId}`,
    });

    return true;
  },
});

export const getStudentSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const sessions = await ctx.db
      .query("tutoringSessions")
      .withIndex("by_student", (q) => q.eq("studentId", userId))
      .order("desc")
      .collect();

    // Get tutor info for each session
    const sessionsWithTutors = await Promise.all(
      sessions.map(async (session) => {
        const tutorProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", session.tutorId))
          .unique();
        
        return {
          ...session,
          tutor: tutorProfile,
        };
      })
    );

    return sessionsWithTutors;
  },
});

export const getTutorSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const sessions = await ctx.db
      .query("tutoringSessions")
      .withIndex("by_tutor", (q) => q.eq("tutorId", userId))
      .order("desc")
      .collect();

    // Get student info for each session
    const sessionsWithStudents = await Promise.all(
      sessions.map(async (session) => {
        const studentProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", session.studentId))
          .unique();
        
        return {
          ...session,
          student: studentProfile,
        };
      })
    );

    return sessionsWithStudents;
  },
});

export const completeSession = mutation({
  args: {
    sessionId: v.id("tutoringSessions"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.tutorId !== userId) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "accepted") {
      throw new Error("Session is not accepted");
    }

    await ctx.db.patch(args.sessionId, {
      status: "completed",
      notes: args.notes,
    });

    // Create notification for student
    await ctx.db.insert("notifications", {
      userId: session.studentId,
      title: "Session Completed",
      message: `Your tutoring session for ${session.subject} has been completed. Please rate your experience!`,
      type: "success",
      read: false,
      actionUrl: `/student/sessions/${args.sessionId}`,
    });

    return true;
  },
});

export const rateSession = mutation({
  args: {
    sessionId: v.id("tutoringSessions"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const session = await ctx.db.get(args.sessionId);
    if (!session || session.studentId !== userId) {
      throw new Error("Session not found or access denied");
    }

    if (session.status !== "completed") {
      throw new Error("Session is not completed");
    }

    await ctx.db.patch(args.sessionId, {
      rating: args.rating,
      review: args.review,
    });

    return true;
  },
});
