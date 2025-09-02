import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { EnhancedStudentDashboard } from "./components/student/EnhancedStudentDashboard";
import { TutorDashboard } from "./components/TutorDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProfileSetup } from "./components/ProfileSetup";
import { NotificationBell } from "./components/NotificationBell";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm h-16 flex justify-between items-center border-b shadow-sm px-4">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AI</span>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            StudyPartner
          </h2>
        </div>
        <div className="flex items-center space-x-4">
          <Authenticated>
            <NotificationBell />
            <SignOutButton />
          </Authenticated>
        </div>
      </header>
      <main className="flex-1">
        <Content />
      </main>
      <Toaster position="top-right" />
    </div>
  );
}

function Content() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[80vh] p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
                Welcome to AI StudyPartner
              </h1>
              <p className="text-lg text-gray-600">
                Transform your learning with AI-powered study tools and expert tutoring
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        {!loggedInUser?.profile ? (
          <ProfileSetup />
        ) : (
          <DashboardRouter profile={loggedInUser.profile} />
        )}
      </Authenticated>
    </div>
  );
}

function DashboardRouter({ profile }: { profile: any }) {
  switch (profile.role) {
    case "student":
      return <EnhancedStudentDashboard />;
    case "tutor":
      return <TutorDashboard />;
    case "admin":
      return <AdminDashboard />;
    default:
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Role</h2>
            <p className="text-gray-600">Please contact support for assistance.</p>
          </div>
        </div>
      );
  }
}
