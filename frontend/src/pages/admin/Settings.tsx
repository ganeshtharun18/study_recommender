
import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Database,
  Mail,
  FileText,
  Save,
} from "lucide-react";

const Settings = () => {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    setSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Settings saved successfully");
      setSaving(false);
    }, 1500);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Configure platform settings and preferences
          </p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid grid-cols-6 h-auto">
          <TabsTrigger value="general" className="flex items-center gap-2 py-2">
            <SettingsIcon className="h-4 w-4" />
            <span>General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-2">
            <User className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 py-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2 py-2">
            <Database className="h-4 w-4" />
            <span>Database</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2 py-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2 py-2">
            <FileText className="h-4 w-4" />
            <span>API</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure general platform settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="platform-name">Platform Name</Label>
                  <Input 
                    id="platform-name" 
                    defaultValue="EduRecommender" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform-url">Platform URL</Label>
                  <Input 
                    id="platform-url" 
                    defaultValue="https://edu-recommender.example.com" 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="support-email">Support Email</Label>
                  <Input 
                    id="support-email" 
                    defaultValue="support@edu-recommender.example.com" 
                    type="email"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="platform-description">Platform Description</Label>
                  <Textarea 
                    id="platform-description" 
                    rows={3}
                    defaultValue="A comprehensive educational platform for personalized study materials and progress tracking."
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to show a maintenance message to users
                    </p>
                  </div>
                  <Switch id="maintenance-mode" />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-registrations">Allow New Registrations</Label>
                    <p className="text-sm text-muted-foreground">
                      Control whether new users can register accounts
                    </p>
                  </div>
                  <Switch id="allow-registrations" defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* User Settings Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
              <CardDescription>
                Configure user registration and account settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-verification">Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      Users must verify their email before accessing the platform
                    </p>
                  </div>
                  <Switch id="email-verification" defaultChecked />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="allow-teacher-registration">Allow Teacher Self-Registration</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow users to register as teachers without admin approval
                    </p>
                  </div>
                  <Switch id="allow-teacher-registration" />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-approval">Auto-Approve Teacher Accounts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically approve teacher account requests
                    </p>
                  </div>
                  <Switch id="auto-approval" />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="default-user-role">Default User Role</Label>
                  <select id="default-user-role" className="w-full p-2 rounded-md border border-border">
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="text-sm text-muted-foreground">
                    Default role assigned to new registered users
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
                  <Input id="session-timeout" type="number" defaultValue={60} />
                  <p className="text-sm text-muted-foreground">
                    Time of inactivity before automatically logging users out
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="password-policy">Password Policy</Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox id="min-length" defaultChecked />
                      <label htmlFor="min-length" className="text-sm">
                        Minimum 8 characters
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="uppercase" defaultChecked />
                      <label htmlFor="uppercase" className="text-sm">
                        Require uppercase letter
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="number" defaultChecked />
                      <label htmlFor="number" className="text-sm">
                        Require number
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Checkbox id="special-char" defaultChecked />
                      <label htmlFor="special-char" className="text-sm">
                        Require special character
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Settings Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure platform security settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="2fa">Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require two-factor authentication for all admin accounts
                    </p>
                  </div>
                  <Switch id="2fa" defaultChecked />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="ip-restriction">IP Restrictions</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict admin access to specific IP addresses
                    </p>
                  </div>
                  <Switch id="ip-restriction" />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="ip-whitelist">Whitelisted IP Addresses</Label>
                  <Textarea 
                    id="ip-whitelist" 
                    placeholder="Enter IP addresses, one per line" 
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border pt-4">
                  <div className="space-y-0.5">
                    <Label htmlFor="encrypt-data">Encrypt Sensitive Data</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable additional encryption for sensitive user data
                    </p>
                  </div>
                  <Switch id="encrypt-data" defaultChecked />
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="login-attempts">Max Failed Login Attempts</Label>
                  <Input id="login-attempts" type="number" defaultValue={5} />
                  <p className="text-sm text-muted-foreground">
                    Number of failed login attempts before account lockout
                  </p>
                </div>

                <div className="space-y-2 border-t border-border pt-4">
                  <Label htmlFor="lockout-duration">Account Lockout Duration (minutes)</Label>
                  <Input id="lockout-duration" type="number" defaultValue={30} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <span className="flex items-center">
                    <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    Saving...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Database Settings Tab */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Settings</CardTitle>
              <CardDescription>
                Configure database settings and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                Database settings would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure email and notification settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                Notification settings would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Settings Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>
                Configure API access and keys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-20 text-muted-foreground">
                API settings would be displayed here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
