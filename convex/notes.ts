import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

export const uploadNote = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    subject: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    fileType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const noteId = await ctx.db.insert("notes", {
      userId,
      title: args.title,
      content: args.content,
      subject: args.subject,
      fileId: args.fileId,
      fileType: args.fileType,
      processed: false,
      processingStatus: "pending",
    });

    // Schedule AI processing
    await ctx.scheduler.runAfter(0, internal.ai.processNote, { noteId });

    return noteId;
  },
});

export const getUserNotes = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const getNoteById = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    return note;
  },
});

export const deleteNote = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    // Delete associated flashcards, quizzes, and summaries
    const flashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
    
    for (const flashcard of flashcards) {
      await ctx.db.delete(flashcard._id);
    }

    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
    
    for (const quiz of quizzes) {
      await ctx.db.delete(quiz._id);
    }

    const summaries = await ctx.db
      .query("summaries")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
    
    for (const summary of summaries) {
      await ctx.db.delete(summary._id);
    }

    await ctx.db.delete(args.noteId);
    return true;
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFlashcards = query({
  args: { 
    noteId: v.id("notes"),
    page: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    const page = args.page || 0;
    const pageSize = 5;

    const allFlashcards = await ctx.db
      .query("flashcards")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();

    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const flashcards = allFlashcards.slice(startIndex, endIndex);

    return {
      flashcards,
      totalCount: allFlashcards.length,
      currentPage: page,
      totalPages: Math.ceil(allFlashcards.length / pageSize),
      hasMore: endIndex < allFlashcards.length,
    };
  },
});

export const getQuizzes = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    return await ctx.db
      .query("quizzes")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
  },
});

export const getSummaries = query({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const note = await ctx.db.get(args.noteId);
    if (!note || note.userId !== userId) {
      throw new Error("Note not found or access denied");
    }

    return await ctx.db
      .query("summaries")
      .withIndex("by_note", (q) => q.eq("noteId", args.noteId))
      .collect();
  },
});
