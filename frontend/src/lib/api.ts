const API_BASE = "http://127.0.0.1:5000"; // Or use import.meta.env.VITE_API_BASE

// Get Authorization header
const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    console.warn("No access token found in localStorage.");
  }
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Core fetch wrapper
const apiFetch = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: "include", // ensures cookies (if any) are sent
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  return response.json();
};

// --- Auth ---
export const login = async (email: string, password: string) => {
  const response = await apiFetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (response.accessToken) {
    localStorage.setItem("eduToken", response.accessToken);
  }
  return response;
};

export const refreshToken = async (refreshToken: string) => {
  const response = await apiFetch(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
  if (response.accessToken) {
    localStorage.setItem("eduToken", response.accessToken);
  }
  return response;
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
  const encodedEmail = encodeURIComponent(userEmail);
  return apiFetch(`${API_BASE}/api/progress/stats/${encodedEmail}`);
};

// --- Students (for teacher/admin) ---
export const getStudents = async (
  page: number,
  perPage: number,
  searchQuery: string
) => {
  const params = new URLSearchParams();
  params.append("page", String(page));
  params.append("per_page", String(perPage));
  if (searchQuery) {
    params.append("search", searchQuery);
  }

  return apiFetch(`${API_BASE}/api/auth/students?${params.toString()}`);
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

// --- Export all ---
export default {
  fetchStudyMaterials,
  updateProgress,
  getUserProgress,
  getProgressSummary,
  getRecentMaterials,
  getProgressStats,
  getStudents,
  fetchQuizQuestions,
  submitQuiz,
  fetchRecommendations,
  searchYouTube,
  login,
  refreshToken,
};
