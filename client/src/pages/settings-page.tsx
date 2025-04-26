import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, UserCircle, BellRing, Shield, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  email: z.string().email("Invalid email address").optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("account");
  
  // Profile form setup
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: "",
    },
  });
  
  // Password form setup
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onProfileSubmit = (data: ProfileFormValues) => {
    // In a real app, this would call an API to update user profile
    console.log("Profile data:", data);
    toast({
      title: "Profile updated",
      description: "Your profile information has been updated successfully.",
    });
  };
  
  const onPasswordSubmit = (data: PasswordFormValues) => {
    // In a real app, this would call an API to change password
    console.log("Password data:", data);
    toast({
      title: "Password changed",
      description: "Your password has been changed successfully.",
      duration: 5000,
    });
    passwordForm.reset();
  };
  
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopNav />
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="pb-5 border-b border-gray-200">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab}>
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="md:w-64 flex-shrink-0">
                    <div className="space-y-1">
                      <TabsList className="flex flex-col h-auto bg-transparent space-y-1 items-start p-0">
                        <TabsTrigger
                          value="account"
                          className={`w-full justify-start px-3 text-left ${activeTab === "account" ? "bg-gray-100" : ""}`}
                        >
                          <UserCircle className="h-5 w-5 mr-2" />
                          Account
                        </TabsTrigger>
                        <TabsTrigger
                          value="notifications"
                          className={`w-full justify-start px-3 text-left ${activeTab === "notifications" ? "bg-gray-100" : ""}`}
                        >
                          <BellRing className="h-5 w-5 mr-2" />
                          Notifications
                        </TabsTrigger>
                        <TabsTrigger
                          value="security"
                          className={`w-full justify-start px-3 text-left ${activeTab === "security" ? "bg-gray-100" : ""}`}
                        >
                          <Shield className="h-5 w-5 mr-2" />
                          Security
                        </TabsTrigger>
                        <TabsTrigger
                          value="station"
                          className={`w-full justify-start px-3 text-left ${activeTab === "station" ? "bg-gray-100" : ""}`}
                        >
                          <Globe className="h-5 w-5 mr-2" />
                          Station Settings
                        </TabsTrigger>
                      </TabsList>
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <TabsContent value="account" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Profile Information</CardTitle>
                          <CardDescription>
                            Update your account details and profile information.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Form {...profileForm}>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                              <FormField
                                control={profileForm.control}
                                name="fullName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      This is your public display name.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={profileForm.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input type="email" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      We'll use this email for notifications.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div>
                                <Button type="submit">
                                  <Save className="h-4 w-4 mr-2" />
                                  Save Changes
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="security" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Change Password</CardTitle>
                          <CardDescription>
                            Update your password to maintain account security.
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Form {...passwordForm}>
                            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                              <FormField
                                control={passwordForm.control}
                                name="currentPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Current Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={passwordForm.control}
                                name="newPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Password must be at least 6 characters.
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={passwordForm.control}
                                name="confirmPassword"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Confirm New Password</FormLabel>
                                    <FormControl>
                                      <Input type="password" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <div>
                                <Button type="submit">
                                  <Shield className="h-4 w-4 mr-2" />
                                  Change Password
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="notifications" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Notification Settings</CardTitle>
                          <CardDescription>
                            Control how you receive notifications from Grace Waves Radio.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Email Notifications</h3>
                            <Separator />
                            
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-medium">New listeners</div>
                                  <div className="text-sm text-gray-500">Receive notifications about new listeners</div>
                                </div>
                                <Switch defaultChecked />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-medium">Listener milestones</div>
                                  <div className="text-sm text-gray-500">Notifications about listener count milestones</div>
                                </div>
                                <Switch defaultChecked />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-medium">Schedule reminders</div>
                                  <div className="text-sm text-gray-500">Get reminders about upcoming scheduled shows</div>
                                </div>
                                <Switch defaultChecked />
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">System Notifications</h3>
                            <Separator />
                            
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-medium">Stream status</div>
                                  <div className="text-sm text-gray-500">Notifications when stream status changes</div>
                                </div>
                                <Switch defaultChecked />
                              </div>
                              
                              <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-medium">System updates</div>
                                  <div className="text-sm text-gray-500">Get notifications about system updates</div>
                                </div>
                                <Switch />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button>
                            Save Notification Settings
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="station" className="space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Station Settings</CardTitle>
                          <CardDescription>
                            Configure your radio station settings and preferences.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <FormLabel htmlFor="station-name">Station Name</FormLabel>
                              <Input id="station-name" defaultValue="Grace Waves Radio" />
                              <p className="text-sm text-gray-500">The name of your radio station</p>
                            </div>
                            
                            <div className="space-y-2">
                              <FormLabel htmlFor="station-tagline">Station Tagline</FormLabel>
                              <Input id="station-tagline" defaultValue="Spreading God's Word Through the Airwaves" />
                              <p className="text-sm text-gray-500">A short tagline for your station</p>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Auto-Rotation Settings</h3>
                            
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="font-medium">Enable auto-rotation</div>
                                <div className="text-sm text-gray-500">Automatically rotate through shows when no live stream is active</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="space-y-0.5">
                                <div className="font-medium">Include pre-recorded shows</div>
                                <div className="text-sm text-gray-500">Include pre-recorded shows in the auto-rotation</div>
                              </div>
                              <Switch defaultChecked />
                            </div>
                          </div>
                        </CardContent>
                        <CardFooter>
                          <Button>
                            <Save className="h-4 w-4 mr-2" />
                            Save Station Settings
                          </Button>
                        </CardFooter>
                      </Card>
                    </TabsContent>
                  </div>
                </div>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
