
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, User, Mail, Clock, BarChart, FileText, BookOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";

// Sample mock data for students
const MOCK_STUDENTS = [
  {
    id: "s1",
    name: "Alex Johnson",
    email: "alex@example.com",
    enrollDate: "2025-01-15",
    progress: 87,
    lastActive: "2025-05-18",
    materialsCompleted: 12,
    quizzesCompleted: 8
  },
  {
    id: "s2",
    name: "Taylor Smith",
    email: "taylor@example.com",
    enrollDate: "2025-02-03",
    progress: 65,
    lastActive: "2025-05-19",
    materialsCompleted: 8,
    quizzesCompleted: 5
  },
  {
    id: "s3",
    name: "Jamie Williams",
    email: "jamie@example.com",
    enrollDate: "2025-02-22",
    progress: 92,
    lastActive: "2025-05-17",
    materialsCompleted: 15,
    quizzesCompleted: 10
  },
  {
    id: "s4",
    name: "Casey Brown",
    email: "casey@example.com",
    enrollDate: "2025-03-11",
    progress: 45,
    lastActive: "2025-05-16",
    materialsCompleted: 6,
    quizzesCompleted: 3
  },
  {
    id: "s5",
    name: "Jordan Davis",
    email: "jordan@example.com",
    enrollDate: "2025-03-30",
    progress: 78,
    lastActive: "2025-05-19",
    materialsCompleted: 10,
    quizzesCompleted: 7
  }
];

const Students = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredStudents = MOCK_STUDENTS.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-muted-foreground">
            Manage and track student progress
          </p>
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
          <CardDescription>
            View and manage students enrolled in your courses
          </CardDescription>
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
              {filteredStudents.map(student => (
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
                            style={{ width: `${student.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="text-sm font-medium">{student.progress}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-edu-secondary" />
                      <span>{student.materialsCompleted}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4 text-edu-accent" />
                      <span>{student.quizzesCompleted}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{formatDate(student.lastActive)}</span>
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

          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No students found matching your search criteria.
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
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#f3f4f6" strokeWidth="2"></circle>
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="16" 
                    fill="none" 
                    stroke="hsl(var(--edu-primary))" 
                    strokeWidth="2" 
                    strokeDasharray={`${73 * 100 / 100} 100`} 
                    strokeDashoffset="25"
                    transform="rotate(-90 18 18)"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">73%</span>
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
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Completed</span>
                  <span>65%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-edu-secondary rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>In Progress</span>
                  <span>25%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: "25%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Not Started</span>
                  <span>10%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: "10%" }}></div>
                </div>
              </div>
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
              <div className="flex justify-between items-center">
                <span className="text-sm">Mathematics</span>
                <Badge className="bg-green-500">85%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Computer Science</span>
                <Badge className="bg-green-500">82%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Physics</span>
                <Badge className="bg-amber-500">76%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Chemistry</span>
                <Badge className="bg-red-500">62%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Students;
