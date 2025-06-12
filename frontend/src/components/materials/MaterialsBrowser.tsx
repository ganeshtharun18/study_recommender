import React, { useEffect, useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from 'react-error-boundary';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

// Type definitions
type Material = {
  id: number;
  title: string;
  topic: string;
  type: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  url: string;
  uploaded_by: string;
  uploaded_at: string;
};

type YouTubeVideo = {
  videoId: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
};

type QuizQuestion = {
  id: string;
  topic: string;
  question: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'a' | 'b' | 'c' | 'd';
};

type QuizAnswer = {
  id: string;
  answer: string;
};

type QuizSubmission = {
  topic: string;
  answers: QuizAnswer[];
};

type QuizResult = {
  correct: number;
  total: number;
  percentage: number;
};

type ApiResponse<T> = {
  data?: T;
  count?: number;
  error?: string;
  success?: boolean;
};

const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="p-4 space-y-3 bg-red-50 rounded-lg border border-red-200">
    <h3 className="text-red-600 font-medium">Something went wrong</h3>
    <p className="text-sm text-red-500">{error.message}</p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        Try Again
      </Button>
      <Button variant="ghost" size="sm" onClick={() => window.location.reload()}>
        Refresh Page
      </Button>
    </div>
  </div>
);

const MaterialsBrowser = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState({
    materials: true,
    recommendations: false,
    videos: false,
    quiz: false,
    submission: false
  });
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, materials: true }));
      setError(null);
      
      const apiUrl = import.meta.env.DEV 
        ? 'http://localhost:5000/api/material/materials' 
        : '/api/material/materials';

      const response = await axios.get(apiUrl, {
        headers: {
          'Accept': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      let materialsData = response.data.data || response.data;
      
      if (!Array.isArray(materialsData)) {
        throw new Error('Invalid materials data format: expected array');
      }

      const validatedMaterials = materialsData.map(item => ({
        id: item.id || 0,
        title: item.title || 'Untitled',
        topic: item.topic || 'General',
        type: item.type || 'PDF',
        difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) 
          ? item.difficulty 
          : 'Medium',
        url: isValidUrl(item.url) ? item.url : '#',
        uploaded_by: item.uploaded_by || 'Unknown',
        uploaded_at: item.uploaded_at || new Date().toISOString()
      }));

      setMaterials(validatedMaterials);
    } catch (err) {
      const error = err as AxiosError | Error;
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message || error.message
        : error.message;
      
      setError(message);
      console.error('API Error:', error);
    } finally {
      setLoading(prev => ({ ...prev, materials: false }));
    }
  }, []);

  const fetchRecommendations = useCallback(async (topic: string) => {
    try {
      setLoading(prev => ({ ...prev, recommendations: true }));
      setError(null);
      
      const baseUrl = import.meta.env.DEV 
        ? 'http://localhost:5000' 
        : '';
      
      const { data } = await axios.post<ApiResponse<string[]>>(
        `${baseUrl}/api/recommend/`, 
        { topic },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );
      
      const recs = data?.data ? data.data.map(item => 
        typeof item === 'string' ? item : JSON.stringify(item)
      ) : [];
      
      setRecommendations(recs);
    } catch (err) {
      console.error('Recommendation error:', err);
      toast.warning('Could not load recommendations');
      setRecommendations([]);
    } finally {
      setLoading(prev => ({ ...prev, recommendations: false }));
    }
  }, []);

  const fetchYouTubeVideos = useCallback(async (topic: string) => {
    try {
      setLoading(prev => ({ ...prev, videos: true }));
      setYoutubeVideos([]);
      
      const baseUrl = import.meta.env.DEV 
        ? 'http://localhost:5000' 
        : '';

      const response = await axios.get(`${baseUrl}/api/youtube/search`, {
        params: { 
          topic: topic.trim(),
          maxResults: 10
        },
        headers: {
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      console.log('YouTube API raw response:', response.data);

      if (typeof response.data === 'string' && response.data.includes('<!DOCTYPE html>')) {
        throw new Error('YouTube API returned HTML instead of JSON. Check backend service.');
      }

      const responseData = response.data?.items || response.data?.data || response.data;
      
      if (!responseData) {
        throw new Error('YouTube API returned empty response');
      }

      if (!Array.isArray(responseData)) {
        throw new Error('YouTube API response is not an array');
      }

      const validatedVideos = responseData
        .map((item: any) => {
          try {
            if (!item?.id?.videoId && !item?.videoId) {
              console.warn('Skipping video - missing videoId:', item);
              return null;
            }

            const videoId = item.id?.videoId || item.videoId;
            const snippet = item.snippet || item;
            
            return {
              videoId,
              title: snippet.title || 'Untitled Video',
              thumbnail: snippet.thumbnails?.high?.url || 
                       snippet.thumbnail ||
                       `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
              channelTitle: snippet.channelTitle || 'Unknown Channel'
            };
          } catch (e) {
            console.warn('Error processing video item:', item, e);
            return null;
          }
        })
        .filter(Boolean);

      if (validatedVideos.length === 0) {
        throw new Error('YouTube API response contained no valid videos');
      }

      setYoutubeVideos(validatedVideos);
      toast.success(`Found ${validatedVideos.length} videos`);
    } catch (err) {
      const error = err as Error;
      console.error('YouTube fetch error:', error);
      toast.error(`Failed to load videos: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, videos: false }));
    }
  }, []);

// In your fetchQuizQuestions function:

const fetchQuizQuestions = useCallback(async (topic: string) => {
  try {
    setLoading(prev => ({ ...prev, quiz: true }));
    setAnswers({});
    setScore(null);

    const response = await axios.get(
      `http://localhost:5000/api/quiz/questions/${encodeURIComponent(topic)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        validateStatus: (status) => status < 500 // Don't throw for 4xx errors
      }
    );

    console.log("Full API response:", {
      status: response.status,
      data: response.data,
      headers: response.headers
    });

    // Handle non-success status codes
    if (response.status !== 200 || !response.data) {
      throw new Error(
        response.data?.error || 
        `Request failed with status ${response.status}`
      );
    }

    // Check for success flag if your API uses it
    if (response.data.success === false) {
      throw new Error(response.data.error || 'API returned unsuccessful');
    }

    // Transform data - add your transformation logic here
    const questions = response.data.data || response.data; // Handle both formats
    
    if (!Array.isArray(questions)) {
      throw new Error('Expected array of questions');
    }

    const validatedQuestions = questions.map(question => ({
      id: question.id || Math.random().toString(36).substring(2, 9),
      topic: question.topic || topic,
      question: question.question || 'No question text',
      options: {
        a: question.options?.a || question.option_a || 'Option A',
        b: question.options?.b || question.option_b || 'Option B',
        c: question.options?.c || question.option_c || 'Option C',
        d: question.options?.d || question.option_d || 'Option D'
      },
      correctAnswer: ['a', 'b', 'c', 'd'].includes(question.correctAnswer?.toLowerCase())
        ? question.correctAnswer.toLowerCase() as 'a' | 'b' | 'c' | 'd'
        : 'a'
    }));

    setQuizQuestions(validatedQuestions);
    toast.success(`Loaded ${validatedQuestions.length} questions`);

  } catch (err) {
    const error = err as Error | AxiosError;
    
    let errorMessage = 'Failed to load quiz';
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.error || 
                    error.response?.data?.message || 
                    error.message;
      console.error('API error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
    } else {
      errorMessage = error.message;
    }
    
    console.error('Quiz fetch error:', error);
    toast.error(errorMessage);
    setQuizQuestions([]);
  } finally {
    setLoading(prev => ({ ...prev, quiz: false }));
  }
}, []);

  const handleAnswerSelect = useCallback((questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  }, []);


    const submitQuiz = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, submission: true }));
      
      // Validate all questions are answered
      if (Object.keys(answers).length !== quizQuestions.length) {
        throw new Error('Please answer all questions before submitting');
      }

      const submissionData: QuizSubmission = {
        topic: selectedTopic,
        answers: Object.entries(answers).map(([id, answer]) => ({
          id,
          answer
        }))
      };

      const { data } = await axios.post<ApiResponse<{ correct: number }>>(
        'https://localhost:5000/api/quiz/submit',
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!data?.success || typeof data.data?.correct !== 'number') {
        throw new Error(data?.error || 'Invalid response from server');
      }

      const quizResult: QuizResult = {
        correct: data.data.correct,
        total: quizQuestions.length,
        percentage: Math.round((data.data.correct / quizQuestions.length) * 100)
      };

      setScore(quizResult);
      
      toast.success('Quiz submitted!', {
        description: `You scored ${quizResult.correct}/${quizResult.total} (${quizResult.percentage}%)`,
        action: {
          label: 'View Details',
          onClick: () => console.log('Quiz results:', quizResult)
        }
      });
    } catch (err) {
      const error = err as AxiosError | Error;
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error || error.message
        : error.message;
      
      console.error('Quiz submission error:', error);
      toast.error('Submission failed', {
        description: message
      });
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  }, [answers, selectedTopic, quizQuestions.length]);

  const handleQuizSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await submitQuiz();
  }, [submitQuiz]);


  const handleMaterialSelect = useCallback((topic: string) => {
    setSelectedTopic(topic);
    setAnswers({});
    setScore(null);
    
    fetchRecommendations(topic);
    fetchYouTubeVideos(topic);
    fetchQuizQuestions(topic);
  }, [fetchRecommendations, fetchYouTubeVideos, fetchQuizQuestions]);
  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  if (loading.materials) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <div className="flex space-x-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 space-y-3">
        <div className="text-red-600 font-medium">Error loading materials</div>
        <p className="text-sm text-gray-600">{error}</p>
        <Button onClick={fetchMaterials}>
          Retry
        </Button>
      </div>
    );
  }

  if (materials.length === 0) {
    return (
      <div className="p-4 text-center space-y-3">
        <p className="text-gray-500">No study materials available yet.</p>
        <Button onClick={fetchMaterials}>
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <ErrorBoundary 
      FallbackComponent={ErrorFallback}
      onReset={() => {
        setError(null);
        fetchMaterials();
      }}
    >
      <div className="space-y-6 p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Study Materials</h2>
          <Button 
            variant="outline" 
            onClick={fetchMaterials}
            disabled={loading.materials}
          >
            {loading.materials ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {materials.map(material => (
            <Card key={material.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {material.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="px-2 py-1 bg-secondary rounded-full text-xs">
                      {material.topic}
                    </span>
                    <span>•</span>
                    <span>{material.type}</span>
                    <span>•</span>
                    <span>{material.difficulty}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  {material.url && (
                    <a 
                      href={material.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex-1"
                    >
                      <Button variant="outline" className="w-full">
                        View
                      </Button>
                    </a>
                  )}
                  <Button 
                    onClick={() => handleMaterialSelect(material.topic)}
                    disabled={loading.recommendations || loading.videos}
                    className="flex-1"
                  >
                    Explore Topic
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedTopic && (
          <div className="space-y-8 mt-8">
            <section className="space-y-4">
              <h3 className="text-xl font-semibold">
                Recommendations for {selectedTopic}
              </h3>
              {loading.recommendations ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-4 w-full" />
                  ))}
                </div>
              ) : recommendations.length > 0 ? (
                <ul className="space-y-2 pl-5 list-disc">
                  {recommendations.map((rec, index) => (
                    <li key={index} className="text-sm">
                      {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No recommendations available for this topic
                </p>
              )}
            </section>

            <section className="space-y-4">
              <h3 className="text-xl font-semibold">
                Video Lectures on {selectedTopic}
              </h3>
              {loading.videos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-lg" />
                  ))}
                </div>
              ) : youtubeVideos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {youtubeVideos.map(video => (
                    <Card key={video.videoId} className="overflow-hidden">
                      <div className="relative aspect-video">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
                          }}
                        />
                      </div>
                      <CardContent className="p-4 space-y-2">
                        <h4 className="font-medium line-clamp-2 text-sm">
                          {video.title}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {video.channelTitle}
                        </p>
                        <a
                          href={`https://youtube.com/watch?v=${video.videoId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block"
                        >
                          <Button size="sm" className="mt-2">
                            Watch
                          </Button>
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-red-600"
                    >
                      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                      <path d="M12 4v1M18 6l-.7.7M20 12h-1M18 18l-.7-.7M12 19v1M7.3 18l-.7.7M6 12H5M7.3 6l-.7-.7" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">No videos found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We couldn't find any videos about "{selectedTopic}"
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => fetchYouTubeVideos(selectedTopic)}>
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">
                  {selectedTopic} Quiz
                </h3>
                {quizQuestions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {Math.round((Object.keys(answers).length / quizQuestions.length) * 100)}% completed
                    </span>
                    {score && (
                      <span className="text-sm font-medium px-2 py-1 bg-green-50 text-green-600 rounded-full">
                        Score: {score.correct}/{score.total}
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              {loading.quiz ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3 p-4 border rounded-lg">
                      <Skeleton className="h-5 w-3/4" />
                      <div className="space-y-2">
                        {[...Array(4)].map((_, j) => (
                          <Skeleton key={j} className="h-4 w-full" />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : quizQuestions.length > 0 ? (
                <form onSubmit={handleQuizSubmit} className="space-y-4">
                  {quizQuestions.map(question => (
                    <div key={question.id} className="p-4 border rounded-lg space-y-3">
                      <p className="font-medium">
                        {question.question}
                      </p>
                      <div className="space-y-2">
                        {Object.entries(question.options).map(([key, value]) => (
                          <label key={key} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-md">
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={key}
                              checked={answers[question.id] === key}
                              onChange={() => handleAnswerSelect(question.id, key)}
                              disabled={loading.submission}
                              className="h-4 w-4 text-primary focus:ring-primary border-gray-300"
                            />
                            <span className="text-sm">
                              <span className="font-medium">{key.toUpperCase()}.</span> {value}
                            </span>
                            {score && question.correctAnswer === key && (
                              <span className="ml-auto text-xs font-medium text-green-600">
                                Correct Answer
                              </span>
                            )}
                            {score && answers[question.id] === key && question.correctAnswer !== key && (
                              <span className="ml-auto text-xs font-medium text-red-600">
                                Your Answer
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4">
                    {score ? (
                      <div className="space-y-1">
                        <p className={`text-lg font-bold ${
                          score.percentage >= 70 ? 'text-green-600' : 
                          score.percentage >= 50 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          Final Score: {score.percentage}%
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {score.correct} correct out of {score.total} questions
                        </p>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {Object.keys(answers).length}/{quizQuestions.length} questions answered
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      disabled={
                        loading.submission || 
                        Object.keys(answers).length !== quizQuestions.length
                      }
                      className="min-w-[120px]"
                    >
                      {loading.submission ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Grading...
                        </>
                      ) : 'Submit Quiz'}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/50">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6 text-blue-600"
                    >
                      <path d="M14 19a6 6 0 0 0-12 0" />
                      <circle cx="8" cy="9" r="4" />
                      <path d="M22 19a6 6 0 0 0-6-6 4 4 0 1 0 0-8" />
                    </svg>
                  </div>
                  <h3 className="mt-3 text-sm font-medium">No quiz available</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    We couldn't find any quiz questions for "{selectedTopic}"
                  </p>
                  <div className="mt-4">
                    <Button onClick={() => fetchQuizQuestions(selectedTopic)}>
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default MaterialsBrowser;