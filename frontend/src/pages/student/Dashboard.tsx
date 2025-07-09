// 1. Import all required modules
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { AreaChart, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";

// 2. Define TypeScript interfaces for API responses
interface Material {
  id: string;
  title: string;
  topic: string;
  type: 'PDF' | 'Video' | 'Interactive' | 'Article';
  progress?: number;
  thumbnail?: string;
  difficulty?: string;
}

interface Quiz {
  id: string;
  title: string;
  date: string;
  duration: string;
  questions: number;
}

interface UserProgress {
  weeklyGoal: number;
  completionRate: number;
  quizPerformance: number;
}

interface LearningStreak {
  current_streak: number;
  longest_streak: number;
  last_active: string | null;
}

const fetchRecommendedMaterials = async (token: string): Promise<Material[]> => {
  const response = await axios.get('http://localhost:5000/api/material/materials', {
    params: { limit: 4, sort: 'recommended' },
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

const fetchUpcomingQuizzes = async (token: string): Promise<Quiz[]> => {
  const response = await axios.get('http://localhost:5000/api/quiz/upcoming', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

const fetchUserProgress = async (userId: string, token: string): Promise<UserProgress> => {
  const response = await axios.get(`http://localhost:5000/api/progress/update`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data.data;
};

const fetchLearningStreak = async (userId: string, token: string): Promise<LearningStreak> => {
  const response = await axios.get(`http://localhost:5000/api/streak/${userId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

const logStudySession = async (userId: string, token: string) => {
  await axios.post(
    'http://localhost:5000/api/streak/update',
    {
      user_id: userId,
      duration: 45,
      material: "Chapter 5 - Trigonometry"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: recommendedMaterials, isLoading: materialsLoading } = useQuery({
    queryKey: ['recommendedMaterials'],
    queryFn: () => token ? fetchRecommendedMaterials(token) : Promise.resolve([]),
    enabled: !!token
  });

  const { data: upcomingQuizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: ['upcomingQuizzes'],
    queryFn: () => token ? fetchUpcomingQuizzes(token) : Promise.resolve([]),
    enabled: !!token
  });

  const { data: userProgress, isLoading: progressLoading } = useQuery({
    queryKey: ['userProgress', user?.id],
    queryFn: () => (user?.id && token) ? fetchUserProgress(user.id, token) : Promise.resolve(null),
    enabled: !!user?.id && !!token
  });

  const { data: learningStreak, isLoading: streakLoading } = useQuery({
    queryKey: ['learningStreak', user?.id],
    queryFn: () => (user?.id && token) ? fetchLearningStreak(user.id, token) : Promise.resolve(null),
    enabled: !!user?.id && !!token
  });

  const handleLogStudySession = async () => {
    if (user?.id && token) {
      await logStudySession(user.id, token);
      queryClient.invalidateQueries({ queryKey: ['learningStreak', user.id] });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (!user) return <div>Loading user data...</div>;

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Welcome, {user.name}!</h1>
        <p className="text-muted-foreground">Here's an overview of your learning progress</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Progress Overview</CardTitle>
            <CardDescription>Your overall learning progress</CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Weekly Goal</span>
                    <span className="font-medium">{userProgress?.weeklyGoal || 0}%</span>
                  </div>
                  <Progress value={userProgress?.weeklyGoal || 0} className="h-2" />
                </div>
              </div>
            )}
            <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => navigate("/progress")}> <BarChart className="h-4 w-4 mr-2" /> View Detailed Analytics </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Upcoming Quizzes</CardTitle>
            <CardDescription>Scheduled assessments</CardDescription>
          </CardHeader>
          <CardContent>
            {quizzesLoading ? (
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingQuizzes?.map((quiz) => (
                  <div key={quiz.id} className="border rounded-lg p-3 flex flex-col gap-1">
                    <div className="font-medium">{quiz.title}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(quiz.date)}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px]">{quiz.duration}</Badge>
                      <Badge variant="outline" className="text-[10px]">{quiz.questions} Questions</Badge>
                    </div>
                  </div>
                ))}
                {(!upcomingQuizzes || upcomingQuizzes.length === 0) && (
                  <p className="text-center text-muted-foreground text-sm py-8">No upcoming quizzes</p>
                )}
                <Button variant="outline" className="w-full mt-2" size="sm" onClick={() => navigate("/quizzes")}> View All Quizzes </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Learning Streak</CardTitle>
            <CardDescription>Your daily learning consistency</CardDescription>
          </CardHeader>
          <CardContent>
            {streakLoading ? (
              <div className="flex flex-col items-center justify-center py-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-24 mt-2" />
                <Skeleton className="h-20 w-full mt-4" />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-3">
                <div className="text-5xl font-bold text-edu-primary">{learningStreak?.current_streak || 0}</div>
                <div className="text-muted-foreground text-sm mt-1">Days in a row</div>
                <div className="grid grid-cols-7 gap-1 mt-4 w-full">
                  {[...Array(7)].map((_, i) => (
                    <div key={i} className={`aspect-square rounded-md flex items-center justify-center text-xs ${i < (learningStreak?.current_streak || 0) ? "bg-edu-primary text-white" : "bg-muted"}`}>{i + 1}</div>
                  ))}
                </div>
                <Button variant="outline" className="w-full mt-4" size="sm" onClick={handleLogStudySession}> <AreaChart className="h-4 w-4 mr-2" /> Log Study Session </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recommended Materials</h2>
          <Button variant="link" size="sm" onClick={() => navigate("/materials")}>View All</Button>
        </div>

        {materialsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="py-3 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-2 w-full mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendedMaterials?.map((material: Material) => (
              <Card key={material.id} className="overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/materials/${material.id}`)}>
                <div className="aspect-video bg-muted relative">
                  <img src={material.thumbnail || "/placeholder.svg"} alt={material.title} className="object-cover w-full h-full" />
                  <Badge className={`absolute top-2 right-2 ${material.type === "Video" ? "bg-edu-accent" : material.type === "Interactive" ? "bg-edu-secondary" : "bg-edu-primary"}`}>{material.type}</Badge>
                </div>
                <CardContent className="py-3">
                  <h3 className="font-medium truncate">{material.title}</h3>
                  <p className="text-xs text-muted-foreground">{material.topic}</p>
                  {(material.progress && material.progress > 0) && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{material.progress}%</span>
                      </div>
                      <Progress value={material.progress} className="h-1" />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
