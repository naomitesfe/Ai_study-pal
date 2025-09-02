import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { NotesSection } from "./NotesSection";
import { FlashcardsSection } from "./FlashcardsSection";
import { TutoringSection } from "./TutoringSection";
import { ProfileSection } from "./ProfileSection";
import { AnalyticsSection } from "./AnalyticsSection";
import { PaymentModal } from "./PaymentModal";
import { FocusMode } from "./FocusMode";

export function EnhancedStudentDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [focusModeActive, setFocusModeActive] = useState(false);
  
  const profile = useQuery(api.profiles.getProfile);
  const focusStats = useQuery(api.analytics.getFocusStats);

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "🏠" },
    { id: "notes", label: "My Notes", icon: "📝" },
    { id: "flashcards", label: "Flashcards", icon: "🃏" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "tutoring", label: "Tutoring", icon: "👨‍🏫" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Welcome back, {profile.firstName}!
              </h1>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>Student Account</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>{profile.tokens} tokens available</span>
                </div>
                {focusStats && (
                  <div className="flex items-center space-x-2">
                    <span>🎯</span>
                    <span>{focusStats.minutesToday}min studied today</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setFocusModeActive(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <span>🎯</span>
                <span>Focus Mode</span>
              </button>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <span>💳</span>
                <span>Buy Tokens</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Dashboard */}
        {activeTab === "dashboard" && (
          <div className="mb-8 space-y-6">
            {/* Today's Progress */}
            {focusStats && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Progress</h3>
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
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab("notes")}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">📝</div>
                <h3 className="font-semibold text-gray-900">Upload Notes</h3>
                <p className="text-sm text-gray-600">Add new study materials</p>
              </button>
              
              <button
                onClick={() => setActiveTab("flashcards")}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">🃏</div>
                <h3 className="font-semibold text-gray-900">Study Flashcards</h3>
                <p className="text-sm text-gray-600">Review with AI flashcards</p>
              </button>
              
              <button
                onClick={() => setFocusModeActive(true)}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-gray-900">Focus Session</h3>
                <p className="text-sm text-gray-600">25-minute study timer</p>
              </button>
              
              <button
                onClick={() => setActiveTab("tutoring")}
                className="p-6 bg-white rounded-lg border border-gray-200 hover:shadow-md transition-shadow text-left"
              >
                <div className="text-3xl mb-2">👨‍🏫</div>
                <h3 className="font-semibold text-gray-900">Find Tutor</h3>
                <p className="text-sm text-gray-600">Book tutoring sessions</p>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="min-h-[60vh]">
          {activeTab === "notes" && <NotesSection />}
          {activeTab === "flashcards" && <FlashcardsSection />}
          {activeTab === "analytics" && <AnalyticsSection />}
          {activeTab === "tutoring" && <TutoringSection />}
          {activeTab === "profile" && <ProfileSection />}
        </div>
      </div>

      {/* Modals */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
      
      <FocusMode 
        isActive={focusModeActive}
        onToggle={() => setFocusModeActive(!focusModeActive)}
      />
    </>
  );
}
