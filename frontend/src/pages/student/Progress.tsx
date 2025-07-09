// Import necessary components and hooks
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  BookOpen,
  BarChart,
  RefreshCw,
  Clock,
  Trophy,
  Bookmark,
  Activity,
  PlayCircle,
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define TypeScript interfaces for our data structures
interface SubjectProgress {
  total_topics: number;
  viewed_materials: number;
  explored_topics: number;
  subject_id: number;
  subject_name: string;
  total_materials?: number;
  completed_materials?: number;
  completion_percentage?: number;
}

interface RecentActivity {
  material_id: number;
  material_name: string;
  subject_name: string;
  status: "Completed" | "In Progress" | "To Learn";
  last_updated: string;
}

interface ProgressStats {
  total_materials?: number;
  total_accessed?: number;
  to_learn?: number;
  in_progress?: number;
  completed?: number;
  completion_percentage?: number;
  not_started?: number;
}

const ProgressPage = () => {
  // Authentication and state management
  const { user, isAuthenticated, loading: authLoading, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  
  // State variables
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calculate progress stats from subjects data
  const calculateStatsFromSubjects = useCallback((subjects: SubjectProgress[]): ProgressStats => {
    // Sum all materials and topics
    const totalMaterials = subjects.reduce((sum, subject) => sum + (subject.total_materials || 0), 0);
    const totalTopics = subjects.reduce((sum, subject) => sum + (subject.total_topics || 0), 0);
    
    // Sum all viewed materials and explored topics
    const viewedMaterials = subjects.reduce((sum, subject) => sum + (subject.viewed_materials || 0), 0);
    const exploredTopics = subjects.reduce((sum, subject) => sum + (subject.explored_topics || 0), 0);

    // Calculate totals and completion
    const totalItems = totalMaterials + totalTopics;
    const completedItems = viewedMaterials + exploredTopics;

    // Calculate percentage with bounds checking
    const completionPercentage = totalItems > 0
      ? Math.min(100, Math.max(0, Math.round((completedItems / totalItems) * 100)))
      : 0;

    return {
      total_materials: totalItems,
      total_accessed: completedItems,
      completed: completedItems,
      completion_percentage: completionPercentage,
      not_started: Math.max(0, totalItems - completedItems),
    };
  }, []);

  // Handle API errors with session refresh if needed
  const handleApiError = useCallback(async (error: unknown) => {
    console.error("API Error:", error);
    let errorMessage = "Failed to fetch progress data. Please try again later.";

    if (typeof error === "object" && error !== null) {
      const err = error as {
        response?: { status?: number; data?: { message?: string } };
        message?: string;
      };

      if (err.response?.status === 401) {
        try {
          const refreshed = await refreshSession();
          if (refreshed) return true;
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
        }

        await logout();
        navigate("/login");
        return false;
      }

      errorMessage = err.response?.data?.message || err.message || errorMessage;
    }

    setError(errorMessage);
    return false;
  }, [refreshSession, logout, navigate]);

  // Fetch progress data from API
  const fetchProgressData = useCallback(async (silent = false) => {
    try {
      if (!isAuthenticated || !user?.email) return;

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      setStatsError(false);

      // Fetch both subjects and activities in parallel
      const [subjectsRes, activitiesRes] = await Promise.all([
        api.get(`/progress/summary/${user.email}`),
        api.get(`/progress/recent/${user.email}`),
      ]);

      // Validate and normalize subjects data
      const validatedSubjects = subjectsRes.data.map((subject: SubjectProgress) => ({
        subject_id: subject.subject_id || 0,
        subject_name: subject.subject_name || "Unknown Subject",
        total_materials: Math.max(0, subject.total_materials || 0),
        completed_materials: Math.max(0, subject.completed_materials || 0),
        completion_percentage: Math.min(100, Math.max(0, subject.completion_percentage || 0)),
        viewed_materials: subject.viewed_materials || 0,
        explored_topics: subject.explored_topics || 0,
        total_topics: subject.total_topics || 0,
      }));

      setSubjectProgress(validatedSubjects);
      setRecentActivities(activitiesRes.data || []);

      // Calculate stats from subjects first for immediate UI update
      const calculatedStats = calculateStatsFromSubjects(validatedSubjects);
      setProgressStats(calculatedStats);

      // Optionally fetch server stats for additional data
      try {
        const statsRes = await api.get(`/progress/stats/${user.email}`);
        if (statsRes.data) {
          setProgressStats({
            total_materials: parseInt(statsRes.data?.total_materials) || 0,
            total_accessed: parseInt(statsRes.data?.total_accessed) || 0,
            to_learn: parseInt(statsRes.data?.to_learn) || 0,
            in_progress: parseInt(statsRes.data?.in_progress) || 0,
            completed: parseInt(statsRes.data?.completed) || 0,
            completion_percentage: parseFloat(statsRes.data?.completion_percentage) || 0,
            not_started: Math.max(0, (parseInt(statsRes.data?.total_materials || 0) - 
                              parseInt(statsRes.data?.completed || 0))),
          });
        }
      } catch (statsErr) {
        console.error("Stats endpoint failed:", statsErr);
        setStatsError(true);
      }
    } catch (err) {
      const shouldRetry = await handleApiError(err);
      if (shouldRetry) await fetchProgressData(silent);
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, user?.email, handleApiError, calculateStatsFromSubjects]);

  // Fetch data on component mount
  useEffect(() => {
    fetchProgressData();
  }, [fetchProgressData]);

  // Handle material click - mark as in progress
  const handleMaterialClick = async (materialId: number) => {
    if (!user?.email) return;
    try {
      setIsRefreshing(true);
      await api.post("/progress/update", {
        user_email: user.email,
        material_id: materialId,
        status: "In Progress",
      });
      toast.success("Progress updated!");
      await fetchProgressData(true); // Silent refresh
    } catch (err) {
      console.error("Failed to update material progress", err);
      toast.error("Failed to update progress");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Loading and error states
  if (authLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-8 text-center text-red-500">Unauthorized. Please login.</div>;
  }

  if (error) {
    return (
      <div className="p-8 space-y-4 text-center">
        <div className="text-red-500">{error}</div>
        <Button onClick={() => fetchProgressData()}>Retry</Button>
      </div>
    );
  }

  // Main component render
  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Your Progress</h2>
          <p className="text-muted-foreground">
            {progressStats?.completion_percentage ?? 0}% completed
          </p>
        </div>
        <Button onClick={() => fetchProgressData()} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Completion" 
          value={`${progressStats?.completion_percentage ?? 0}%`} 
          icon={<Trophy className="text-primary w-5 h-5" />} 
        />
        <StatCard 
          title="Total Materials" 
          value={`${progressStats?.total_materials ?? 0}`} 
          icon={<Bookmark className="text-primary w-5 h-5" />} 
        />
        <StatCard 
          title="Accessed" 
          value={`${progressStats?.total_accessed ?? 0}`} 
          icon={<Activity className="text-primary w-5 h-5" />} 
        />
      </div>

      <TabsSection
        subjectProgress={subjectProgress}
        recentActivities={recentActivities}
        progressStats={progressStats}
        loading={loading}
        onMaterialClick={handleMaterialClick}
      />
    </div>
  );
};

// StatCard component for displaying progress metrics
const StatCard = ({ 
  title, 
  value, 
  icon 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode 
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center space-y-0 space-x-2">
      {icon}
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
    </CardContent>
  </Card>
);

// TabsSection component for organizing content
const TabsSection = ({
  subjectProgress,
  recentActivities,
  progressStats,
  loading,
  onMaterialClick,
}: {
  subjectProgress: SubjectProgress[];
  recentActivities: RecentActivity[];
  progressStats: ProgressStats | null;
  loading: boolean;
  onMaterialClick: (materialId: number) => void;
}) => (
  <Tabs defaultValue="subjects" className="w-full">
    <TabsList className="mb-4">
      <TabsTrigger value="subjects">
        <BookOpen className="w-4 h-4 mr-2" /> Subject Progress
      </TabsTrigger>
      <TabsTrigger value="recent">
        <Clock className="w-4 h-4 mr-2" /> Recent Activity
      </TabsTrigger>
      <TabsTrigger value="analytics">
        <BarChart className="w-4 h-4 mr-2" /> Analytics
      </TabsTrigger>
    </TabsList>

    <TabsContent value="subjects">
      {subjectProgress.length === 0 && !loading ? (
        <p className="text-muted-foreground text-sm">No subjects found.</p>
      ) : (
        <ul className="space-y-4">
          {subjectProgress.map((subject) => (
            <li key={subject.subject_id} className="border p-4 rounded-lg">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{subject.subject_name}</span>
                <span className="text-sm text-muted-foreground">
                  {subject.completion_percentage ?? 0}%
                </span>
              </div>
              <Progress value={subject.completion_percentage ?? 0} />
            </li>
          ))}
        </ul>
      )}
    </TabsContent>

    <TabsContent value="recent">
      {recentActivities.length === 0 && !loading ? (
        <p className="text-muted-foreground text-sm">No recent activity found.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity, idx) => (
                <TableRow key={idx}>
                  <TableCell>{activity.material_name}</TableCell>
                  <TableCell>{activity.subject_name}</TableCell>
                  <TableCell>{activity.status}</TableCell>
                  <TableCell>{new Date(activity.last_updated).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => onMaterialClick(activity.material_id)}
                    >
                      <PlayCircle className="w-4 h-4 mr-1" /> View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </TabsContent>

    <TabsContent value="analytics">
      <p className="text-muted-foreground text-sm">Analytics coming soon.</p>
    </TabsContent>
  </Tabs>
);

export default ProgressPage;