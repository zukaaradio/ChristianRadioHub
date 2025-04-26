import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Schedule, Show } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Edit,
  Trash2,
  Loader2,
  Calendar,
  RefreshCw,
  Clock
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const scheduleFormSchema = z.object({
  showId: z.coerce.number({
    required_error: "Please select a show",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  isRecurring: z.boolean().default(false),
  recurringDays: z.string().optional(),
  status: z.string().min(1, "Status is required"),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

export default function SchedulePage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("edit");
  const showAction = searchParams.get("action");
  const { toast } = useToast();
  
  const [deleteScheduleId, setDeleteScheduleId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(!!editId || showAction === "new");
  
  // Fetch schedules and shows
  const { data: schedules, isLoading: isLoadingSchedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules"],
  });
  
  const { data: shows, isLoading: isLoadingShows } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });
  
  // Get schedule being edited
  const { data: schedule, isLoading: isLoadingSchedule } = useQuery<Schedule>({
    queryKey: [`/api/schedules/${editId}`],
    enabled: !!editId,
  });
  
  // Form setup
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      showId: 0,
      startTime: "",
      endTime: "",
      isRecurring: false,
      recurringDays: "",
      status: "scheduled",
    },
  });
  
  // Update form when schedule data is loaded
  React.useEffect(() => {
    if (schedule) {
      form.reset({
        showId: schedule.showId,
        startTime: new Date(schedule.startTime).toISOString().slice(0, 16),
        endTime: new Date(schedule.endTime).toISOString().slice(0, 16),
        isRecurring: schedule.isRecurring,
        recurringDays: schedule.recurringDays || "",
        status: schedule.status,
      });
    }
  }, [schedule, form]);
  
  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/schedules/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Schedule deleted",
        description: "The schedule has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setDeleteScheduleId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: ScheduleFormValues) => {
      const response = await apiRequest("POST", "/api/schedules", {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule created",
        description: "Your new schedule has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowForm(false);
      navigate("/schedule");
    },
    onError: (error) => {
      toast({
        title: "Failed to create schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async (data: { id: number; values: ScheduleFormValues }) => {
      const response = await apiRequest("PUT", `/api/schedules/${data.id}`, {
        ...data.values,
        startTime: new Date(data.values.startTime),
        endTime: new Date(data.values.endTime),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Schedule updated",
        description: "Your schedule has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/schedules"] });
      setShowForm(false);
      navigate("/schedule");
    },
    onError: (error) => {
      toast({
        title: "Failed to update schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleNewSchedule = () => {
    form.reset();
    navigate("/schedule?action=new");
    setShowForm(true);
  };
  
  const handleEditSchedule = (id: number) => {
    navigate(`/schedule?edit=${id}`);
    setShowForm(true);
  };
  
  const handleDeleteSchedule = (id: number) => {
    setDeleteScheduleId(id);
  };
  
  const confirmDeleteSchedule = () => {
    if (deleteScheduleId) {
      deleteScheduleMutation.mutate(deleteScheduleId);
    }
  };
  
  const onSubmit = (values: ScheduleFormValues) => {
    if (editId) {
      updateScheduleMutation.mutate({ id: parseInt(editId), values });
    } else {
      createScheduleMutation.mutate(values);
    }
  };
  
  const getShowTitle = (showId: number): string => {
    const show = shows?.find(s => s.id === showId);
    return show ? show.title : `Show #${showId}`;
  };
  
  const formatDateTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            Scheduled
          </Badge>
        );
      case 'auto-rotation':
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
            <RefreshCw className="mr-1 h-3 w-3" />
            Auto-rotation
          </Badge>
        );
      case 'pre-recorded':
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Pre-recorded
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            {status}
          </Badge>
        );
    }
  };
  
  const isLoading = isLoadingSchedules || isLoadingShows || (!!editId && isLoadingSchedule);
  
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
                <h1 className="text-2xl font-semibold text-gray-900">Schedule</h1>
                <div className="mt-3 sm:mt-0">
                  {!showForm && (
                    <Button onClick={handleNewSchedule}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Schedule New Show
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              {showForm ? (
                <Card>
                  <CardHeader>
                    <CardTitle>{editId ? "Edit Schedule" : "Create New Schedule"}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          <FormField
                            control={form.control}
                            name="showId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Show</FormLabel>
                                <Select 
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={field.value.toString()}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a show" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {shows?.map((show) => (
                                      <SelectItem key={show.id} value={show.id.toString()}>
                                        {show.title}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Select the show to schedule
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="startTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Start Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="endTime"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>End Time</FormLabel>
                                  <FormControl>
                                    <Input type="datetime-local" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select 
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="auto-rotation">Auto-rotation</SelectItem>
                                    <SelectItem value="pre-recorded">Pre-recorded</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  Set the status of this schedule
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="isRecurring"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>
                                    Recurring Schedule
                                  </FormLabel>
                                  <FormDescription>
                                    Check if this show repeats on a schedule
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />
                          
                          {form.watch("isRecurring") && (
                            <FormField
                              control={form.control}
                              name="recurringDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Recurring Days</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="e.g. monday,wednesday,friday" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormDescription>
                                    Enter comma-separated day names (monday,tuesday,etc.)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}
                          
                          <div className="flex justify-end space-x-4">
                            <Button 
                              variant="outline" 
                              type="button"
                              onClick={() => {
                                setShowForm(false);
                                navigate("/schedule");
                              }}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                            >
                              {(createScheduleMutation.isPending || updateScheduleMutation.isPending) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              {editId ? "Update Schedule" : "Create Schedule"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Upcoming Schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : schedules && schedules.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Show</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Recurring</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {schedules.map((schedule) => (
                            <TableRow key={schedule.id}>
                              <TableCell className="font-medium">
                                {getShowTitle(schedule.showId)}
                              </TableCell>
                              <TableCell>{formatDateTime(schedule.startTime)}</TableCell>
                              <TableCell>{formatDateTime(schedule.endTime)}</TableCell>
                              <TableCell>
                                {getStatusBadge(schedule.status)}
                              </TableCell>
                              <TableCell>
                                {schedule.isRecurring ? (
                                  <Badge variant="outline" className="bg-teal-100 text-teal-800 border-teal-200">
                                    <RefreshCw className="mr-1 h-3 w-3" />
                                    {schedule.recurringDays || "Weekly"}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditSchedule(schedule.id)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the
                                        scheduled show.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteSchedule}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteScheduleMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : "Delete Schedule"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No schedules found</h3>
                        <p className="text-gray-500 mb-4">Get started by scheduling a show.</p>
                        <Button onClick={handleNewSchedule}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Schedule New Show
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
