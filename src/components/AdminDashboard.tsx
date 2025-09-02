import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const profile = useQuery(api.profiles.getProfile);

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "sessions", label: "Sessions", icon: "📅" },
  ];

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Dashboard
        </h1>
        <div className="flex items-center space-x-6 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span>Administrator</span>
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
                  ? "border-red-500 text-red-600"
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
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">👥</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Users</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">🎓</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Students</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">👨‍🏫</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tutors</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">📅</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Sessions</p>
                  <p className="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === "users" && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">User Management</h3>
            <p className="text-gray-600">User management features will be available here</p>
          </div>
        )}
        
        {activeTab === "sessions" && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Session Management</h3>
            <p className="text-gray-600">Session management features will be available here</p>
          </div>
        )}
      </div>
    </div>
  );
}
