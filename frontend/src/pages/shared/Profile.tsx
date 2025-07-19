import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Lock, Bell } from "lucide-react";
import { updateProfile, changePassword } from "@/lib/api";

// Define backend URL constant
const BACKEND_URL = "http://127.0.0.1:5000";

const Profile = () => {
  // Get user data and update function from auth context
  const { user, updateUser } = useAuth();

  // State for form fields
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // State for avatar dialog and file input
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // State for avatar URL
  const [avatarUrl, setAvatarUrl] = useState("");

  // Effect to update form fields when user data changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setAvatarUrl(formatAvatarUrl(user.avatar));
    }
  }, [user]);

  // Helper function to get user initials for fallback avatar
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Function to properly format avatar URL
  const formatAvatarUrl = (url?: string) => {
    if (!url) return "";
    
    // Fix URLs missing slash after domain
    if (url.includes(BACKEND_URL) && !url.includes(BACKEND_URL + "/")) {
      return url.replace(BACKEND_URL, BACKEND_URL + "/");
    }
    
    // Handle relative paths
    if (url.startsWith("/static")) {
      return `${BACKEND_URL}${url}`;
    }
    
    // Handle case where avatar might be just filename
    if (!url.startsWith("http") && !url.startsWith("/")) {
      return `${BACKEND_URL}/static/avatars/${url}`;
    }
    
    return url;
  };

  // Handler for saving profile changes
  const handleSaveProfile = async () => {
    try {
      // Call API to update profile
      await updateProfile(name, email);
      
      // Show success message
      toast.success("Profile updated successfully");
      
      // Update user context
      updateUser({ ...user, name, email });
    } catch (err) {
      // Show error message
      toast.error("Failed to update profile");
      console.error(err);
    }
  };

  // Handler for changing password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Call API to change password
      await changePassword(currentPassword, newPassword, confirmPassword);
      
      // Show success message
      toast.success("Password changed successfully");
      
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      // Show error message
      toast.error("Failed to change password");
      console.error(err);
    }
  };

  // Handler for avatar click (opens file dialog)
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  // Handler for avatar file change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }

    // Create form data for upload
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      // Upload avatar to server
      const res = await fetch(`${BACKEND_URL}/api/auth/upload_avatar`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}`,
        },
        body: formData,
      });

      const data = await res.json();
      
      if (res.ok) {
        // Format the returned avatar URL
        const formattedUrl = formatAvatarUrl(data.avatarUrl);
        
        // Update local state
        setAvatarUrl(formattedUrl);
        
        // Update user context
        updateUser({ ...user, avatar: data.avatarUrl });
        
        // Show success message
        toast.success("Avatar updated successfully");
      } else {
        // Show error message from server
        toast.error(data.error || "Failed to upload avatar");
      }
    } catch (err) {
      // Show generic error message
      toast.error("Error uploading avatar");
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile header section */}
      <div>
        <h1 className="text-3xl font-bold">Your Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      {/* Main profile content */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Left sidebar with avatar */}
        <Card className="w-full md:w-1/3 md:sticky md:top-20 md:self-start">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            {/* Avatar dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <div className="cursor-pointer">
                  <Avatar className="h-24 w-24 mb-4">
                    <AvatarImage src={avatarUrl} alt={user?.name} />
                    <AvatarFallback className="text-2xl">
                      {user ? getInitials(user.name) : "??"}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </DialogTrigger>
              <DialogContent className="p-4 max-w-sm sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Profile Picture</DialogTitle>
                  <DialogDescription>
                    This is your current profile picture. Click outside to close.
                  </DialogDescription>
                </DialogHeader>
                <img
                  src={avatarUrl}
                  alt="Enlarged Avatar"
                  className="rounded-xl w-full object-contain"
                />
              </DialogContent>
            </Dialog>

            {/* User info */}
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <p className="capitalize text-sm bg-edu-primary/10 text-edu-primary px-2 py-0.5 rounded-full mt-2">
              {user?.role}
            </p>
            
            {/* Change avatar button */}
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={handleAvatarClick}
            >
              Change Avatar
            </Button>
            
            {/* Hidden file input */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
          </CardContent>
        </Card>

        {/* Right side with tabs */}
        <div className="flex-1">
          <Tabs defaultValue="general">
            {/* Tab list */}
            <TabsList className="mb-6">
              <TabsTrigger value="general" className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-1">
                <Lock className="h-4 w-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-1">
                <Bell className="h-4 w-4" />
                <span>Notifications</span>
              </TabsTrigger>
            </TabsList>

            {/* General tab content */}
            <TabsContent value="general">
              <Card>
                <CardHeader>
                  <CardTitle>General Information</CardTitle>
                  <CardDescription>Update your basic profile details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Your email address"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Input
                      id="role"
                      value={user?.role || ""}
                      readOnly
                      className="bg-muted"
                    />
                  </div>

                  <Button
                    className="w-full mt-4 bg-edu-primary hover:bg-edu-primary/90"
                    onClick={handleSaveProfile}
                  >
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security tab content */}
            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Manage your password and account security</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                      />
                    </div>

                    <Button type="submit" className="w-full mt-4">
                      Change Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications tab content */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>Control how you receive notifications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground py-8">
                    Notification settings coming soon...
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Profile;