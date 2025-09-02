import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { PaymentModal } from "./PaymentModal";

export function ProfileSection() {
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const profile = useQuery(api.profiles.getProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const transactions = useQuery(api.payments.getUserTransactions) || [];

  const handleEdit = () => {
    if (profile) {
      setFirstName(profile.firstName);
      setLastName(profile.lastName);
      setBio(profile.bio || "");
      setIsEditing(true);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim() || undefined,
      });
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error(error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFirstName("");
    setLastName("");
    setBio("");
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
          <p className="text-gray-600">Manage your account information</p>
        </div>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">First Name</label>
                  <p className="text-gray-900">{profile.firstName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Last Name</label>
                  <p className="text-gray-900">{profile.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Role</label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {profile.role}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Token Balance</label>
                  <p className="text-gray-900 font-semibold">{profile.tokens} tokens</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">About Me</h3>
                <p className="text-gray-700">{profile.bio}</p>
              </div>
            )}

            {/* Account Stats */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{profile.tokens}</div>
                  <div className="text-sm text-blue-600">Available Tokens</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {new Date(profile._creationTime).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-green-600">Member Since</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">Student</div>
                  <div className="text-sm text-purple-600">Account Type</div>
                </div>
              </div>
            </div>

            {/* Token Purchase Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2">💰 Need More Tokens?</h4>
              <p className="text-yellow-700 text-sm mb-3">
                Tokens are used to pay for tutoring sessions and premium AI features. 
                You started with 10 free tokens!
              </p>
              <button 
                onClick={() => setShowPaymentModal(true)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Purchase Tokens
              </button>
            </div>
          </div>
        )}
      </div>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)} 
      />
    </div>
  );
}
