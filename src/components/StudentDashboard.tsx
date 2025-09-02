import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { NotesSection } from "./student/NotesSection";
import { FlashcardsSection } from "./student/FlashcardsSection";
import { TutoringSection } from "./student/TutoringSection";
import { ProfileSection } from "./student/ProfileSection";

export function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("notes");
  const profile = useQuery(api.profiles.getProfile);

  const tabs = [
    { id: "notes", label: "My Notes", icon: "📝" },
    { id: "flashcards", label: "Flashcards", icon: "🃏" },
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
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
        </div>
      </div>

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
        {activeTab === "tutoring" && <TutoringSection />}
        {activeTab === "profile" && <ProfileSection />}
      </div>
    </div>
  );
}
