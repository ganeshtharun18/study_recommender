import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Clock, FileText, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";

interface Student {
  id: string;
  name: string;
  email: string;
  created_at: string;
  last_activity?: string;
  materials_accessed?: number;
  materials_completed?: number;
  completion_percentage?: number;
  total_materials?: number;
}

interface DashboardStats {
  overview: {
    total_students: number;
    total_subjects: number;
    total_materials: number;
    avg_completion: number;
  };
  top_subjects: {
    id: string;
    name: string;
    total_materials: number;
    completed: number;
    completion_rate: number;
  }[];
  recent_students: Student[];
}

interface ProgressStats {
  total_materials: number;
  total_accessed: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_percentage: number;
}

interface StudentsResponse {
  students: Student[];
  pagination: {
    total: number;
    total_pages: number;
  };
}

const StudentsDashboard = () => {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Fetch dashboard stats (for teachers)
  const { data: dashboardStats, isLoading: statsLoading, error: statsError } = useQuery<DashboardStats>({
    queryKey: ["teacherDashboardStats"],
    queryFn: async () => {
      console.log("Fetching dashboard stats...");
      try {
        const response = await api.getDashboardStats();
        console.log("Raw dashboard stats response:", response);
        
        const transformedData = {
          overview: {
            total_students: response.overview.total_students,
            total_subjects: response.overview.total_subjects,
            total_materials: response.overview.total_materials,
            avg_completion: parseFloat(response.overview.avg_completion.toString()) || 0,
          },
          top_subjects: response.top_subjects.map(subject => ({
            ...subject,
            completed: parseInt(subject.completed.toString()) || 0,
            total_materials: parseInt(subject.total_materials.toString()) || 0,
            completion_rate: parseFloat(subject.completion_rate.toString()) || 0,
          })),
          recent_students: response.recent_students.map(student => ({
            ...student,
            materials_accessed: parseInt(student.materials_accessed?.toString() || '0') || 0,
            materials_completed: parseInt(student.materials_completed?.toString() || '0') || 0,
            completion_percentage: parseFloat(student.completion_percentage?.toString() || '0') || 0,
            total_materials: parseInt(student.total_materials?.toString() || '0') || 0,
          }))
        };

        console.log("Transformed dashboard stats:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        throw error;
      }
    },
    enabled: role === "teacher",
    onError: (error) => {
      console.error("Dashboard stats query error:", error);
    },
    onSuccess: (data) => {
      console.log("Dashboard stats loaded successfully:", data);
    }
  });

  // Fetch students list
  const { 
    data: studentsData, 
    isLoading: studentsLoading,
    isError,
    error
  } = useQuery<StudentsResponse>({
    queryKey: ["students", page, perPage, searchQuery],
    queryFn: async () => {
      console.log("Fetching students list...");
      try {
        const response = await api.getStudents(page, perPage, searchQuery);
        console.log("Raw students response:", response);
        
        const transformedData = {
          students: response.students.map(student => ({
            ...student,
            materials_accessed: parseInt(student.materials_accessed?.toString() || '0') || 0,
            materials_completed: parseInt(student.materials_completed?.toString() || '0') || 0,
            completion_percentage: parseFloat(student.completion_percentage?.toString() || '0') || 0,
            total_materials: parseInt(student.total_materials?.toString() || '0') || 0,
          })),
          pagination: response.pagination
        };

        console.log("Transformed students data:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("Error fetching students:", error);
        throw error;
      }
    },
    keepPreviousData: true,
    onError: (error) => {
      console.error("Students query error:", error);
    },
    onSuccess: (data) => {
      console.log("Students loaded successfully:", data);
    }
  });

  // Handle errors
  useEffect(() => {
    if (isError) {
      console.error("Students loading error:", error);
      toast({
        title: "Error loading students",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [isError, error, toast]);

  useEffect(() => {
    if (statsError) {
      console.error("Dashboard stats loading error:", statsError);
      toast({
        title: "Error loading dashboard stats",
        description: statsError instanceof Error ? statsError.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [statsError, toast]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never active";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleViewStudent = (student: Student) => {
    console.log("Viewing student:", student);
    setSelectedStudent(student);
  };

  const handleBackToList = () => {
    console.log("Returning to student list");
    setSelectedStudent(null);
  };

  if (studentsLoading || (role === "teacher" && statsLoading)) {
    console.log("Loading data...");
    return <LoadingSkeleton />;
  }

  if (selectedStudent) {
    console.log("Rendering student detail view for:", selectedStudent);
    return (
      <StudentDetailView 
        student={selectedStudent} 
        onBack={handleBackToList} 
      />
    );
  }

  console.log("Rendering main dashboard view");
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground">
            {role === "teacher" 
              ? "Track and manage your students' progress" 
              : "View your learning progress"}
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-10 w-[250px]"
            value={searchQuery}
            onChange={(e) => {
              console.log("Search query changed:", e.target.value);
              setSearchQuery(e.target.value);
            }}
          />
        </div>
      </div>

      {role === "teacher" && dashboardStats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              title="Total Students" 
              value={dashboardStats.overview.total_students} 
              icon={<User className="h-5 w-5" />}
            />
            <StatCard 
              title="Subjects" 
              value={dashboardStats.overview.total_subjects} 
              icon={<BookOpen className="h-5 w-5" />}
            />
            <StatCard 
              title="Study Materials" 
              value={dashboardStats.overview.total_materials} 
              icon={<FileText className="h-5 w-5" />}
            />
            <StatCard 
              title="Avg Completion" 
              value={`${dashboardStats.overview.avg_completion.toFixed(1)}%`} 
              icon={<div className="h-5 w-5 rounded-full bg-green-500" />}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopSubjectsCard subjects={dashboardStats.top_subjects} />
            <RecentStudentsCard students={dashboardStats.recent_students} />
          </div>
        </>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>
                {role === "teacher" ? "Students Overview" : "Your Progress"}
              </CardTitle>
              <CardDescription>
                {role === "teacher" 
                  ? "All students enrolled in your courses" 
                  : "Your learning progress and activity"}
              </CardDescription>
            </div>
            {role === "teacher" && (
              <Button variant="outline" className="gap-2">
                <Mail className="h-4 w-4" />
                Email All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="hidden md:table-cell">Materials</TableHead>
                <TableHead className="hidden md:table-cell">Completed</TableHead>
                <TableHead className="hidden lg:table-cell">Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsData?.students?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Progress 
                        value={student.completion_percentage || 0} 
                        className="h-2 w-24" 
                      />
                      <span className="text-sm font-medium w-12">
                        {(student.completion_percentage || 0).toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span>{student.materials_accessed || 0} / {student.total_materials || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      {student.materials_completed || 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {formatDate(student.last_activity)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          {formatDateTime(student.last_activity)}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewStudent(student)}
                      >
                        View
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {studentsData?.students?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-4">
                No students found matching your search criteria.
              </div>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear search
              </Button>
            </div>
          )}

          {studentsData?.pagination && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, studentsData.pagination.total)} of {studentsData.pagination.total} students
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("Navigating to previous page");
                    setPage((p) => Math.max(p - 1, 1));
                  }}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("Navigating to next page");
                    setPage((p) => p + 1);
                  }}
                  disabled={page >= studentsData.pagination.total_pages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Component for detailed student view
const StudentDetailView = ({ student, onBack }: { student: Student; onBack: () => void }) => {
  const { data: progressStats, isLoading } = useQuery<ProgressStats>({
    queryKey: ["studentProgressStats", student.email],
    queryFn: async () => {
      console.log("Fetching progress stats for student:", student.email);
      try {
        const response = await api.getProgressStats(student.email);
        console.log("Raw progress stats response:", response);
        
        const transformedData = {
          total_materials: parseInt(response.total_materials.toString()) || 0,
          total_accessed: parseInt(response.total_accessed.toString()) || 0,
          completed: parseInt(response.completed.toString()) || 0,
          in_progress: parseInt(response.in_progress.toString()) || 0,
          not_started: parseInt(response.not_started.toString()) || 0,
          completion_percentage: parseFloat(response.completion_percentage.toString()) || 0,
        };

        console.log("Transformed progress stats:", transformedData);
        return transformedData;
      } catch (error) {
        console.error("Error fetching progress stats:", error);
        throw error;
      }
    },
    onError: (error) => {
      console.error("Progress stats query error:", error);
    },
    onSuccess: (data) => {
      console.log("Progress stats loaded successfully:", data);
    }
  });

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={onBack} className="gap-2">
        <ChevronLeft className="h-4 w-4" />
        Back to all students
      </Button>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle>{student.name}</CardTitle>
                <CardDescription>{student.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Joined</span>
              <span className="text-sm font-medium">
                {new Date(student.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Last Active</span>
              <span className="text-sm font-medium">
                {student.last_activity ? new Date(student.last_activity).toLocaleString() : "Never"}
              </span>
            </div>
            <div className="pt-4">
              <Button variant="outline" className="w-full gap-2">
                <Mail className="h-4 w-4" />
                Send Message
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="md:w-2/3 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Progress Overview</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : progressStats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Completion</span>
                      <span className="text-sm font-medium">
                        {progressStats.completion_percentage}%
                      </span>
                    </div>
                    <Progress 
                      value={progressStats.completion_percentage} 
                      className="h-2" 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Materials Accessed</span>
                      <span className="text-sm font-medium">
                        {progressStats.total_accessed}/{progressStats.total_materials}
                      </span>
                    </div>
                    <Progress 
                      value={(progressStats.total_accessed / progressStats.total_materials) * 100} 
                      className="h-2" 
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No progress data available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : progressStats ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard 
                    title="Completed" 
                    value={progressStats.completed} 
                    className="bg-green-500/10 text-green-600"
                  />
                  <StatCard 
                    title="In Progress" 
                    value={progressStats.in_progress} 
                    className="bg-amber-500/10 text-amber-600"
                  />
                  <StatCard 
                    title="Not Started" 
                    value={progressStats.not_started} 
                    className="bg-gray-500/10 text-gray-600"
                  />
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No activity data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Reusable Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  icon, 
  className = "",
}: {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) => {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">{value}</span>
          {icon && (
            <div className="p-2 rounded-lg bg-primary/10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Top Subjects Card Component
const TopSubjectsCard = ({ subjects }: { subjects: DashboardStats["top_subjects"] }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Subjects by Completion</CardTitle>
        <CardDescription>Subjects with highest completion rates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {subjects.map((subject) => (
            <div key={subject.id} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{subject.name}</span>
                <span className="text-muted-foreground">
                  {subject.completed}/{subject.total_materials} ({subject.completion_rate}%)
                </span>
              </div>
              <Progress 
                value={subject.completion_rate} 
                className="h-2" 
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Recent Students Card Component
const RecentStudentsCard = ({ students }: { students: DashboardStats["recent_students"] }) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "Never active";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recently Active Students</CardTitle>
        <CardDescription>Students with recent activity</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {students.map((student) => (
            <div key={student.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{student.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(student.completion_percentage || 0).toFixed(1)}% complete
                  </p>
                </div>
              </div>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(student.last_activity)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {formatDateTime(student.last_activity)}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Loading Skeleton Component
const LoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-[250px]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-5 w-64" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default StudentsDashboard;