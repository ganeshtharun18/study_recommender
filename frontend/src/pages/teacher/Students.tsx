import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Clock, FileText, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import api from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface Student {
  id: string;
  name: string;
  email: string;
  created_at: string;
  progress?: number;
  last_active?: string;
  materials_completed?: number;
  quizzes_completed?: number;
}

interface StudentStats {
  average_progress: number;
  material_completion: {
    completed: number;
    in_progress: number;
    not_started: number;
  };
  quiz_performance: {
    subject: string;
    score: number;
  }[];
}

const Students = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ["students", page, perPage, searchQuery],
    queryFn: () => api.getStudents(page, perPage, searchQuery),
    //keepPreviousData: true,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["studentStats", user?.email],
    enabled: !!user?.email,
    queryFn: () => api.getProgressStats(user.email),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (studentsLoading || statsLoading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <Skeleton className="h-10 w-[250px]" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">Manage and track student progress</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            className="pl-10 w-[250px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Overview</CardTitle>
          <CardDescription>View and manage students enrolled in your courses</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="hidden md:table-cell">Materials</TableHead>
                <TableHead className="hidden md:table-cell">Quizzes</TableHead>
                <TableHead className="hidden md:table-cell">Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsData?.students?.map((student: Student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 rounded-full bg-edu-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-edu-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-full max-w-24">
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-edu-primary rounded-full"
                            style={{ width: `${student.progress || 0}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{student.progress || 0}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-edu-secondary" />
                      <span>{student.materials_completed || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-edu-accent" />
                      <span>{student.quizzes_completed || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {student.last_active ? formatDate(student.last_active) : "Never"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">View</Button>
                      <Button size="sm" className="bg-edu-primary">
                        <Mail className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {studentsData?.students?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found matching your search criteria.
            </div>
          )}

          {studentsData?.pagination && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= studentsData.pagination.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Average Progress</CardTitle>
            <CardDescription>Across all students</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#f3f4f6" strokeWidth="2" />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="hsl(var(--edu-primary))"
                    strokeWidth="2"
                    strokeDasharray={`${statsData?.average_progress || 0} 100`}
                    strokeDashoffset="25"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{statsData?.average_progress || 0}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Material Completion</CardTitle>
            <CardDescription>Student engagement with materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(["completed", "in_progress", "not_started"] as const).map((key) => (
                <div key={key}>
                  <div className="flex justify-between mb-1 text-sm">
                    <span>{key.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <span>{statsData?.material_completion?.[key] || 0}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        key === "completed"
                          ? "bg-edu-secondary"
                          : key === "in_progress"
                          ? "bg-amber-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${statsData?.material_completion?.[key] || 0}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz Performance</CardTitle>
            <CardDescription>Average scores on quizzes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statsData?.quiz_performance?.map((quiz, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{quiz.subject}</span>
                  <Badge
                    className={
                      quiz.score >= 80
                        ? "bg-green-500"
                        : quiz.score >= 60
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }
                  >
                    {quiz.score}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Students; 