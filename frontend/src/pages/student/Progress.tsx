import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle, BarChart, AreaChart } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@/components/ui/circular-progress";

// Interfaces with optional properties marked clearly
interface SubjectProgress {
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
  status: 'Completed' | 'In Progress' | 'To Learn' | string;
  last_updated: string;
}

interface ProgressStats {
  total_materials?: number;
  total_accessed?: number;
  to_learn?: number;
  in_progress?: number;
  completed?: number;
  not_started?: number;
  completion_percentage?: number;
}

const ProgressPage = () => {
  const { user, isAuthenticated, loading: authLoading, refreshSession, logout } = useAuth();
  const navigate = useNavigate();
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [statsError, setStatsError] = useState(false);

  const calculateStatsFromSubjects = useCallback((subjects: SubjectProgress[]): ProgressStats => {
    const totalMaterials = subjects.reduce((sum, subject) => sum + (subject.total_materials || 0), 0);
    const completedMaterials = subjects.reduce((sum, subject) => sum + (subject.completed_materials || 0), 0);
    const completionPercentage = totalMaterials > 0 
      ? Math.min(100, Math.max(0, Math.round((completedMaterials / totalMaterials) * 100)))
      : 0;

    return {
      total_materials: totalMaterials,
      total_accessed: completedMaterials,
      completed: completedMaterials,
      completion_percentage: completionPercentage,
      not_started: Math.max(0, totalMaterials - completedMaterials)
    };
  }, []);

  const handleApiError = useCallback(async (error: unknown) => {
    console.error("API Error:", error);
    let errorMessage = "Failed to fetch progress data. Please try again later.";
    
    if (typeof error === 'object' && error !== null) {
      const err = error as { response?: { status?: number, data?: { message?: string } }, message?: string };
      
      // Handle 401 Unauthorized errors with token refresh
      if (err.response?.status === 401) {
        try {
          if (retryCount >= 2) {
            await logout();
            navigate('/login');
            return;
          }

          const refreshed = await refreshSession();
          if (refreshed) {
            setRetryCount(prev => prev + 1);
            return true; // Indicate retry should be attempted
          }
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
        }
        
        await logout();
        navigate('/login');
        return false;
      }

      // Handle 500 errors
      if (err.response?.status === 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
    }

    setError(errorMessage);
    return false;
  }, [retryCount, refreshSession, logout, navigate]);

  const fetchProgressData = useCallback(async () => {
    try {
      if (!isAuthenticated || !user?.email) return;

      setLoading(true);
      setError(null);
      setStatsError(false);
      
      // Clear previous data while refreshing
      setSubjectProgress([]);
      setRecentActivities([]);
      setProgressStats(null);

      // Fetch subjects and activities first
      const [subjectsRes, activitiesRes] = await Promise.all([
        api.get(`/progress/summary/${user.email}`).catch(err => { throw err; }),
        api.get(`/progress/recent/${user.email}`).catch(err => { throw err; })
      ]);

      // Validate responses
      if (!subjectsRes?.data || !activitiesRes?.data) {
        throw new Error("Invalid data received from server");
      }

      const validatedSubjects = subjectsRes.data.map((subject: SubjectProgress) => ({
        subject_id: subject.subject_id || 0,
        subject_name: subject.subject_name || 'Unknown Subject',
        total_materials: Math.max(0, subject.total_materials || 0),
        completed_materials: Math.max(0, subject.completed_materials || 0),
        completion_percentage: Math.min(100, Math.max(0, subject.completion_percentage || 0))
      }));

      setSubjectProgress(validatedSubjects);
      setRecentActivities(activitiesRes.data || []);

      // Try to fetch stats separately with error handling
      try {
        const statsRes = await api.get(`/progress/stats/${user.email}`);
        if (statsRes.data) {
          setProgressStats({
            total_materials: Math.max(0, statsRes.data?.total_materials || 0),
            total_accessed: Math.max(0, statsRes.data?.total_accessed || 0),
            to_learn: Math.max(0, statsRes.data?.to_learn || 0),
            in_progress: Math.max(0, statsRes.data?.in_progress || 0),
            completed: Math.max(0, statsRes.data?.completed || 0),
            not_started: Math.max(0, statsRes.data?.not_started || 0),
            completion_percentage: Math.min(100, Math.max(0, statsRes.data?.completion_percentage || 0))
          });
        }
      } catch (statsErr) {
        console.error("Stats endpoint failed:", statsErr);
        setStatsError(true);
        setProgressStats(calculateStatsFromSubjects(validatedSubjects));
      }

    } catch (err) {
      const shouldRetry = await handleApiError(err);
      if (shouldRetry) {
        await fetchProgressData();
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email, handleApiError, calculateStatsFromSubjects]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProgressData();
    }
  }, [isAuthenticated, fetchProgressData]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const handleRetry = async () => {
    setRetryCount(0);
    setError(null);
    setLoading(true);
    setStatsError(false);
    
    try {
      if (!isAuthenticated) {
        const refreshed = await refreshSession();
        if (!refreshed) {
          await logout();
          navigate('/login');
          return;
        }
      }
      
      await fetchProgressData();
    } catch (err) {
      setError("Failed to refresh data. Please try again.");
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-center p-4 rounded-lg bg-red-50">
          Please login to view your progress
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
        <span className="ml-4">Loading your progress...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="text-red-500 text-center p-4 rounded-lg bg-red-50 max-w-md">
          {error}
        </div>
        <div className="flex space-x-4">
          <button 
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Try Again'}
          </button>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">My Learning Progress</h1>
        <p className="text-muted-foreground">
          {progressStats?.completion_percentage 
            ? `You've completed ${progressStats.completion_percentage}% of your materials`
            : "Track your learning journey and achievements"}
        </p>
        {statsError && (
          <div className="bg-yellow-50 text-yellow-800 p-3 rounded-md text-sm">
            Some statistics may be estimated as we couldn't load complete data.
          </div>
        )}
      </header>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Completion</CardTitle>
            <CardDescription>Your total progress across all subjects</CardDescription>
            {statsError && (
              <span className="text-xs text-yellow-600">Estimated from subject data</span>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center pt-4 pb-6">
              <CircularProgress 
                percentage={progressStats?.completion_percentage || 0} 
                size={120}
                strokeWidth={10}
              />
            </div>
          </CardContent>
        </Card>

        {/* Materials Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Materials Status</CardTitle>
            <CardDescription>Breakdown of your learning materials</CardDescription>
            {statsError && (
              <span className="text-xs text-yellow-600">Basic overview only</span>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {progressStats ? (
                [
                  { label: 'Not Started', value: progressStats.not_started || 0, color: 'bg-gray-400' },
                  { label: 'To Learn', value: progressStats.to_learn || 0, color: 'bg-blue-400' },
                  { label: 'In Progress', value: progressStats.in_progress || 0, color: 'bg-yellow-400' },
                  { label: 'Completed', value: progressStats.completed || 0, color: 'bg-green-400' },
                ].filter(item => item.value > 0).map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                      <span className="text-sm">{item.label}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-4">
                  Status data not available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Key learning metrics</CardDescription>
            {statsError && (
              <span className="text-xs text-yellow-600">Partial data available</span>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-2">
              {progressStats ? (
                [
                  { value: progressStats.total_materials || 0, label: "Total Materials", color: "text-blue-600" },
                  { value: progressStats.total_accessed || 0, label: "Accessed", color: "text-purple-600" },
                  { value: progressStats.completed || 0, label: "Completed", color: "text-green-500" },
                  { value: `${progressStats.completion_percentage || 0}%`, label: "Completion", color: "text-yellow-600" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center">
                    <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center text-muted-foreground py-4">
                  Statistics not available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="subjects">
        <TabsList className="mb-6">
          <TabsTrigger value="subjects" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </TabsTrigger>
          <TabsTrigger value="recent" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Recent Activity
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle>Subject Progress</CardTitle>
              <CardDescription>Detailed breakdown by subject area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subjectProgress.length > 0 ? (
                  subjectProgress
                    .sort((a, b) => (b.completion_percentage || 0) - (a.completion_percentage || 0))
                    .map((subject) => (
                      <div key={subject.subject_id} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{subject.subject_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {subject.completed_materials || 0} of {subject.total_materials || 0} completed
                            </div>
                          </div>
                          <div className="font-medium">
                            {subject.completion_percentage || 0}%
                          </div>
                        </div>
                        <Progress 
                          value={subject.completion_percentage || 0} 
                          className="h-2" 
                        />
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No subject data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your most recent learning sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities
                    .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
                    .slice(0, 10)
                    .map((activity) => {
                      const statusColors = {
                        'Completed': 'bg-green-100 text-green-800',
                        'In Progress': 'bg-yellow-100 text-yellow-800',
                        'To Learn': 'bg-blue-100 text-blue-800'
                      };
                      
                      return (
                        <div key={`${activity.material_id}-${activity.last_updated}`} className="flex items-start pb-4 border-b last:border-0">
                          <div className={`p-2 rounded-md mr-4 ${
                            activity.status === 'Completed' ? 'bg-green-400/10 text-green-500' :
                            activity.status === 'In Progress' ? 'bg-yellow-400/10 text-yellow-500' :
                            'bg-blue-400/10 text-blue-500'
                          }`}>
                            <BookOpen className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium">{activity.material_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {activity.subject_name} • {formatDate(activity.last_updated)}
                            </div>
                            <div className="mt-2">
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                statusColors[activity.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                              }`}>
                                {activity.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent activity found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Learning Analytics</CardTitle>
              <CardDescription>Detailed insights into your progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <AreaChart className="h-24 w-24 text-muted-foreground opacity-30" />
                <p className="text-center text-muted-foreground mt-4">
                  {statsError ? 
                    "Analytics temporarily unavailable due to server issues" : 
                    "Detailed analytics coming soon"}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProgressPage;