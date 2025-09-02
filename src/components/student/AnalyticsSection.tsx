import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export function AnalyticsSection() {
  const analytics = useQuery(api.analytics.getStudyAnalytics, { days: 30 });
  const focusStats = useQuery(api.analytics.getFocusStats);

  if (!analytics || !focusStats) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const { dailyStats, summary } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Study Analytics</h2>
        <p className="text-gray-600">Track your learning progress and study habits</p>
      </div>

      {/* Today's Focus */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Focus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">{focusStats.minutesToday}</div>
            <div className="text-sm text-gray-600">Minutes Studied</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">{focusStats.sessionsToday}</div>
            <div className="text-sm text-gray-600">Study Sessions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{Math.round(focusStats.progress)}%</div>
            <div className="text-sm text-gray-600">Daily Goal</div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Daily Goal Progress</span>
            <span>{focusStats.minutesToday}/{focusStats.goal} minutes</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(focusStats.progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-sm">⏱️</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Study Time</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalMinutes}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-sm">📚</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Study Sessions</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 text-sm">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Session</p>
              <p className="text-2xl font-semibold text-gray-900">{Math.round(summary.averageSessionLength)}m</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <span className="text-orange-600 text-sm">🔥</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Study Streak</p>
              <p className="text-2xl font-semibold text-gray-900">{summary.streak} days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {dailyStats.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Study Time Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Study Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: number) => [`${value} minutes`, 'Study Time']}
                />
                <Line 
                  type="monotone" 
                  dataKey="totalMinutes" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Activity Distribution */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Study Activity Types</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Bar dataKey="flashcardSessions" stackId="a" fill="#3B82F6" name="Flashcards" />
                <Bar dataKey="quizSessions" stackId="a" fill="#8B5CF6" name="Quizzes" />
                <Bar dataKey="notesSessions" stackId="a" fill="#10B981" name="Notes" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {dailyStats.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No study data yet</h3>
          <p className="text-gray-600">Start studying to see your analytics and progress</p>
        </div>
      )}
    </div>
  );
}
