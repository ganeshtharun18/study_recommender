
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { BarChart as BarChartIcon, PieChart, LineChart, Download, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Legend
} from "recharts";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Sample mock data for charts
const MOCK_USER_GROWTH = [
  { month: 'Jan', students: 120, teachers: 15 },
  { month: 'Feb', students: 180, teachers: 22 },
  { month: 'Mar', students: 250, teachers: 28 },
  { month: 'Apr', students: 310, teachers: 35 },
  { month: 'May', students: 410, teachers: 42 }
];

const MOCK_MATERIAL_USAGE = [
  { name: 'Mathematics', value: 35 },
  { name: 'Computer Science', value: 25 },
  { name: 'Physics', value: 18 },
  { name: 'Chemistry', value: 12 },
  { name: 'Biology', value: 10 }
];

const MOCK_ENGAGEMENT_DATA = [
  { day: 'Mon', engagement: 75 },
  { day: 'Tue', engagement: 83 },
  { day: 'Wed', engagement: 92 },
  { day: 'Thu', engagement: 88 },
  { day: 'Fri', engagement: 95 },
  { day: 'Sat', engagement: 65 },
  { day: 'Sun', engagement: 60 }
];

const MOCK_QUIZ_COMPLETION = [
  { subject: 'Math', completed: 320, pending: 80 },
  { subject: 'CS', completed: 280, pending: 120 },
  { subject: 'Physics', completed: 240, pending: 160 },
  { subject: 'Chem', completed: 260, pending: 140 },
  { subject: 'Bio', completed: 220, pending: 180 }
];

const COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];
const MATERIAL_COLORS = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#a4de6c'];

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("month");
  const [chartType, setChartType] = useState("users");

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Platform usage and performance metrics
          </p>
        </div>

        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="quarter">Past Quarter</SelectItem>
              <SelectItem value="year">Past Year</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className={chartType === "users" ? "bg-muted" : ""} 
              onClick={() => setChartType("users")}>
              <BarChartIcon className="h-4 w-4 mr-2" />
              Users
            </Button>
            <Button variant="outline" size="sm" className={chartType === "materials" ? "bg-muted" : ""} 
              onClick={() => setChartType("materials")}>
              <PieChart className="h-4 w-4 mr-2" />
              Materials
            </Button>
            <Button variant="outline" size="sm" className={chartType === "engagement" ? "bg-muted" : ""} 
              onClick={() => setChartType("engagement")}>
              <LineChart className="h-4 w-4 mr-2" />
              Engagement
            </Button>
          </div>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="py-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <h3 className="text-2xl font-bold">837</h3>
                  <p className="text-xs text-green-500">+12.5% from last month</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <h3 className="text-2xl font-bold">614</h3>
                  <p className="text-xs text-green-500">+8.3% from last month</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Materials</p>
                  <h3 className="text-2xl font-bold">246</h3>
                  <p className="text-xs text-green-500">+15.2% from last month</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                  <h3 className="text-2xl font-bold">78%</h3>
                  <p className="text-xs text-green-500">+5.8% from last month</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Growth Trend</CardTitle>
                <CardDescription>Monthly growth of students and teachers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={MOCK_USER_GROWTH}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="students" name="Students" fill="#8884d8" />
                      <Bar dataKey="teachers" name="Teachers" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Material Usage Distribution</CardTitle>
                <CardDescription>By subject category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={MOCK_MATERIAL_USAGE}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {MOCK_MATERIAL_USAGE.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={MATERIAL_COLORS[index % MATERIAL_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Engagement Score</CardTitle>
                <CardDescription>Past 7 days user activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart
                      data={MOCK_ENGAGEMENT_DATA}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="engagement" stroke="#8884d8" activeDot={{ r: 8 }} />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quiz Completion Rate</CardTitle>
                <CardDescription>By subject area</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={MOCK_QUIZ_COMPLETION}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="subject" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="completed" name="Completed" stackId="a" fill="#8884d8" />
                      <Bar dataKey="pending" name="Pending" stackId="a" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Platform Performance</CardTitle>
              <CardDescription>System health and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Server Response Time</span>
                      <span className="font-medium">235ms</span>
                    </div>
                    <Progress value={78} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Database Load</span>
                      <span className="font-medium">42%</span>
                    </div>
                    <Progress value={42} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Cache Hit Rate</span>
                      <span className="font-medium">89%</span>
                    </div>
                    <Progress value={89} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Storage Usage</span>
                      <span className="font-medium">56%</span>
                    </div>
                    <Progress value={56} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Memory Usage</span>
                      <span className="font-medium">61%</span>
                    </div>
                    <Progress value={61} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>CPU Usage</span>
                      <span className="font-medium">38%</span>
                    </div>
                    <Progress value={38} className="h-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>API Requests</span>
                      <span className="font-medium">4.2k/min</span>
                    </div>
                    <Progress value={65} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Bandwidth</span>
                      <span className="font-medium">28 MB/s</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1 text-sm">
                      <span>Error Rate</span>
                      <span className="font-medium">0.07%</span>
                    </div>
                    <Progress value={7} className="h-2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* User-specific metrics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Detailed user statistics and metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                User analytics details would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-6">
          {/* Content-specific metrics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Content Analytics</CardTitle>
              <CardDescription>Material usage and performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                Content analytics details would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* Engagement-specific metrics would go here */}
          <Card>
            <CardHeader>
              <CardTitle>Engagement Analytics</CardTitle>
              <CardDescription>User activity and interaction metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                Engagement analytics details would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
