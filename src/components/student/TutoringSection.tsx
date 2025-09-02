import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

export function TutoringSection() {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [duration, setDuration] = useState("60");

  const tutors = useQuery(api.profiles.getTutors, {}) || [];
  const sessions = useQuery(api.tutoring.getStudentSessions) || [];
  const requestSession = useMutation(api.tutoring.requestTutoringSession);
  const rateSession = useMutation(api.tutoring.rateSession);

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTutor || !subject || !description || !scheduledDate || !scheduledTime) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}`).getTime();
      
      await requestSession({
        tutorId: selectedTutor.userId,
        subject,
        description,
        scheduledTime: scheduledDateTime,
        duration: parseInt(duration),
      });

      toast.success("Tutoring session requested successfully!");
      setShowBookingForm(false);
      setSelectedTutor(null);
      setSubject("");
      setDescription("");
      setScheduledDate("");
      setScheduledTime("");
      setDuration("60");
    } catch (error: any) {
      toast.error(error.message || "Failed to request session");
    }
  };

  const handleRateSession = async (sessionId: any, rating: number, review?: string) => {
    try {
      await rateSession({ sessionId, rating, review });
      toast.success("Session rated successfully!");
    } catch (error) {
      toast.error("Failed to rate session");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "accepted":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tutoring Sessions</h2>
          <p className="text-gray-600">Book sessions with expert tutors</p>
        </div>
        <button
          onClick={() => setShowBookingForm(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Book Session
        </button>
      </div>

      {/* Booking Form Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Book Tutoring Session</h3>
            
            {!selectedTutor ? (
              <div className="space-y-4">
                <h4 className="font-medium">Select a Tutor:</h4>
                <div className="grid gap-4">
                  {tutors.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No approved tutors available</p>
                  ) : (
                    tutors.map((tutor) => (
                      <div
                        key={tutor._id}
                        onClick={() => setSelectedTutor(tutor)}
                        className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h5 className="font-semibold">{tutor.firstName} {tutor.lastName}</h5>
                            <p className="text-sm text-gray-600 mb-2">{tutor.bio}</p>
                            <div className="flex flex-wrap gap-1">
                              {tutor.expertise?.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-purple-600">{tutor.hourlyRate} tokens/hr</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <form onSubmit={handleBookSession} className="space-y-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold">Selected Tutor: {selectedTutor.firstName} {selectedTutor.lastName}</h4>
                  <p className="text-sm text-gray-600">Rate: {selectedTutor.hourlyRate} tokens/hour</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="e.g., Mathematics, Physics"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe what you need help with..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                    <option value="120">2 hours</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Total Cost:</strong> {((selectedTutor.hourlyRate || 0) * (parseInt(duration) / 60)).toFixed(1)} tokens
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Request Session
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTutor(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowBookingForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Sessions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">My Sessions</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👨‍🏫</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600">Book your first tutoring session to get started</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session._id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{session.subject}</h4>
                  <p className="text-gray-600">with {session.tutor?.firstName} {session.tutor?.lastName}</p>
                </div>
                <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(session.status)}`}>
                  {session.status}
                </span>
              </div>
              
              <p className="text-gray-700 mb-4">{session.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                <div>
                  <strong>Date:</strong> {new Date(session.scheduledTime).toLocaleDateString()}
                </div>
                <div>
                  <strong>Time:</strong> {new Date(session.scheduledTime).toLocaleTimeString()}
                </div>
                <div>
                  <strong>Duration:</strong> {session.duration} minutes
                </div>
                <div>
                  <strong>Cost:</strong> {session.price} tokens
                </div>
              </div>

              {session.meetingLink && session.status === "accepted" && (
                <div className="mb-4">
                  <a
                    href={session.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Join Meeting
                  </a>
                </div>
              )}

              {session.status === "completed" && !session.rating && (
                <div className="border-t pt-4">
                  <h5 className="font-medium mb-2">Rate this session:</h5>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => handleRateSession(session._id, rating)}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {session.rating && (
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Your rating:</span>
                    <div className="flex">
                      {Array.from({ length: session.rating }, (_, i) => (
                        <span key={i} className="text-yellow-400">⭐</span>
                      ))}
                    </div>
                  </div>
                  {session.review && (
                    <p className="text-sm text-gray-600 mt-2">"{session.review}"</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
