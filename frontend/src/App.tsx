import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { AppLayout } from "./components/layout/AppLayout";

import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Unauthorized from "./components/shared/Unauthorized";

import StudentDashboard from "./pages/student/Dashboard";
import ProgressPage from "./pages/student/Progress";
import Quizzes from "./pages/student/Quizzes";
import QuizPage from "./pages/student/QuizPage";

import TeacherDashboard from "./pages/teacher/Dashboard";
import MaterialUpload from "./pages/teacher/MaterialUpload";
import Students from "./pages/teacher/Students";

import AdminDashboard from "./pages/admin/Dashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";

import Materials from "./pages/shared/Materials";
import Profile from "./pages/shared/Profile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shared App Layout - default */}
            {/* Shared App Layout - default (for authenticated users) */}
<Route path="/" element={<AppLayout />}>
  <Route index element={<RoleBasedDashboard />} /> {/* Auto-redirect based on role */}
  <Route path="materials" element={<Materials />} />
  <Route path="profile" element={<Profile />} />
</Route>

            {/* Student routes */}
            <Route path="/dashboard" element={<AppLayout requiredRole="student" />}>
              <Route index element={<StudentDashboard />} />
            </Route>
            <Route path="/quizzes" element={<AppLayout requiredRole="student" />}>
              <Route index element={<Quizzes />} />
              <Route path=":topic" element={<QuizPage />} />
            </Route>
            <Route path="/progress" element={<AppLayout requiredRole="student" />}>
              <Route index element={<ProgressPage />} />
            </Route>

            {/* Teacher routes */}
{/* Teacher routes */}
{/* Teacher routes */}
<Route path="/teacher/dashboard" element={<AppLayout requiredRole="teacher" />}>
  <Route index element={<TeacherDashboard />} />
</Route>
<Route path="/upload" element={<AppLayout requiredRole="teacher" />}>
  <Route index element={<MaterialUpload />} />
</Route>
<Route path="/students" element={<AppLayout requiredRole="teacher" />}>
  <Route index element={<Students />} />
</Route>




            {/* Admin routes */}
            <Route path="/admin" element={<AppLayout requiredRole="admin" />}>
              <Route index element={<AdminDashboard />} />
            </Route>
            <Route path="/users" element={<AppLayout requiredRole="admin" />}>
              <Route index element={<UsersManagement />} />
            </Route>
            <Route path="/analytics" element={<AppLayout requiredRole="admin" />}>
              <Route index element={<Analytics />} />
            </Route>
            <Route path="/settings" element={<AppLayout requiredRole="admin" />}>
              <Route index element={<Settings />} />
            </Route>

            {/* Error/utility routes */}
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="*" element={<NotFound />} />

          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

// Role-based redirect component
const RoleBasedDashboard = () => {
  const role = localStorage.getItem("eduUser")
    ? JSON.parse(localStorage.getItem("eduUser")!).role
    : "student";

  switch (role) {
    case "teacher":
      return <TeacherDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "student":
    default:
      return <StudentDashboard />;
  }
};
