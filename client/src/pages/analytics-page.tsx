import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Users, Globe, RefreshCw, TrendingUp, Monitor, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, subDays } from 'date-fns';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

// Data types
interface AnalyticsData {
  currentListeners: number;
  peakListeners: number;
  activeShows: number;
  storageUsed: string;
}

interface ListenerStat {
  id: number;
  showId?: number;
  streamId?: number;
  timestamp: string;
  location: string;
  device: string;
  listenTime: number;
  ipAddress: string;
}

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<string>("7days");
  const [activeTab, setActiveTab] = useState<string>("overview");
  
  // Fetch analytics data
  const { data: analyticsData, isLoading: isLoadingAnalytics } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics/current"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  // Fetch listener stats
  const { data: listenerStats, isLoading: isLoadingStats } = useQuery<ListenerStat[]>({
    queryKey: ["/api/analytics/listener-stats"],
  });
  
  // Generate dummy data for charts
  const generateDailyListenerData = () => {
    const days = parseInt(timeRange.replace('days', ''));
    return Array.from({ length: days }, (_, i) => {
      const date = subDays(new Date(), days - i - 1);
      return {
        date: format(date, 'MMM dd'),
        listeners: Math.floor(Math.random() * 250) + 50,
      };
    });
  };
  
  const generateLocationData = () => {
    return [
      { name: 'United States', value: 42 },
      { name: 'Canada', value: 18 },
      { name: 'United Kingdom', value: 15 },
      { name: 'Australia', value: 10 },
      { name: 'Other', value: 15 },
    ];
  };
  
  const generateDeviceData = () => {
    return [
      { name: 'Mobile', value: 65 },
      { name: 'Desktop', value: 25 },
      { name: 'Tablet', value: 10 },
    ];
  };
  
  const generateShowsData = () => {
    return [
      { name: 'Morning Glory', listeners: 8432 },
      { name: 'Worship Hour', listeners: 6218 },
      { name: 'Scripture Study', listeners: 4756 },
      { name: 'Youth Devotional', listeners: 3521 },
      { name: 'Prayer Time', listeners: 3104 },
    ];
  };
  
  const dailyListenerData = generateDailyListenerData();
  const locationData = generateLocationData();
  const deviceData = generateDeviceData();
  const showsData = generateShowsData();
  
  const COLORS = ['#3b82f6', '#6d28d9', '#ca8a04', '#ef4444', '#10b981'];
  
  // Stats card component
  const StatsCard = ({ title, value, icon, change }: { title: string, value: string | number, icon: React.ReactNode, change?: number }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {change !== undefined && (
              <div className={`flex items-center text-xs mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                <span>{Math.abs(change)}% from last {timeRange}</span>
              </div>
            )}
          </div>
          <div className="bg-blue-100 p-3 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
  
  const isLoading = isLoadingAnalytics || isLoadingStats;
  
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
              <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <Select
                    value={timeRange}
                    onValueChange={setTimeRange}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select time range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="14days">Last 14 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  {/* Stats overview */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <StatsCard 
                      title="Current Listeners" 
                      value={analyticsData?.currentListeners || 0} 
                      icon={<Users className="h-6 w-6 text-blue-600" />}
                      change={12}
                    />
                    <StatsCard 
                      title="Total Listeners" 
                      value="15,482" 
                      icon={<Globe className="h-6 w-6 text-purple-600" />}
                      change={8}
                    />
                    <StatsCard 
                      title="Avg. Listen Time" 
                      value="23 min" 
                      icon={<Clock className="h-6 w-6 text-yellow-600" />}
                      change={-3}
                    />
                    <StatsCard 
                      title="Peak Listeners" 
                      value={analyticsData?.peakListeners || 0} 
                      icon={<TrendingUp className="h-6 w-6 text-green-600" />}
                      change={15}
                    />
                  </div>
                  
                  <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="shows">Shows</TabsTrigger>
                      <TabsTrigger value="audience">Audience</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="overview">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Listener Trend Chart */}
                        <Card className="lg:col-span-2">
                          <CardHeader>
                            <CardTitle>Listener Trends</CardTitle>
                            <CardDescription>Daily listener count over time</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                  data={dailyListenerData}
                                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                >
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="date" />
                                  <YAxis />
                                  <Tooltip />
                                  <Bar dataKey="listeners" fill="#3b82f6" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Locations Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Listener Locations</CardTitle>
                            <CardDescription>Geographic distribution of listeners</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80 flex items-center justify-center">
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={locationData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {locationData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Devices Chart */}
                        <Card>
                          <CardHeader>
                            <CardTitle>Devices</CardTitle>
                            <CardDescription>Breakdown of listener devices</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-80 flex items-center justify-center">
                              <div className="flex-1">
                                <ResponsiveContainer width="100%" height={250}>
                                  <PieChart>
                                    <Pie
                                      data={deviceData}
                                      cx="50%"
                                      cy="50%"
                                      labelLine={false}
                                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                      outerRadius={80}
                                      fill="#8884d8"
                                      dataKey="value"
                                    >
                                      {deviceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                      ))}
                                    </Pie>
                                    <Tooltip />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="shows">
                      <Card>
                        <CardHeader>
                          <CardTitle>Show Analytics</CardTitle>
                          <CardDescription>Performance metrics for your shows</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={showsData}
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                layout="vertical"
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Bar dataKey="listeners" fill="#3b82f6" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="audience">
                      <div className="grid grid-cols-1 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Audience Demographics</CardTitle>
                            <CardDescription>Detailed analysis of your listener base</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex flex-col gap-8">
                              <div>
                                <h3 className="text-lg font-medium mb-4">Top Locations</h3>
                                <div className="space-y-4">
                                  {locationData.map((location, index) => (
                                    <div key={index} className="flex items-center">
                                      <div className="w-48 font-medium">{location.name}</div>
                                      <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div 
                                            className="bg-blue-600 h-2.5 rounded-full" 
                                            style={{ width: `${location.value}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      <div className="w-16 text-right text-gray-500">{location.value}%</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-4">Devices</h3>
                                <div className="space-y-4">
                                  {deviceData.map((device, index) => (
                                    <div key={index} className="flex items-center">
                                      <div className="w-48 font-medium">{device.name}</div>
                                      <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                          <div 
                                            className="bg-purple-600 h-2.5 rounded-full" 
                                            style={{ width: `${device.value}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                      <div className="w-16 text-right text-gray-500">{device.value}%</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <h3 className="text-lg font-medium mb-4">Listening Time</h3>
                                <div className="space-y-4">
                                  <div className="flex items-center">
                                    <div className="w-48 font-medium">Under 10 minutes</div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-yellow-600 h-2.5 rounded-full" 
                                          style={{ width: "28%" }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="w-16 text-right text-gray-500">28%</div>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-48 font-medium">10-30 minutes</div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-yellow-600 h-2.5 rounded-full" 
                                          style={{ width: "42%" }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="w-16 text-right text-gray-500">42%</div>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-48 font-medium">30-60 minutes</div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-yellow-600 h-2.5 rounded-full" 
                                          style={{ width: "18%" }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="w-16 text-right text-gray-500">18%</div>
                                  </div>
                                  <div className="flex items-center">
                                    <div className="w-48 font-medium">Over 60 minutes</div>
                                    <div className="flex-1">
                                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                                        <div 
                                          className="bg-yellow-600 h-2.5 rounded-full" 
                                          style={{ width: "12%" }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="w-16 text-right text-gray-500">12%</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
