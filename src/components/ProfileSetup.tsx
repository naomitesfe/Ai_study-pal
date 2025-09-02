import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfileSetup() {
  const [role, setRole] = useState<"student" | "tutor" | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState<string[]>([]);
  const [hourlyRate, setHourlyRate] = useState("");
  const [expertiseInput, setExpertiseInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const createProfile = useMutation(api.profiles.createProfile);

  const handleAddExpertise = () => {
    if (expertiseInput.trim() && !expertise.includes(expertiseInput.trim())) {
      setExpertise([...expertise, expertiseInput.trim()]);
      setExpertiseInput("");
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter(e => e !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role || !firstName || !lastName) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (role === "tutor" && (!bio || expertise.length === 0 || !hourlyRate)) {
      toast.error("Please complete all tutor fields");
      return;
    }

    setIsLoading(true);
    try {
      await createProfile({
        role,
        firstName,
        lastName,
        bio: bio || undefined,
        expertise: expertise.length > 0 ? expertise : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      });
      toast.success("Profile created successfully!");
    } catch (error) {
      toast.error("Failed to create profile");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-8">
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
            <p className="text-gray-600">Tell us about yourself to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "student"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">🎓</div>
                    <div className="font-semibold">Student</div>
                    <div className="text-sm text-gray-500">Learn with AI tools</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setRole("tutor")}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    role === "tutor"
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-2">👨‍🏫</div>
                    <div className="font-semibold">Tutor</div>
                    <div className="text-sm text-gray-500">Teach and earn</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Tutor-specific fields */}
            {role === "tutor" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio *
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Tell students about your teaching experience and approach..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Areas of Expertise *
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={expertiseInput}
                      onChange={(e) => setExpertiseInput(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddExpertise())}
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., Mathematics, Physics, Chemistry"
                    />
                    <button
                      type="button"
                      onClick={handleAddExpertise}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {expertise.map((item) => (
                      <span
                        key={item}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800"
                      >
                        {item}
                        <button
                          type="button"
                          onClick={() => handleRemoveExpertise(item)}
                          className="ml-2 text-purple-600 hover:text-purple-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hourly Rate (in tokens) *
                  </label>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    min="1"
                    step="0.1"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., 10"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Set your hourly rate in tokens. Students will pay this amount per hour.
                  </p>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading || !role}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isLoading ? "Creating Profile..." : "Complete Setup"}
            </button>
          </form>

          {role === "tutor" && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Tutor accounts require admin approval before you can start receiving tutoring requests.
                You'll be notified once your application is reviewed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
