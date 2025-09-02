import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function TutorDashboard() {
  const [activeTab, setActiveTab] = useState("sessions");
  const profile = useQuery(api.profiles.getProfile);

  const tabs = [
    { id: "sessions", label: "My Sessions", icon: "📅" },
    { id: "profile", label: "Profile", icon: "👤" },
  ];

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
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
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            <span>Tutor Account</span>
          </div>
          {profile.isApproved ? (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Approved</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              <span>Pending Approval</span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span>💰</span>
            <span>{profile.totalEarnings || 0} tokens earned</span>
          </div>
        </div>
      </div>

      {!profile.isApproved && (
        <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">Account Pending Approval</h3>
          <p className="text-yellow-700 text-sm">
            Your tutor application is currently under review. You'll be notified once it's approved and you can start receiving tutoring requests.
          </p>
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
                  ? "border-purple-500 text-purple-600"
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
        {activeTab === "sessions" && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tutoring Sessions</h3>
            <p className="text-gray-600">Your tutoring sessions will appear here once you're approved</p>
          </div>
        )}
        {activeTab === "profile" && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tutor Profile</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                <p className="text-gray-900">{profile.firstName} {profile.lastName}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Hourly Rate</label>
                <p className="text-gray-900">{profile.hourlyRate} tokens/hour</p>
              </div>
            </div>
            {profile.bio && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-1">Bio</label>
                <p className="text-gray-900">{profile.bio}</p>
              </div>
            )}
            {profile.expertise && profile.expertise.length > 0 && (
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-500 mb-2">Expertise</label>
                <div className="flex flex-wrap gap-2">
                  {profile.expertise.map((skill) => (
                    <span key={skill} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
