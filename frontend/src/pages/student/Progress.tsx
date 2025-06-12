// src/pages/ProgressPage.tsx
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, CheckCircle, BarChart, AreaChart } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";

interface SubjectProgress {
  subject_id: number;
  subject_name: string;
  total_materials: number;
  completed_materials: number;
  completion_percentage: number;
}

interface RecentActivity {
  material_id: number;
  material_name: string;
  subject_name: string;
  status: string;
  last_updated: string;
}

interface ProgressStats {
  total_materials: number;
  total_accessed: number;
  to_learn: number;
  in_progress: number;
  completed: number;
  not_started: number;
  completion_percentage: number;
}

const ProgressPage = () => {
  const { user } = useAuth();
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [progressStats, setProgressStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (!user?.email) {
          throw new Error("User email not available");
        }

        // Fetch all data in parallel using port 5000 directly
        const [subjectsRes, activitiesRes, statsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/progress/summary/${user.email}`),
          axios.get(`http://localhost:5000/api/progress/recent/${user.email}`),
          axios.get(`http://localhost:5000/api/progress/stats/${user.email}`)
        ]);

        setSubjectProgress(subjectsRes.data);
        setRecentActivities(activitiesRes.data);
        setProgressStats(statsRes.data);
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch progress data");
        console.error("API Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-red-500 text-center p-4 rounded-lg bg-red-50">
          {error}
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-edu-primary text-white rounded hover:bg-edu-primary-dark"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">My Learning Progress</h1>
        <p className="text-muted-foreground">Track your learning journey and achievements</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Overall Progress Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Overall Completion</CardTitle>
            <CardDescription>Your total progress across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center pt-4 pb-6">
              <div className="relative flex items-center justify-center mb-4">
                <svg className="w-32 h-32">
                  <circle
                    className="text-gray-200 stroke-current"
                    strokeWidth="8"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                  <circle
                    className="text-edu-primary stroke-current"
                    strokeWidth="8"
                    strokeDasharray={352}
                    strokeDashoffset={352 - (352 * (progressStats?.completion_percentage || 0)) / 100}
                    strokeLinecap="round"
                    fill="transparent"
                    r="56"
                    cx="64"
                    cy="64"
                  />
                </svg>
                <span className="absolute text-3xl font-bold">
                  {progressStats?.completion_percentage || 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Materials Status Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Materials Status</CardTitle>
            <CardDescription>Breakdown of your learning materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 py-2">
              {[
                { label: 'Not Started', value: progressStats?.not_started || 0, color: 'bg-gray-400' },
                { label: 'To Learn', value: progressStats?.to_learn || 0, color: 'bg-blue-400' },
                { label: 'In Progress', value: progressStats?.in_progress || 0, color: 'bg-yellow-400' },
                { label: 'Completed', value: progressStats?.completed || 0, color: 'bg-green-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Quick Stats</CardTitle>
            <CardDescription>Key learning metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 py-2">
              <StatItem 
                value={progressStats?.total_materials || 0}
                label="Total Materials"
                color="text-edu-primary"
              />
              <StatItem 
                value={progressStats?.total_accessed || 0}
                label="Accessed"
                color="text-edu-secondary"
              />
              <StatItem 
                value={progressStats?.completed || 0}
                label="Completed"
                color="text-green-500"
              />
              <StatItem 
                value={`${progressStats?.completion_percentage || 0}%`}
                label="Completion"
                color="text-edu-accent"
              />
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
              <CardDescription>
                Detailed breakdown by subject area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject_id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{subject.subject_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {subject.completed_materials} of {subject.total_materials} completed
                        </div>
                      </div>
                      <div className="font-medium">
                        {subject.completion_percentage}%
                      </div>
                    </div>
                    <Progress 
                      value={subject.completion_percentage} 
                      className="h-2" 
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recent">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your most recent learning sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
                    <ActivityItem 
                      key={activity.material_id}
                      activity={activity}
                      formatDate={formatDate}
                    />
                  ))
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
              <CardDescription>
                Detailed insights into your progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12">
                <AreaChart className="h-24 w-24 text-muted-foreground opacity-30" />
                <p className="text-center text-muted-foreground mt-4">
                  Detailed analytics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper Components
const StatItem = ({ value, label, color }: { value: string | number; label: string; color: string }) => (
  <div className="flex flex-col items-center">
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
    <div className="text-xs text-muted-foreground">{label}</div>
  </div>
);

const ActivityItem = ({ activity, formatDate }: { activity: RecentActivity; formatDate: (date: string) => string }) => {
  const statusColors = {
    'Completed': 'bg-green-100 text-green-800',
    'In Progress': 'bg-yellow-100 text-yellow-800',
    'To Learn': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="flex items-start pb-4 border-b last:border-0">
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
};

export default ProgressPage;