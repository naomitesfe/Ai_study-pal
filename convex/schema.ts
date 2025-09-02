import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  // User profiles with role-based data
  profiles: defineTable({
    userId: v.id("users"),
    role: v.union(v.literal("student"), v.literal("tutor"), v.literal("admin")),
    firstName: v.string(),
    lastName: v.string(),
    bio: v.optional(v.string()),
    expertise: v.optional(v.array(v.string())), // For tutors
    hourlyRate: v.optional(v.number()), // For tutors
    tokens: v.number(), // Token balance
    totalEarnings: v.optional(v.number()), // For tutors
    isApproved: v.optional(v.boolean()), // For tutor approval
    profileImage: v.optional(v.id("_storage")),
  })
    .index("by_user", ["userId"])
    .index("by_role", ["role"])
    .index("by_tutor_approved", ["role", "isApproved"]),

  // Study notes uploaded by students
  notes: defineTable({
    userId: v.id("users"),
    title: v.string(),
    content: v.string(),
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
    subject: v.optional(v.string()),
    processed: v.boolean(),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  })
    .index("by_user", ["userId"])
    .index("by_processed", ["processed"])
    .index("by_status", ["processingStatus"]),

  // AI-generated flashcards
  flashcards: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    subject: v.optional(v.string()),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"])
    .index("by_difficulty", ["difficulty"]),

  // AI-generated quizzes
  quizzes: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    title: v.string(),
    questions: v.array(v.object({
      question: v.string(),
      options: v.array(v.string()),
      correctAnswer: v.number(),
      explanation: v.string(),
    })),
    subject: v.optional(v.string()),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"]),

  // AI-generated summaries
  summaries: defineTable({
    noteId: v.id("notes"),
    userId: v.id("users"),
    content: v.string(),
    keyPoints: v.array(v.string()),
    subject: v.optional(v.string()),
  })
    .index("by_note", ["noteId"])
    .index("by_user", ["userId"]),

  // Tutoring sessions
  tutoringSessions: defineTable({
    studentId: v.id("users"),
    tutorId: v.id("users"),
    subject: v.string(),
    description: v.string(),
    scheduledTime: v.number(),
    duration: v.number(), // in minutes
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
    price: v.number(),
    meetingLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  })
    .index("by_student", ["studentId"])
    .index("by_tutor", ["tutorId"])
    .index("by_status", ["status"])
    .index("by_scheduled_time", ["scheduledTime"]),

  // Payment transactions
  transactions: defineTable({
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
  })
    .index("by_user", ["userId"])
    .index("by_type", ["type"])
    .index("by_status", ["status"]),

  // Chat messages for tutoring sessions
  messages: defineTable({
    sessionId: v.id("tutoringSessions"),
    senderId: v.id("users"),
    content: v.string(),
    type: v.union(v.literal("text"), v.literal("file"), v.literal("system")),
    fileId: v.optional(v.id("_storage")),
  })
    .index("by_session", ["sessionId"])
    .index("by_sender", ["senderId"]),

  // Learning materials created by tutors
  learningMaterials: defineTable({
    tutorId: v.id("users"),
    title: v.string(),
    description: v.string(),
    subject: v.string(),
    content: v.string(),
    fileId: v.optional(v.id("_storage")),
    price: v.number(), // in tokens
    downloads: v.number(),
    rating: v.number(),
    reviews: v.array(v.object({
      userId: v.id("users"),
      rating: v.number(),
      comment: v.string(),
      createdAt: v.number(),
    })),
  })
    .index("by_tutor", ["tutorId"])
    .index("by_subject", ["subject"])
    .index("by_rating", ["rating"]),

  // System notifications
  notifications: defineTable({
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
    read: v.boolean(),
    actionUrl: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_read", ["read"]),

  // Study sessions for analytics
  studySessions: defineTable({
    userId: v.id("users"),
    type: v.union(v.literal("flashcards"), v.literal("quiz"), v.literal("notes")),
    noteId: v.optional(v.id("notes")),
    duration: v.number(), // in minutes
    score: v.optional(v.number()), // for quizzes
    date: v.string(), // YYYY-MM-DD format
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_user_date", ["userId", "date"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
