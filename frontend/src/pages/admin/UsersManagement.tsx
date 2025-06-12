
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  UserPlus,
  Filter,
  User,
  Users,
  BookOpen,
  FileText,
  Clock,
  Settings,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { UserRole } from "@/contexts/AuthContext";

// Sample mock data for users
const MOCK_USERS = [
  {
    id: "u1",
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "student" as UserRole,
    joinDate: "2025-01-10",
    status: "active",
    lastActive: "2025-05-19T10:35:00"
  },
  {
    id: "u2",
    name: "Robert Smith",
    email: "robert@example.com",
    role: "teacher" as UserRole,
    joinDate: "2025-01-15",
    status: "active",
    lastActive: "2025-05-19T09:22:00"
  },
  {
    id: "u3",
    name: "Emma Wilson",
    email: "emma@example.com",
    role: "student" as UserRole,
    joinDate: "2025-02-05",
    status: "inactive",
    lastActive: "2025-05-12T14:40:00"
  },
  {
    id: "u4",
    name: "Michael Brown",
    email: "michael@example.com",
    role: "teacher" as UserRole,
    joinDate: "2025-02-18",
    status: "active",
    lastActive: "2025-05-18T16:15:00"
  },
  {
    id: "u5",
    name: "Sarah Davis",
    email: "sarah@example.com",
    role: "student" as UserRole,
    joinDate: "2025-03-01",
    status: "active",
    lastActive: "2025-05-19T11:05:00"
  },
  {
    id: "u6",
    name: "James Miller",
    email: "james@example.com",
    role: "student" as UserRole,
    joinDate: "2025-03-22",
    status: "active",
    lastActive: "2025-05-17T08:55:00"
  },
  {
    id: "u7",
    name: "Patricia Garcia",
    email: "patricia@example.com",
    role: "admin" as UserRole,
    joinDate: "2025-01-05",
    status: "active",
    lastActive: "2025-05-19T08:30:00"
  }
];

const UsersManagement = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"active" | "inactive" | "all">("all");

  const filteredUsers = MOCK_USERS.filter(user => {
    // Search filter
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    
    // Status filter
    const matchesStatus = statusFilter === "all" || user.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground">
            Manage platform users and permissions
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              className="pl-10 w-[220px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button className="bg-edu-primary">
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>
                Manage and monitor user accounts
              </CardDescription>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Role: {roleFilter === "all" ? "All" : roleFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by role</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setRoleFilter("all")}>All Roles</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("student")}>Students</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("teacher")}>Teachers</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setRoleFilter("admin")}>Administrators</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Status: {statusFilter === "all" ? "All" : statusFilter}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setStatusFilter("all")}>All Status</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("active")}>Active</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>Inactive</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="hidden md:table-cell">Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Last Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center 
                        ${user.role === 'admin' 
                          ? 'bg-edu-accent/20' 
                          : user.role === 'teacher'
                          ? 'bg-edu-primary/20'
                          : 'bg-edu-secondary/20'}`}
                      >
                        <User className={`h-5 w-5 
                          ${user.role === 'admin' 
                            ? 'text-edu-accent' 
                            : user.role === 'teacher'
                            ? 'text-edu-primary'
                            : 'text-edu-secondary'}`} 
                        />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
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
                  <TableCell className="hidden md:table-cell">{formatDate(user.joinDate)}</TableCell>
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
                  <TableCell className="hidden md:table-cell">
                    <div className="flex flex-col">
                      <span className="text-sm">{formatDate(user.lastActive)}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(user.lastActive)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Profile</DropdownMenuItem>
                        <DropdownMenuItem>Edit Details</DropdownMenuItem>
                        <DropdownMenuItem>Reset Password</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className={`${user.status === 'active' ? 'text-amber-500' : 'text-green-500'}`}>
                          {user.status === 'active' ? 'Deactivate' : 'Activate'} Account
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">Delete Account</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No users found matching your search criteria.
            </div>
          )}

          <div className="flex items-center justify-end mt-4 space-x-2 text-sm text-muted-foreground">
            <span>Showing {filteredUsers.length} of {MOCK_USERS.length} users</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>By role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Students</span>
                  <span>
                    {MOCK_USERS.filter(u => u.role === 'student').length} 
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((MOCK_USERS.filter(u => u.role === 'student').length / MOCK_USERS.length) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-edu-secondary rounded-full" 
                    style={{ width: `${(MOCK_USERS.filter(u => u.role === 'student').length / MOCK_USERS.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Teachers</span>
                  <span>
                    {MOCK_USERS.filter(u => u.role === 'teacher').length}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((MOCK_USERS.filter(u => u.role === 'teacher').length / MOCK_USERS.length) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-edu-primary rounded-full" 
                    style={{ width: `${(MOCK_USERS.filter(u => u.role === 'teacher').length / MOCK_USERS.length) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Administrators</span>
                  <span>
                    {MOCK_USERS.filter(u => u.role === 'admin').length}
                    <span className="text-xs text-muted-foreground ml-1">
                      ({Math.round((MOCK_USERS.filter(u => u.role === 'admin').length / MOCK_USERS.length) * 100)}%)
                    </span>
                  </span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-edu-accent rounded-full" 
                    style={{ width: `${(MOCK_USERS.filter(u => u.role === 'admin').length / MOCK_USERS.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Daily Active Users</span>
                  <span>58</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: "65%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Weekly Active Users</span>
                  <span>142</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "80%" }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-1 text-sm">
                  <span>Monthly Active Users</span>
                  <span>512</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: "90%" }}></div>
                </div>
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
              <Button className="bg-edu-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Bulk Import
              </Button>
              <Button variant="outline">
                <BookOpen className="h-4 w-4 mr-2" />
                User Guide
              </Button>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersManagement;
