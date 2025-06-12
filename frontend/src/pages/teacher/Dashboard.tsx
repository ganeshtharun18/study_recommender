
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { BarChart, Users, BookOpen, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

// Sample mock data for teacher dashboard
const MOCK_STUDENT_STATS = {
  total: 78,
  active: 64,
  avgProgress: 72,
};

const MOCK_TEACHING_MATERIALS = [
  {
    id: "tm1",
    title: "Advanced Calculus Guide",
    subject: "Mathematics",
    views: 345,
    completions: 128,
    ratings: 4.7,
  },
  {
    id: "tm2",
    title: "Python Programming Handbook",
    subject: "Computer Science",
    views: 562,
    completions: 213,
    ratings: 4.9,
  },
  {
    id: "tm3",
    title: "Organic Chemistry Principles",
    subject: "Chemistry",
    views: 289,
    completions: 98,
    ratings: 4.5,
  },
];

const MOCK_RECENT_ACTIVITIES = [
  {
    id: "a1",
    type: "quiz_completed",
    content: "12 students completed 'Introduction to AI' quiz",
    time: "2 hours ago",
  },
  {
    id: "a2",
    type: "material_popular",
    content: "'Database Design' has become your most viewed material",
    time: "1 day ago",
  },
  {
    id: "a3",
    type: "student_joined",
    content: "5 new students enrolled in your courses",
    time: "2 days ago",
  },
  {
    id: "a4",
    type: "feedback_received",
    content: "New feedback on 'Web Development' material",
    time: "3 days ago",
  },
];

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
              <h3 className="text-2xl font-bold">{MOCK_STUDENT_STATS.total}</h3>
            </div>
            <Users className="h-8 w-8 text-edu-primary opacity-80" />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Students</p>
              <h3 className="text-2xl font-bold">{MOCK_STUDENT_STATS.active}</h3>
              <p className="text-xs text-muted-foreground">
                {Math.round((MOCK_STUDENT_STATS.active / MOCK_STUDENT_STATS.total) * 100)}% of total
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
              <h3 className="text-2xl font-bold">{MOCK_TEACHING_MATERIALS.length}</h3>
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
              <h3 className="text-2xl font-bold">{MOCK_STUDENT_STATS.avgProgress}%</h3>
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
                {MOCK_TEACHING_MATERIALS.map((material) => (
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
                  <Button className="bg-edu-primary" onClick={() => navigate("/upload")}>
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
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Mathematics</span>
                    <span className="font-medium">83%</span>
                  </div>
                  <Progress value={83} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Computer Science</span>
                    <span className="font-medium">76%</span>
                  </div>
                  <Progress value={76} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Chemistry</span>
                    <span className="font-medium">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Physics</span>
                    <span className="font-medium">58%</span>
                  </div>
                  <Progress value={58} className="h-2" />
                </div>
              </div>

              <Button 
                variant="outline" 
                className="mt-6 w-full" 
                onClick={() => navigate("/students")}
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
                {MOCK_RECENT_ACTIVITIES.map((activity) => (
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
