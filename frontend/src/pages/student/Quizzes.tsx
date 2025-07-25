import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// Configure axios
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
axios.defaults.headers.common['Content-Type'] = 'application/json';

interface Quiz {
  id: string;
  title: string;
  subject: string;
  questions: number;
  timeLimit: number;
  dueDate: string;
  status: "upcoming" | "completed";
  score?: number;
}

interface ApiQuiz {
  id: number;
  topic: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: 'A' | 'B' | 'C' | 'D';
}

interface ApiQuizResult {
  id: number;
  user_email: string;
  topic: string;
  score: number;
  attempted_at: string;
}

const Quizzes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState({
    upcoming: true,
    completed: true,
    starting: false
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setError("");
        
        // Fetch all questions to use as upcoming quizzes
        const questionsResponse = await axios.get<{ data: ApiQuiz[] }>(
          "http://localhost:5000/api/quiz/questions",
          {
            headers: {
              'Cache-Control': 'no-cache'
            }
          }
        );
        
        if (!questionsResponse.data?.data) {
          throw new Error("Invalid questions data structure");
        }
        
        // Group questions by topic to create quizzes
        const questionsByTopic: Record<string, ApiQuiz[]> = {};
        questionsResponse.data.data.forEach(question => {
          if (!questionsByTopic[question.topic]) {
            questionsByTopic[question.topic] = [];
          }
          questionsByTopic[question.topic].push(question);
        });

        // Create upcoming quizzes from the grouped questions
        const upcomingQuizzes = Object.entries(questionsByTopic).map(([topic, questions]) => ({
          id: `topic-${topic}`,
          title: topic,
          subject: "General",
          questions: questions.length,
          timeLimit: 30,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          status: "upcoming" as const,
        }));

        let completedQuizzes: Quiz[] = [];
        if (user?.email) {
          // Fetch completed quizzes
          const completedResponse = await axios.get<{ data: ApiQuizResult[] }>(
            `/api/quiz/results/${encodeURIComponent(user.email)}`
          );
          
          if (completedResponse.data?.data) {            
            completedQuizzes = completedResponse.data.data.map((result) => ({
              id: `completed-${result.id}`,
              title: result.topic,
              subject: "General",
              questions: 10,
              timeLimit: 30,
              dueDate: result.attempted_at,
              status: "completed" as const,
              score: result.score,
            }));
          }
        }

        setQuizzes([...upcomingQuizzes, ...completedQuizzes]);
      } catch (err) {
        const message = axios.isAxiosError(err) 
          ? err.response?.data?.message || err.message
          : "Failed to fetch quizzes";
        setError(message);
        console.error("Fetch error:", err);
      } finally {
        setLoading(prev => ({ ...prev, upcoming: false, completed: false }));
      }
    };

    fetchQuizzes();
  }, [user?.email]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const startQuiz = async (quizId: string) => {
    try {
      setLoading(prev => ({ ...prev, starting: true }));
      setError("");
      
      const topic = quizId.replace('topic-', '');
      const response = await axios.get(`http://localhost:5000/api/quiz/questions/${topic}`);
      
      if (!response.data?.data) {
        throw new Error("Invalid questions data structure");
      }

      navigate(`/quizzes/${topic}`, { 
        state: { questions: response.data.data }
      });
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : "Failed to start quiz";
      setError(message);
      console.error("Quiz start error:", err);
    } finally {
      setLoading(prev => ({ ...prev, starting: false }));
    }
  };

  const viewResults = async (quizId: string) => {
    try {
      const resultId = quizId.replace('completed-', '');
      navigate(`/results/${resultId}`);
    } catch (err) {
      setError("Failed to load results. Please try again.");
      console.error("Results error:", err);
    }
  };

  const upcomingQuizzes = quizzes.filter(quiz => quiz.status === "upcoming");
  const completedQuizzes = quizzes.filter(quiz => quiz.status === "completed");

  if (loading.upcoming || loading.completed) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading quizzes...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-red-500 text-lg">{error}</p>
        <Button 
          variant="outline"
          onClick={() => {
            setError("");
            setLoading({ upcoming: true, completed: true, starting: false });
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Quizzes</h1>
        <p className="text-muted-foreground">Take assessments and view your results</p>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-4">Upcoming Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge variant="outline" className="ml-2">
                      {quiz.subject}
                    </Badge>
                  </div>
                  <CardDescription>
                    Due: {formatDate(quiz.dueDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{quiz.questions} Questions</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{quiz.timeLimit} min</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full bg-edu-primary hover:bg-edu-primary/90"
                    onClick={() => startQuiz(quiz.id)}
                    disabled={loading.starting}
                  >
                    {loading.starting ? "Loading..." : "Start Quiz"}
                  </Button>
                </CardContent>
              </Card>
            ))}

            {upcomingQuizzes.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No upcoming quizzes available
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Completed Quizzes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedQuizzes.map(quiz => (
              <Card key={quiz.id} className="hover:shadow-md transition-all">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    <Badge className="ml-2 bg-green-100 text-green-800">
                      {quiz.score}%
                    </Badge>
                  </div>
                  <CardDescription>
                    Completed: {formatDate(quiz.dueDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <div className="flex items-center">
                      <FileText className="h-4 w-4 mr-1" />
                      <span>{quiz.questions} Questions</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-green-600">Completed</span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => viewResults(quiz.id)}
                  >
                    View Results
                  </Button>
                </CardContent>
              </Card>
            ))}

            {completedQuizzes.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">
                No completed quizzes
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Quizzes;