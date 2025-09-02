import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

export function NotesSection() {
  const [isUploading, setIsUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const notes = useQuery(api.notes.getUserNotes) || [];
  const uploadNote = useMutation(api.notes.uploadNote);
  const generateUploadUrl = useMutation(api.notes.generateUploadUrl);
  const deleteNote = useMutation(api.notes.deleteNote);

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    setIsUploading(true);
    try {
      let fileId = undefined;
      let fileType = undefined;
      let extractedContent = content;

      // Handle file upload if file is selected
      if (selectedFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": selectedFile.type },
          body: selectedFile,
        });

        if (!result.ok) {
          throw new Error("Failed to upload file");
        }

        const { storageId } = await result.json();
        fileId = storageId;
        fileType = selectedFile.type;

        // Extract text content from file if it's a text file
        if (selectedFile.type === "text/plain") {
          extractedContent = await selectedFile.text();
        }
      }

      await uploadNote({
        title: title.trim(),
        content: extractedContent || "No content provided",
        subject: subject.trim() || undefined,
        fileId,
        fileType,
      });

      toast.success("Note uploaded successfully! AI processing will begin shortly.");
      
      // Reset form
      setTitle("");
      setContent("");
      setSubject("");
      setSelectedFile(null);
      setShowUploadForm(false);
    } catch (error) {
      toast.error("Failed to upload note");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteNote = async (noteId: any) => {
    if (!confirm("Are you sure you want to delete this note? This will also delete all associated flashcards, quizzes, and summaries.")) {
      return;
    }

    try {
      await deleteNote({ noteId });
      toast.success("Note deleted successfully");
    } catch (error) {
      toast.error("Failed to delete note");
      console.error(error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "✅ Processed";
      case "processing":
        return "⏳ Processing";
      case "failed":
        return "❌ Failed";
      default:
        return "⏸️ Pending";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">My Study Notes</h2>
          <p className="text-gray-600">Upload your notes and let AI generate study materials</p>
        </div>
        <button
          onClick={() => setShowUploadForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Upload Note
        </button>
      </div>

      {/* Upload Form Modal */}
      {showUploadForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Upload Study Note</h3>
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Chapter 5: Photosynthesis"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Biology"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your notes here or upload a file below..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload File (Optional)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  accept=".txt,.pdf,.docx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: TXT, PDF, DOCX
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={isUploading}
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload Note"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notes List */}
      <div className="grid gap-4">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notes yet</h3>
            <p className="text-gray-600 mb-4">Upload your first study note to get started with AI-powered learning</p>
            <button
              onClick={() => setShowUploadForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Upload Your First Note
            </button>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{note.title}</h3>
                  {note.subject && (
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {note.subject}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(note.processingStatus)}`}>
                    {getStatusText(note.processingStatus)}
                  </span>
                  <button
                    onClick={() => handleDeleteNote(note._id)}
                    className="text-red-600 hover:text-red-800 p-1"
                    title="Delete note"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {note.content.substring(0, 200)}...
              </p>
              
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Uploaded {new Date(note._creationTime).toLocaleDateString()}</span>
                {note.processed && (
                  <span className="text-green-600 font-medium">
                    ✨ AI materials ready
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
