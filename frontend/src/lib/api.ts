const API_BASE = "http://127.0.0.1:5000"; // Or import.meta.env.VITE_API_BASE

// Helper function to handle auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("eduToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Helper function to handle common fetch logic
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
};

// --- Study Materials ---
export async function fetchStudyMaterials() {
  return apiFetch(`${API_BASE}/api/material/`);
}

// --- Progress ---
export const updateProgress = async (
  userEmail: string,
  materialId: string,
  status: "To Learn" | "In Progress" | "Completed"
) => {
  return apiFetch(`${API_BASE}/api/progress/update`, {
    method: "POST",
    body: JSON.stringify({
      user_email: userEmail,
      material_id: materialId,
      status,
    }),
  });
};

export const getUserProgress = async (userEmail: string) => {
  return apiFetch(
    `${API_BASE}/api/progress/${encodeURIComponent(userEmail)}`
  );
};

export const getProgressSummary = async (userEmail: string) => {
  return apiFetch(
    `${API_BASE}/api/progress/summary/${encodeURIComponent(userEmail)}`
  );
};

export const getRecentMaterials = async (userEmail: string) => {
  return apiFetch(
    `${API_BASE}/api/progress/recent/${encodeURIComponent(userEmail)}`
  );
};

export const getProgressStats = async (userEmail: string) => {
  return apiFetch(
    `${API_BASE}/api/progress/stats/${encodeURIComponent(userEmail)}`
  );
};

// --- Quiz ---
export async function fetchQuizQuestions(topic: string) {
  return apiFetch(
    `${API_BASE}/api/quiz/questions/${encodeURIComponent(topic)}`
  );
}

export async function submitQuiz(
  userEmail: string,
  topic: string,
  answers: { id: number; selected: string }[]
) {
  return apiFetch(`${API_BASE}/api/quiz/submit`, {
    method: "POST",
    body: JSON.stringify({ user_email: userEmail, topic, answers }),
  });
}

// --- Recommendation ---
export async function fetchRecommendations(query: string) {
  const data = await apiFetch(`${API_BASE}/api/recommend/`, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
  return data.recommendations;
}

// --- YouTube Search ---
export async function searchYouTube(topic: string) {
  return apiFetch(
    `${API_BASE}/api/youtube/search?topic=${encodeURIComponent(topic)}`
  );
}

// Default export object
export default {
  fetchStudyMaterials,
  updateProgress,
  getUserProgress,
  getProgressSummary,
  getRecentMaterials,
  getProgressStats,
  fetchQuizQuestions,
  submitQuiz,
  fetchRecommendations,
  searchYouTube,
};