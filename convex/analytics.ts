import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const trackStudySession = mutation({
  args: {
    type: v.union(v.literal("flashcards"), v.literal("quiz"), v.literal("notes")),
    noteId: v.optional(v.id("notes")),
    duration: v.number(), // in minutes
    score: v.optional(v.number()), // for quizzes
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.db.insert("studySessions", {
      userId,
      type: args.type,
      noteId: args.noteId,
      duration: args.duration,
      score: args.score,
      date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    });
  },
});

export const getStudyAnalytics = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const days = args.days || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const sessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.gte(q.field("date"), startDateStr))
      .collect();

    // Group by date
    const dailyStats = sessions.reduce((acc, session) => {
      const date = session.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          totalMinutes: 0,
          flashcardSessions: 0,
          quizSessions: 0,
          notesSessions: 0,
          averageScore: 0,
          scores: [],
        };
      }
      
      acc[date].totalMinutes += session.duration;
      acc[date][`${session.type}Sessions`]++;
      
      if (session.score !== undefined) {
        acc[date].scores.push(session.score);
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Calculate average scores
    Object.values(dailyStats).forEach((day: any) => {
      if (day.scores.length > 0) {
        day.averageScore = day.scores.reduce((a: number, b: number) => a + b, 0) / day.scores.length;
      }
    });

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;
    const averageSessionLength = totalSessions > 0 ? totalMinutes / totalSessions : 0;

    return {
      dailyStats: Object.values(dailyStats),
      summary: {
        totalMinutes,
        totalSessions,
        averageSessionLength,
        streak: calculateStreak(Object.keys(dailyStats).sort()),
      },
    };
  },
});

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  
  const today = new Date().toISOString().split('T')[0];
  const sortedDates = dates.sort().reverse();
  
  let streak = 0;
  let currentDate = new Date(today);
  
  for (const dateStr of sortedDates) {
    const date = new Date(dateStr);
    const diffTime = currentDate.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) {
      streak++;
      currentDate = date;
    } else {
      break;
    }
  }
  
  return streak;
}

export const getFocusStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const todaySessions = await ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("date"), today))
      .collect();

    const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
    const sessionsToday = todaySessions.length;

    return {
      minutesToday: totalMinutesToday,
      sessionsToday,
      goal: 60, // 60 minutes daily goal
      progress: Math.min((totalMinutesToday / 60) * 100, 100),
    };
  },
});
