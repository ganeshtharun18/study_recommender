import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, BookOpen, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

interface TeachingMaterial {
  id: string;
  title: string;
  subject: string;
  views: number;
  completions: number;
  ratings: number;
}

interface RecentActivity {
  id: string;
  type: string;
  content: string;
  time: string;
}

interface StudentStats {
  total: number;
  active: number;
  avgProgress: number;
}

interface SubjectProgress {
  subject_id: string;
  subject_name: string;
  total_materials: number;
  completed_materials: number;
  completion_percentage: number;
}

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats>({ total: 0, active: 0, avgProgress: 0 });
  const [teachingMaterials, setTeachingMaterials] = useState<TeachingMaterial[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all data in parallel
        const [materialsRes, studentsRes, activitiesRes, progressRes] = await Promise.all([
          axios.get('/api/material/materials'),
          axios.get('/api/auth/students'), // You'll need to implement this endpoint
          axios.get('/api/progress/recent-activities'), // You'll need to implement this endpoint
          axios.get('/api/progress/subject-progress') // You'll need to implement this endpoint
        ]);

        setTeachingMaterials(materialsRes.data.data.map((mat: any) => ({
          id: mat.id,
          title: mat.title,
          subject: mat.subject_id, // Adjust based on your actual data structure
          views: mat.views || 0,
          completions: mat.completions || 0,
          ratings: mat.ratings || 0
        })));

        // Calculate student stats based on your actual data
        const totalStudents = studentsRes.data.length;
        const activeStudents = studentsRes.data.filter((s: any) => s.active).length;
        const avgProgress = progressRes.data.reduce((acc: number, curr: any) => 
          acc + curr.completion_percentage, 0) / (progressRes.data.length || 1);

        setStudentStats({
          total: totalStudents,
          active: activeStudents,
          avgProgress: Math.round(avgProgress)
        });

        setSubjectProgress(progressRes.data);

        // Transform activities to match your UI
        setRecentActivities(activitiesRes.data.map((act: any) => ({
          id: act.id,
          type: act.type,
          content: act.content,
          time: act.time
        })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // You might want to show error notifications to the user
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <Skeleton className="h-8 w-8 rounded-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="flex gap-4">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className="space-y-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="pt-2 flex justify-between">
                  <Skeleton className="h-10 w-40" />
                  <Skeleton className="h-10 w-48" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full mt-6" />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <p className="text-muted-foreground">
          Here's an overview of your teaching materials and student progress
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <h3 className="text-2xl font-bold">{studentStats.total}</h3>
            </div>
            <Users className="h-8 w-8 text-edu-primary opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Students</p>
              <h3 className="text-2xl font-bold">{studentStats.active}</h3>
              <p className="text-xs text-muted-foreground">
                {Math.round((studentStats.active / studentStats.total) * 100)}% of total
              </p>
            </div>
            <div className="h-8 w-8 rounded-full bg-edu-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-edu-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Published Materials</p>
              <h3 className="text-2xl font-bold">{teachingMaterials.length}</h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-edu-secondary/20 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-edu-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg. Completion Rate</p>
              <h3 className="text-2xl font-bold">{studentStats.avgProgress}%</h3>
            </div>
            <div className="h-8 w-8 rounded-full bg-edu-accent/20 flex items-center justify-center">
              <BarChart className="h-5 w-5 text-edu-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Materials Performance</CardTitle>
              <CardDescription>
                Overview of your published materials and their engagement metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teachingMaterials.map((material) => (
                  <div
                    key={material.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4"
                  >
                    <div>
                      <h4 className="font-medium">{material.title}</h4>
                      <p className="text-sm text-muted-foreground">{material.subject}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Views</p>
                        <p className="font-medium">{material.views}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Completions</p>
                        <p className="font-medium">{material.completions}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Rating</p>
                        <p className="font-medium">{material.ratings}/5.0</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-2 flex justify-between">
                  <Button variant="outline" onClick={() => navigate("/materials")}>
                    <BookOpen className="h-4 w-4 mr-2" />
                    View All Materials
                  </Button>
                  <Button className="bg-edu-primary" onClick={() => navigate("/teacher/upload")}>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload New Material
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Student Progress</CardTitle>
              <CardDescription>
                Overall progress of your students across all materials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {subjectProgress.map((subject) => (
                  <div key={subject.subject_id}>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>{subject.subject_name}</span>
                      <span className="font-medium">{subject.completion_percentage}%</span>
                    </div>
                    <Progress value={subject.completion_percentage} className="h-2" />
                  </div>
                ))}
              </div>

              <Button 
                variant="outline" 
                className="mt-6 w-full" 
                onClick={() => navigate("/teacher/students")}
              >
                <Users className="h-4 w-4 mr-2" />
                View Student Details
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
              <CardDescription>Latest updates from your students</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div 
                      className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        activity.type === "quiz_completed"
                          ? "bg-edu-secondary/20"
                          : activity.type === "material_popular"
                          ? "bg-edu-primary/20" 
                          : activity.type === "student_joined"
                          ? "bg-edu-accent/20"
                          : "bg-muted"
                      }`}
                    >
                      {activity.type === "quiz_completed" && <FileText className="h-4 w-4 text-edu-secondary" />}
                      {activity.type === "material_popular" && <BookOpen className="h-4 w-4 text-edu-primary" />}
                      {activity.type === "student_joined" && <Users className="h-4 w-4 text-edu-accent" />}
                      {activity.type === "feedback_received" && <BarChart className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div>
                      <p className="text-sm">{activity.content}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks for teachers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => navigate("/upload")} className="bg-edu-primary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
                <Button variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Create Quiz
                </Button>
                <Button variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  View Analytics
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Message Students
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;