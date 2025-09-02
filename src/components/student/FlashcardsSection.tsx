import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function FlashcardsSection() {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());

  const notes = useQuery(api.notes.getUserNotes) || [];
  const processedNotes = notes.filter(note => note.processed);
  
  const flashcardsData = useQuery(
    api.notes.getFlashcards,
    selectedNoteId ? { noteId: selectedNoteId as any, page: currentPage } : "skip"
  );

  const handleCardFlip = (cardId: string) => {
    const newFlipped = new Set(flippedCards);
    if (newFlipped.has(cardId)) {
      newFlipped.delete(cardId);
    } else {
      newFlipped.add(cardId);
    }
    setFlippedCards(newFlipped);
  };

  const handleNoteSelect = (noteId: string) => {
    setSelectedNoteId(noteId);
    setCurrentPage(0);
    setFlippedCards(new Set());
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    setFlippedCards(new Set());
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Generated Flashcards</h2>
        <p className="text-gray-600">Study with flashcards generated from your notes</p>
      </div>

      {processedNotes.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🃏</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No flashcards available</h3>
          <p className="text-gray-600">Upload and process some notes first to generate flashcards</p>
        </div>
      ) : (
        <>
          {/* Note Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a note to study:
            </label>
            <select
              value={selectedNoteId || ""}
              onChange={(e) => handleNoteSelect(e.target.value)}
              className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a note...</option>
              {processedNotes.map((note) => (
                <option key={note._id} value={note._id}>
                  {note.title} {note.subject && `(${note.subject})`}
                </option>
              ))}
            </select>
          </div>

          {/* Flashcards */}
          {selectedNoteId && flashcardsData && (
            <div className="space-y-6">
              {/* Pagination Info */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Showing {flashcardsData.flashcards.length} of {flashcardsData.totalCount} flashcards
                  (Page {flashcardsData.currentPage + 1} of {flashcardsData.totalPages})
                </div>
                <div className="text-sm text-gray-500">
                  Click cards to flip them
                </div>
              </div>

              {/* Flashcards Grid */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {flashcardsData.flashcards.map((flashcard) => (
                  <div
                    key={flashcard._id}
                    onClick={() => handleCardFlip(flashcard._id)}
                    className="relative h-64 cursor-pointer group"
                  >
                    <div className={`absolute inset-0 w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
                      flippedCards.has(flashcard._id) ? "rotate-y-180" : ""
                    }`}>
                      {/* Front of card (Question) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden bg-white border-2 border-blue-200 rounded-lg p-6 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(flashcard.difficulty)}`}>
                            {flashcard.difficulty}
                          </span>
                          <span className="text-blue-600 text-sm font-medium">Question</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-gray-900 text-center font-medium">
                            {flashcard.question}
                          </p>
                        </div>
                        <div className="text-center text-sm text-gray-500">
                          Click to reveal answer
                        </div>
                      </div>

                      {/* Back of card (Answer) */}
                      <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-purple-200 rounded-lg p-6 flex flex-col justify-between shadow-lg">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(flashcard.difficulty)}`}>
                            {flashcard.difficulty}
                          </span>
                          <span className="text-purple-600 text-sm font-medium">Answer</span>
                        </div>
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-gray-900 text-center">
                            {flashcard.answer}
                          </p>
                        </div>
                        <div className="text-center text-sm text-gray-500">
                          Click to see question
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {flashcardsData.totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 0}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: flashcardsData.totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`px-3 py-2 border rounded-lg ${
                        i === currentPage
                          ? "bg-blue-600 text-white border-blue-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === flashcardsData.totalPages - 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
