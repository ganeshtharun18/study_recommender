
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
import StudentDashboard from "./pages/student/Dashboard";
import TeacherDashboard from "./pages/teacher/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import MaterialUpload from "./pages/teacher/MaterialUpload";
import Materials from "./pages/shared/Materials";
import Profile from "./pages/shared/Profile";
import Quizzes from "./pages/student/Quizzes";
import ProgressPage from "./pages/student/Progress";
import Unauthorized from "./components/shared/Unauthorized";
import Students from "./pages/teacher/Students";
import UsersManagement from "./pages/admin/UsersManagement";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import QuizPage from "./pages/student/QuizPage"; // New import

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

            {/* Role-specific dashboards */}
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Login />} />
            </Route>

            {/* Student-specific routes */}
            <Route path="/dashboard" element={<AppLayout requiredRole="student" />}>
              <Route index element={<StudentDashboard />} />
            </Route>

            <Route path="/quizzes" element={<AppLayout requiredRole="student" />}>
              <Route index element={<Quizzes />} />
               <Route path=":topic" element={<QuizPage />} /> {/* New route */}
            </Route>

            <Route path="/progress" element={<AppLayout requiredRole="student" />}>
              <Route index element={<ProgressPage />} />
            </Route>

            {/* Teacher-specific routes */}
            <Route path="/upload" element={<AppLayout requiredRole="teacher" />}>
              <Route index element={<MaterialUpload />} />
            </Route>

            <Route path="/students" element={<AppLayout requiredRole="teacher" />}>
              <Route index element={<Students />} />
            </Route>

            {/* Admin-specific routes */}
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

            {/* Shared routes with role-specific content */}
            <Route path="/" element={<AppLayout />}>
              <Route path="materials" element={<Materials />} />
              <Route path="profile" element={<Profile />} />
              {/* Redirect to role-specific dashboard */}
              <Route path="dashboard" element={<RoleBasedDashboard />} />
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

// Helper component to redirect based on user role
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

export default App;
