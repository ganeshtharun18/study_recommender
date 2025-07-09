
import MaterialsBrowser from "@/components/materials/MaterialsBrowser";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Materials = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const isTeacherOrAdmin = user?.role === "teacher" || user?.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Study Materials</h1>
          <p className="text-muted-foreground">Browse and access learning resources</p>
        </div>

        {isTeacherOrAdmin && (
          <Button 
            onClick={() => navigate("/upload")}
            className="bg-edu-primary hover:bg-edu-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Material
          </Button>
        )}
      </div>

      <MaterialsBrowser showProgress={user?.role === "student"} />
    </div>
  );
};

export default Materials;
