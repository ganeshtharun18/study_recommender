import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted-foreground"
        >
          <path d="M15.5 12H8.5m11-5v12a2 2 0 0 1-2 2h-8m0 0a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8M7.5 7v12"></path>
        </svg>
      </div>

      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        You don't have permission to view this page. This area requires different access privileges.
      </p>

      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant="default"
          className="bg-edu-primary hover:bg-edu-primary/90"
          onClick={() => {
            if (user?.role === "admin") {
              navigate("/admin/dashboard");
            } else if (user?.role === "teacher") {
              navigate("/teacher/dashboard");
            } else if (user?.role === "student") {
              navigate("/dashboard");
            } else {
              navigate("/");
            }
          }}
        >
          Go to Dashboard
        </Button>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    </div>
  );
};

export default Unauthorized;
