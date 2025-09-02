import { v } from "convex/values";
import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

export const processNote = internalAction({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    try {
      // Update status to processing
      await ctx.runMutation(internal.ai.updateNoteStatus, {
        noteId: args.noteId,
        status: "processing",
      });

      // Get note content
      const note = await ctx.runQuery(internal.ai.getNoteForProcessing, {
        noteId: args.noteId,
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Use the bundled OpenAI API
      const openaiResponse = await fetch(`${process.env.CONVEX_OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CONVEX_OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-nano",
          messages: [
            {
              role: "system",
              content: `You are an AI study assistant. Given study notes, generate:
1. Flashcards (question/answer pairs)
2. A quiz with multiple choice questions
3. A summary with key points

Format your response as JSON with this structure:
{
  "flashcards": [{"question": "...", "answer": "...", "difficulty": "easy|medium|hard"}],
  "quiz": {
    "title": "...",
    "questions": [{"question": "...", "options": ["A", "B", "C", "D"], "correctAnswer": 0, "explanation": "..."}]
  },
  "summary": {
    "content": "...",
    "keyPoints": ["point1", "point2", ...]
  }
}`
            },
            {
              role: "user",
              content: `Please process these study notes and generate flashcards, quiz, and summary:\n\nTitle: ${note.title}\nSubject: ${note.subject || "General"}\n\nContent:\n${note.content}`
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
      }

      const openaiData = await openaiResponse.json();
      const aiContent = openaiData.choices[0].message.content;

      // Parse AI response
      let aiResult;
      try {
        aiResult = JSON.parse(aiContent);
      } catch (e) {
        throw new Error("Failed to parse AI response");
      }

      // Save flashcards
      if (aiResult.flashcards && Array.isArray(aiResult.flashcards)) {
        for (const flashcard of aiResult.flashcards) {
          await ctx.runMutation(internal.ai.createFlashcard, {
            noteId: args.noteId,
            userId: note.userId,
            question: flashcard.question,
            answer: flashcard.answer,
            difficulty: flashcard.difficulty || "medium",
            subject: note.subject,
          });
        }
      }

      // Save quiz
      if (aiResult.quiz && aiResult.quiz.questions) {
        await ctx.runMutation(internal.ai.createQuiz, {
          noteId: args.noteId,
          userId: note.userId,
          title: aiResult.quiz.title || `${note.title} Quiz`,
          questions: aiResult.quiz.questions,
          subject: note.subject,
        });
      }

      // Save summary
      if (aiResult.summary) {
        await ctx.runMutation(internal.ai.createSummary, {
          noteId: args.noteId,
          userId: note.userId,
          content: aiResult.summary.content,
          keyPoints: aiResult.summary.keyPoints || [],
          subject: note.subject,
        });
      }

      // Update status to completed
      await ctx.runMutation(internal.ai.updateNoteStatus, {
        noteId: args.noteId,
        status: "completed",
      });

      // Create notification
      await ctx.runMutation(internal.ai.createNotification, {
        userId: note.userId,
        title: "Note Processing Complete",
        message: `Your note "${note.title}" has been processed successfully! Flashcards, quiz, and summary are now available.`,
        type: "success",
      });

    } catch (error) {
      console.error("Error processing note:", error);
      
      // Update status to failed
      await ctx.runMutation(internal.ai.updateNoteStatus, {
        noteId: args.noteId,
        status: "failed",
      });

      // Create error notification
      const note = await ctx.runQuery(internal.ai.getNoteForProcessing, {
        noteId: args.noteId,
      });

      if (note) {
        await ctx.runMutation(internal.ai.createNotification, {
          userId: note.userId,
          title: "Note Processing Failed",
          message: `Failed to process your note "${note.title}". Please try uploading again.`,
          type: "error",
        });
      }
    }
  },
});

export const getNoteForProcessing = internalQuery({
  args: { noteId: v.id("notes") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.noteId);
  },
});

export const updateNoteStatus = internalMutation({
  args: {
    noteId: v.id("notes"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.noteId, {
      processingStatus: args.status,
      processed: args.status === "completed",
    });
  },
});

export const createFlashcard = internalMutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
    question: v.string(),
    answer: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("flashcards", args);
  },
});

export const createQuiz = internalMutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("quizzes", args);
  },
});

export const createSummary = internalMutation({
  args: {
    noteId: v.id("notes"),
    userId: v.id("users"),
    content: v.string(),
    keyPoints: v.array(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("summaries", args);
  },
});

export const createNotification = internalMutation({
  args: {
    userId: v.id("users"),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("error")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      ...args,
      read: false,
    });
  },
});
