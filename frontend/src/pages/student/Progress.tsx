import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle, BarChart, AreaChart, RefreshCw, Clock, Trophy, Bookmark, Activity } from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CircularProgress } from "@/components/ui/circular-progress";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  status: 'Completed' | 'In Progress' | 'To Learn';
  last_updated: string;
}

interface ProgressStats {
  total_materials?: number;
  total_accessed?: number;
  to_learn?: number;
  in_progress?: number;
  completed?: number;
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
  const [statsError, setStatsError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updateMaterialStatus = async (materialId: number, newStatus: 'To Learn' | 'In Progress' | 'Completed') => {
    if (!user?.email) return;

    try {
      const response = await api.post('/progress/update', {
        user_email: user.email,
        material_id: materialId,
        status: newStatus
      });

      if (response.data) {
        toast.success('Progress updated successfully');
        await fetchProgressData(true);
      }
    } catch (err) {
      console.error('Failed to update progress:', err);
      toast.error('Failed to update progress. Please try again.');
      await handleApiError(err);
    }
  };

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
      
      if (err.response?.status === 401) {
        try {
          const refreshed = await refreshSession();
          if (refreshed) {
            return true;
          }
        } catch (refreshError) {
          console.error("Session refresh failed:", refreshError);
        }
        
        await logout();
        navigate('/login');
        return false;
      }

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
  }, [refreshSession, logout, navigate]);

  const fetchProgressData = useCallback(async (silent = false) => {
    try {
      if (!isAuthenticated || !user?.email) return;

      if (!silent) {
        setLoading(true);
        setError(null);
      }
      setStatsError(false);
      
      const [subjectsRes, activitiesRes] = await Promise.all([
        api.get(`/progress/summary/${user.email}`),
        api.get(`/progress/recent/${user.email}`)
      ]);

      const validatedSubjects = subjectsRes.data.map((subject: SubjectProgress) => ({
        subject_id: subject.subject_id || 0,
        subject_name: subject.subject_name || 'Unknown Subject',
        total_materials: Math.max(0, subject.total_materials || 0),
        completed_materials: Math.max(0, subject.completed_materials || 0),
        completion_percentage: Math.min(100, Math.max(0, subject.completion_percentage || 0))
      }));

      setSubjectProgress(validatedSubjects);
      setRecentActivities(activitiesRes.data || []);

      try {
        const statsRes = await api.get(`/progress/stats/${user.email}`);
        if (statsRes.data) {
          setProgressStats({
            total_materials: Math.max(0, statsRes.data?.total_materials || 0),
            total_accessed: Math.max(0, statsRes.data?.total_accessed || 0),
            to_learn: Math.max(0, statsRes.data?.to_learn || 0),
            in_progress: Math.max(0, statsRes.data?.in_progress || 0),
            completed: Math.max(0, statsRes.data?.completed || 0),
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
        await fetchProgressData(silent);
      }
    } finally {
      if (!silent) {
        setLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [isAuthenticated, user?.email, handleApiError, calculateStatsFromSubjects]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchProgressData();
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'To Learn': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  if (authLoading) {
    return <LoadingView message="Checking authentication..." />;
  }

  if (!isAuthenticated) {
    return <UnauthorizedView />;
  }

  if (loading) {
    return <LoadingView message="Loading your progress..." />;
  }

  if (error) {
    return <ErrorView error={error} onRetry={handleRefresh} />;
  }

  return (
    <div className="space-y-8">
      <HeaderSection 
        progressStats={progressStats} 
        statsError={statsError}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <StatsDashboard 
        progressStats={progressStats} 
        statsError={statsError} 
      />

      <MainTabs 
        subjectProgress={subjectProgress}
        recentActivities={recentActivities}
        formatDate={formatDate}
        updateMaterialStatus={updateMaterialStatus}
        getStatusColor={getStatusColor}
        progressStats={progressStats}
      />
    </div>
  );
};

const LoadingView = ({ message }: { message: string }) => (
  <div className="flex justify-center items-center h-64">
    <CircularProgress />
    <span className="ml-4">{message}</span>
  </div>
);

const UnauthorizedView = () => (
  <div className="flex justify-center items-center h-64">
    <div className="text-red-500 text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
      Please login to view your progress
    </div>
  </div>
);

const ErrorView = ({ error, onRetry }: { error: string, onRetry: () => void }) => (
  <div className="flex flex-col justify-center items-center h-64 space-y-4">
    <div className="text-red-500 text-center p-4 rounded-lg bg-red-50 dark:bg-red-900/20 max-w-md">
      {error}
    </div>
    <Button onClick={onRetry} variant="default">
      <RefreshCw className="mr-2 h-4 w-4" />
      Try Again
    </Button>
  </div>
);

const HeaderSection = ({ 
  progressStats, 
  statsError,
  onRefresh,
  isRefreshing
}: { 
  progressStats: ProgressStats | null,
  statsError: boolean,
  onRefresh: () => void,
  isRefreshing: boolean
}) => (
  <header className="space-y-2">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">My Learning Progress</h1>
        <p className="text-muted-foreground">
          {progressStats?.completion_percentage 
            ? `You've completed ${progressStats.completion_percentage}% of your materials`
            : "Track your learning journey and achievements"}
        </p>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
        Refresh
      </Button>
    </div>
    {statsError && (
      <Badge variant="warning" className="self-start">
        Some statistics may be estimated
      </Badge>
    )}
  </header>
);

const StatsDashboard = ({ progressStats, statsError }: { 
  progressStats: ProgressStats | null, 
  statsError: boolean 
}) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <StatCard 
      title="Overall Completion"
      description="Your total progress across all subjects"
      isEstimated={statsError}
      icon={<Trophy className="h-6 w-6 text-primary" />}
    >
      <div className="flex justify-center py-4">
        <CircularProgress 
          percentage={progressStats?.completion_percentage || 0} 
          size={120}
          strokeWidth={10}
        />
      </div>
    </StatCard>

    <StatCard 
      title="Materials Status"
      description="Breakdown of your learning materials"
      isEstimated={statsError}
      icon={<Bookmark className="h-6 w-6 text-primary" />}
    >
      <div className="space-y-4 py-2">
        {progressStats ? (
          [
            { label: 'Not Started', value: progressStats.total_materials! - (progressStats.completed || 0), color: 'bg-gray-400' },
            { label: 'To Learn', value: progressStats.to_learn || 0, color: 'bg-blue-400' },
            { label: 'In Progress', value: progressStats.in_progress || 0, color: 'bg-yellow-400' },
            { label: 'Completed', value: progressStats.completed || 0, color: 'bg-green-400' },
          ].filter(item => item.value > 0).map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                <span className="text-sm">{item.label}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="font-medium">{item.value}</span>
                {progressStats.total_materials && (
                  <span className="text-xs text-muted-foreground">
                    ({Math.round((item.value / progressStats.total_materials) * 100)}%)
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-4">
            Status data not available
          </div>
        )}
      </div>
    </StatCard>

    <StatCard 
      title="Quick Stats"
      description="Key learning metrics"
      isEstimated={statsError}
      icon={<Activity className="h-6 w-6 text-primary" />}
    >
      <div className="grid grid-cols-2 gap-4 py-2">
        {progressStats ? (
          [
            { value: progressStats.total_materials || 0, label: "Total Materials", icon: <BookOpen className="h-4 w-4" /> },
            { value: progressStats.total_accessed || 0, label: "Accessed", icon: <Clock className="h-4 w-4" /> },
            { value: progressStats.completed || 0, label: "Completed", icon: <CheckCircle className="h-4 w-4" /> },
            { value: `${progressStats.completion_percentage || 0}%`, label: "Completion", icon: <BarChart className="h-4 w-4" /> },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2">
                {item.icon}
                <div className="text-lg font-bold">{item.value}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">{item.label}</div>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center text-muted-foreground py-4">
            Statistics not available
          </div>
        )}
      </div>
    </StatCard>
  </div>
);

const StatCard = ({ 
  title, 
  description, 
  isEstimated, 
  children,
  icon
}: { 
  title: string, 
  description: string, 
  isEstimated: boolean, 
  children: React.ReactNode,
  icon?: React.ReactNode
}) => (
  <Card>
    <CardHeader className="pb-2">
      <div className="flex items-center space-x-3">
        {icon}
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </div>
      {isEstimated && (
        <Badge variant="warning" className="self-start mt-1">
          Estimated
        </Badge>
      )}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);

const MainTabs = ({
  subjectProgress,
  recentActivities,
  formatDate,
  updateMaterialStatus,
  getStatusColor,
  progressStats
}: {
  subjectProgress: SubjectProgress[],
  recentActivities: RecentActivity[],
  formatDate: (date: string) => string,
  updateMaterialStatus: (id: number, status: 'To Learn' | 'In Progress' | 'Completed') => void,
  getStatusColor: (status: string) => string,
  progressStats: ProgressStats | null
}) => (
  <Tabs defaultValue="subjects" className="w-full">
    <TabsList className="grid w-full grid-cols-3">
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
                  <SubjectProgressItem key={subject.subject_id} subject={subject} />
                ))
            ) : (
              <EmptyState message="No subject data available" />
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
          {recentActivities.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Material</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentActivities
                    .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
                    .slice(0, 10)
                    .map((activity) => (
                      <TableRow key={`${activity.material_id}-${activity.last_updated}`}>
                        <TableCell className="font-medium">{activity.material_name}</TableCell>
                        <TableCell>{activity.subject_name}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              activity.status === 'Completed' ? 'success' : 
                              activity.status === 'In Progress' ? 'warning' : 'default'
                            }
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span>{formatDate(activity.last_updated).split(',')[0]}</span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{formatDate(activity.last_updated)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => updateMaterialStatus(
                                activity.material_id, 
                                activity.status === 'Completed' ? 'To Learn' : 'Completed'
                              )}
                            >
                              {activity.status === 'Completed' ? 'Mark as To Learn' : 'Mark as Completed'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState message="No recent activity found" />
          )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate</CardTitle>
                <CardDescription>Your progress over time</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <AreaChart className="h-24 w-24 mx-auto text-primary opacity-50" />
                  <p className="text-muted-foreground">Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Subject Distribution</CardTitle>
                <CardDescription>Your focus areas</CardDescription>
              </CardHeader>
              <CardContent className="h-64 flex items-center justify-center">
                <div className="text-center space-y-2">
                  <PieChart className="h-24 w-24 mx-auto text-primary opacity-50" />
                  <p className="text-muted-foreground">Analytics coming soon</p>
                </div>
              </CardContent>
            </Card>
            
            {progressStats && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Learning Velocity</CardTitle>
                  <CardDescription>Your pace of completion</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <TrendingUp className="h-24 w-24 mx-auto text-primary opacity-50" />
                    <p className="text-muted-foreground">Analytics coming soon</p>
                    <p className="text-sm text-muted-foreground">
                      Based on your current pace, you'll complete all materials in approximately 
                      {' '}
                      {progressStats.total_materials && progressStats.completed && progressStats.total_materials > 0
                        ? Math.ceil((progressStats.total_materials - progressStats.completed) / 2)
                        : 'unknown'}
                      {' '}
                      days.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  </Tabs>
);

const SubjectProgressItem = ({ subject }: { subject: SubjectProgress }) => {
  const indicatorColor = (subject.completion_percentage || 0) >= 75 
    ? 'bg-green-500' 
    : (subject.completion_percentage || 0) >= 50 
      ? 'bg-yellow-500' 
      : 'bg-blue-500';

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <div>
          <div className="font-medium">{subject.subject_name}</div>
          <div className="text-sm text-muted-foreground">
            {subject.completed_materials || 0} of {subject.total_materials || 0} completed
            {' '}
            ({subject.completion_percentage || 0}%)
          </div>
        </div>
        <div className="font-medium">
          {subject.completion_percentage || 0}%
        </div>
      </div>
      <Progress 
        value={subject.completion_percentage || 0} 
        className="h-2" 
        indicatorColor={indicatorColor}
      />
    </div>
  );
};

const EmptyState = ({ message, icon }: { message: string, icon?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center py-12">
    {icon || <BookOpen className="h-24 w-24 text-muted-foreground opacity-30" />}
    <p className="text-center text-muted-foreground mt-4">
      {message}
    </p>
  </div>
);

// Temporary placeholder components for analytics
const PieChart = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="70 30" />
  </svg>
);

const TrendingUp = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </svg>
);

export default ProgressPage;