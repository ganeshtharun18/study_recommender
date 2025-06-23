import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart, Users, BookOpen, FileText, Upload, X, Trash2 } from "lucide-react";
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

interface QuizQuestion {
  id?: string;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
}

const TeacherDashboard = () => {
  const { user, logout, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [studentStats, setStudentStats] = useState<StudentStats>({ 
    total: 0, 
    active: 0, 
    avgProgress: 0 
  });
  const [teachingMaterials, setTeachingMaterials] = useState<TeachingMaterial[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [subjectProgress, setSubjectProgress] = useState<SubjectProgress[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<QuizQuestion | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Ensure we have a valid session
        const isSessionValid = await refreshSession();
        if (!isSessionValid) {
          throw new Error("Session expired. Please login again.");
        }

        const api = axios.create({
          baseURL: '/api',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        api.interceptors.request.use(async (config) => {
          // The auth header will be added by the request interceptor in AuthContext
          return config;
        });

        api.interceptors.response.use(
          response => response,
          async error => {
            if (error.response?.status === 401) {
              // Try to refresh the session once
              const refreshed = await refreshSession();
              if (!refreshed) {
                logout();
                navigate('/login');
                return Promise.reject(new Error("Session expired"));
              }
              // Retry the original request
              return api(error.config);
            }
            return Promise.reject(error);
          }
        );

        const [materialsRes, studentsRes, activitiesRes, progressRes] = await Promise.all([
          api.get('/material/materials').catch(() => ({ data: [] })),
          api.get('/auth/students').catch(() => ({ data: [] })),
          api.get('/progress/recent-activities').catch(() => ({ data: [] })),
          api.get('/progress/subject-progress').catch(() => ({ data: [] }))
        ]);

        // Handle materials response - added null checks and default values
        const materialsData = Array.isArray(materialsRes.data?.data) ? materialsRes.data.data : [];
        setTeachingMaterials(materialsData.map((mat: any) => ({
          id: mat.id || '',
          title: mat.title || 'Untitled',
          subject: mat.subject_id || 'General',
          views: mat.views || 0,
          completions: mat.completions || 0,
          ratings: mat.ratings || 0
        })));

        // Handle students response - added Array.isArray check
        const studentsData = Array.isArray(studentsRes.data) ? studentsRes.data : [];
        const progressData = Array.isArray(progressRes.data) ? progressRes.data : [];
        
        const totalStudents = studentsData.length;
        const activeStudents = studentsData.filter((s: any) => s?.active).length;
        const avgProgress = progressData.length > 0 
          ? progressData.reduce((acc: number, curr: any) => 
              acc + (curr?.completion_percentage || 0), 0) / progressData.length
          : 0;

        setStudentStats({
          total: totalStudents,
          active: activeStudents,
          avgProgress: Math.round(avgProgress)
        });

        // Handle progress data - added null checks
        setSubjectProgress(progressData.map((item: any) => ({
          subject_id: item.subject_id || '',
          subject_name: item.subject_name || 'Unknown Subject',
          total_materials: item.total_materials || 0,
          completed_materials: item.completed_materials || 0,
          completion_percentage: item.completion_percentage || 0
        })));

        // Handle activities data - added null checks
        const activitiesData = Array.isArray(activitiesRes.data) ? activitiesRes.data : [];
        setRecentActivities(activitiesData.map((act: any) => ({
          id: act.id || '',
          type: act.type || 'activity',
          content: act.content || 'No content',
          time: act.time || 'Just now'
        })));

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error instanceof Error) {
          if (error.message.includes("Session expired")) {
            setError("Authentication required. Please login again.");
            logout();
            navigate('/login');
          } else {
            setError("Failed to load dashboard data. Please try again later.");
          }
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [navigate, logout, refreshSession]);

  const handleRefresh = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleGenerateQuestion = async () => {
    try {
      if (!quizTopic) {
        setQuizError('Please enter a topic first');
        return;
      }

      setIsGenerating(true);
      setQuizError(null);
      
      const api = axios.create({
        baseURL: '/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await api.post('http://localhost:5000/api/quiz/generate', { topic: quizTopic });
      setGeneratedQuestion(response.data.data);
      
    } catch (error) {
      console.error("Error generating question:", error);
      setQuizError("Failed to generate question. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddGeneratedQuestion = () => {
    if (generatedQuestion) {
      setQuizQuestions([...quizQuestions, generatedQuestion]);
      setGeneratedQuestion(null);
    }
  };

  const handleSaveQuiz = async () => {
    try {
      if (quizQuestions.length === 0) {
        setQuizError('Please add at least one question');
        return;
      }

      setQuizError(null);
      
      const api = axios.create({
        baseURL: '/api',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Save each question to the backend
      await Promise.all(
        quizQuestions.map(question => 
          api.post('/quiz/add', question)
      ));

      // Reset form
      setQuizQuestions([]);
      setQuizTopic('');
      setQuizDialogOpen(false);
      
      // Show success message
      setError(null); // Clear any previous errors
      alert('Quiz saved successfully!');
      
    } catch (error) {
      console.error("Error saving quiz:", error);
      setQuizError("Failed to save quiz. Please try again.");
    }
  };

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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Error Loading Dashboard</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleRefresh}>Refresh Page</Button>
          {error.includes("Authentication required") && (
            <Button onClick={() => navigate('/login')}>Go to Login</Button>
          )}
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
                {studentStats.total > 0 
                  ? `${Math.round((studentStats.active / studentStats.total) * 100)}% of total`
                  : 'No students'}
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
                {teachingMaterials.length > 0 ? (
                  teachingMaterials.map((material) => (
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
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No teaching materials found
                  </p>
                )}

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
                {subjectProgress.length > 0 ? (
                  subjectProgress.map((subject) => (
                    <div key={subject.subject_id}>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>{subject.subject_name}</span>
                        <span className="font-medium">{subject.completion_percentage}%</span>
                      </div>
                      <Progress value={subject.completion_percentage} className="h-2" />
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No progress data available
                  </p>
                )}
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
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity) => (
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
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No recent activities
                  </p>
                )}
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
                <Button onClick={() => navigate("/teacher/upload")} className="bg-edu-primary">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Material
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setQuizDialogOpen(true)}
                >
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

      {/* Quiz Creation Dialog */}
      {quizDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Create New Quiz</h2>
              <button 
                onClick={() => {
                  setQuizDialogOpen(false);
                  setQuizQuestions([]);
                  setQuizTopic('');
                  setQuizError(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quiz Topic</label>
                <input
                  type="text"
                  value={quizTopic}
                  onChange={(e) => setQuizTopic(e.target.value)}
                  className="w-full p-2 border rounded"
                  placeholder="Enter quiz topic (e.g., Algebra, History)"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleGenerateQuestion}
                  disabled={isGenerating || !quizTopic}
                  className="bg-edu-primary"
                >
                  {isGenerating ? 'Generating...' : 'Generate Question'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/quiz/questions")}
                >
                  View Existing Questions
                </Button>
              </div>

              {quizError && (
                <div className="text-red-500 text-sm">{quizError}</div>
              )}

              {generatedQuestion && (
                <div className="border p-4 rounded-lg">
                  <h3 className="font-medium mb-2">Generated Question</h3>
                  <p className="mb-2">{generatedQuestion.question}</p>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="flex items-center">
                      <span className="font-medium mr-2">A:</span>
                      <span>{generatedQuestion.option_a}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">B:</span>
                      <span>{generatedQuestion.option_b}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">C:</span>
                      <span>{generatedQuestion.option_c}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium mr-2">D:</span>
                      <span>{generatedQuestion.option_d}</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    Correct answer: {generatedQuestion.correct_option}
                  </p>
                  <Button 
                    onClick={handleAddGeneratedQuestion}
                    className="mt-3"
                    size="sm"
                  >
                    Add to Quiz
                  </Button>
                </div>
              )}

              {quizQuestions.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Quiz Questions ({quizQuestions.length})</h3>
                  <div className="space-y-3">
                    {quizQuestions.map((q, index) => (
                      <div key={index} className="border p-3 rounded">
                        <div className="flex justify-between">
                          <p className="font-medium">Q{index + 1}: {q.question}</p>
                          <button 
                            onClick={() => setQuizQuestions(quizQuestions.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-1 text-sm">
                          <div>A: {q.option_a}</div>
                          <div>B: {q.option_b}</div>
                          <div>C: {q.option_c}</div>
                          <div>D: {q.option_d}</div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Correct: {q.correct_option}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setQuizDialogOpen(false);
                    setQuizQuestions([]);
                    setQuizTopic('');
                    setQuizError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveQuiz}
                  disabled={quizQuestions.length === 0}
                  className="bg-edu-primary"
                >
                  Save Quiz
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;