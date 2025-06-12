
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Users, 
  BookOpen, 
  Settings, 
  User,
  FileText,
  Clock,
  Upload,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Sample mock data for admin dashboard
const MOCK_PLATFORM_STATS = {
  totalUsers: 837,
  activeUsers: 614,
  totalMaterials: 246,
  quizzes: 128,
};

const MOCK_USER_BREAKDOWN = {
  students: 746,
  teachers: 83,
  admins: 8
};

const MOCK_RECENT_USERS = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "student",
    joinDate: "2025-05-15T10:30:00",
    status: "active"
  },
  {
    id: "u2",
    name: "Robert Smith",
    email: "robert@example.com",
    role: "teacher",
    joinDate: "2025-05-14T14:15:00",
    status: "active"
  },
  {
    id: "u3",
    name: "Emily Davis",
    email: "emily@example.com",
    role: "student",
    joinDate: "2025-05-14T09:45:00",
    status: "inactive"
  },
  {
    id: "u4",
    name: "Michael Wilson",
    email: "michael@example.com",
    role: "student",
    joinDate: "2025-05-13T16:20:00",
    status: "active"
  },
  {
    id: "u5",
    name: "Sarah Brown",
    email: "sarah@example.com",
    role: "teacher",
    joinDate: "2025-05-12T11:10:00",
    status: "active"
  }
];

const MOCK_RECENT_MATERIALS = [
  {
    id: "rm1",
    title: "Advanced Machine Learning",
    author: "Prof. Roberts",
    uploadDate: "2025-05-16T08:15:00",
    subject: "Computer Science",
    type: "PDF",
    status: "approved"
  },
  {
    id: "rm2",
    title: "Quantum Physics Explained",
    author: "Dr. Harrison",
    uploadDate: "2025-05-15T14:30:00",
    subject: "Physics",
    type: "Video",
    status: "pending"
  },
  {
    id: "rm3",
    title: "Introduction to Biochemistry",
    author: "Prof. Thompson",
    uploadDate: "2025-05-15T11:45:00",
    subject: "Biology",
    type: "Interactive",
    status: "approved"
  }
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Platform management and analytics
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users or content..."
              className="pl-9 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button className="bg-edu-primary">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <h3 className="text-2xl font-bold">{MOCK_PLATFORM_STATS.totalUsers}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-edu-primary/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-edu-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Users</p>
              <h3 className="text-2xl font-bold">{MOCK_PLATFORM_STATS.activeUsers}</h3>
              <p className="text-xs text-muted-foreground">
                {Math.round((MOCK_PLATFORM_STATS.activeUsers / MOCK_PLATFORM_STATS.totalUsers) * 100)}% of total
              </p>
            </div>
            <div className="h-10 w-10 rounded-full bg-edu-secondary/20 flex items-center justify-center">
              <User className="h-6 w-6 text-edu-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Materials</p>
              <h3 className="text-2xl font-bold">{MOCK_PLATFORM_STATS.totalMaterials}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-edu-accent/20 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-edu-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Quizzes</p>
              <h3 className="text-2xl font-bold">{MOCK_PLATFORM_STATS.quizzes}</h3>
            </div>
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Activity</CardTitle>
              <CardDescription>
                New users and account activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RECENT_USERS.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-muted-foreground">{user.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            user.role === 'admin' 
                              ? 'border-edu-accent/50 text-edu-accent' 
                              : user.role === 'teacher'
                              ? 'border-edu-primary/50 text-edu-primary'
                              : 'border-edu-secondary/50 text-edu-secondary'
                          }
                        >
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.joinDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 rounded-full mr-2 ${
                              user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`} 
                          />
                          <span className="capitalize text-sm">{user.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                onClick={() => navigate("/users")}
              >
                <Users className="h-4 w-4 mr-2" />
                View All Users
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Materials</CardTitle>
              <CardDescription>
                Recently uploaded learning resources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_RECENT_MATERIALS.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell>
                        <div className="font-medium">{material.title}</div>
                        <div className="text-xs text-muted-foreground">{material.subject}</div>
                      </TableCell>
                      <TableCell>{material.author}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            material.type === 'PDF' 
                              ? 'border-edu-primary/50 text-edu-primary' 
                              : material.type === 'Video'
                              ? 'border-edu-accent/50 text-edu-accent'
                              : 'border-edu-secondary/50 text-edu-secondary'
                          }
                        >
                          {material.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={material.status === 'approved' ? 'default' : 'outline'}
                          className={
                            material.status === 'approved' 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : 'text-amber-500 border-amber-500/30'
                          }
                        >
                          {material.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                onClick={() => navigate("/materials")}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                View All Materials
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Breakdown</CardTitle>
              <CardDescription>Distribution of user types</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Students</span>
                    <span className="text-sm font-medium">
                      {MOCK_USER_BREAKDOWN.students} 
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((MOCK_USER_BREAKDOWN.students / MOCK_PLATFORM_STATS.totalUsers) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={(MOCK_USER_BREAKDOWN.students / MOCK_PLATFORM_STATS.totalUsers) * 100} className="h-2 bg-muted" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Teachers</span>
                    <span className="text-sm font-medium">
                      {MOCK_USER_BREAKDOWN.teachers}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((MOCK_USER_BREAKDOWN.teachers / MOCK_PLATFORM_STATS.totalUsers) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={(MOCK_USER_BREAKDOWN.teachers / MOCK_PLATFORM_STATS.totalUsers) * 100} className="h-2 bg-muted" />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Administrators</span>
                    <span className="text-sm font-medium">
                      {MOCK_USER_BREAKDOWN.admins}
                      <span className="text-xs text-muted-foreground ml-1">
                        ({Math.round((MOCK_USER_BREAKDOWN.admins / MOCK_PLATFORM_STATS.totalUsers) * 100)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={(MOCK_USER_BREAKDOWN.admins / MOCK_PLATFORM_STATS.totalUsers) * 100} className="h-2 bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Health</CardTitle>
              <CardDescription>System status and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">API Status</span>
                  </div>
                  <span className="text-xs font-medium">Operational</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Database</span>
                  </div>
                  <span className="text-xs font-medium">Healthy</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span className="text-sm">Storage</span>
                  </div>
                  <span className="text-xs font-medium">89% Available</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <span className="text-sm">Processing Queue</span>
                  </div>
                  <span className="text-xs font-medium">12 Pending</span>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex justify-between items-center text-sm">
                  <span>Last System Update:</span>
                  <span className="font-medium">May 18, 2025</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button onClick={() => navigate("/users")} className="bg-edu-primary">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Users
                </Button>
                <Button onClick={() => navigate("/materials")} className="bg-edu-secondary">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Review Content
                </Button>
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
                <Button variant="outline">
                  <BarChart className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
