import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Show } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import ShowForm from "@/components/shows/show-form";
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
  Headphones,
  Music,
  RefreshCw,
  FileImage
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ShowsPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("edit");
  const showAction = searchParams.get("action");
  const { toast } = useToast();
  
  const [deleteShowId, setDeleteShowId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(!!editId || showAction === "new");
  
  // Fetch shows
  const { data: shows, isLoading } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });
  
  // Delete show mutation
  const deleteShowMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/shows/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Show deleted",
        description: "The show has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      setDeleteShowId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete show",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleNewShow = () => {
    navigate("/shows?action=new");
    setShowForm(true);
  };
  
  const handleEditShow = (id: number) => {
    navigate(`/shows?edit=${id}`);
    setShowForm(true);
  };
  
  const handleDeleteShow = (id: number) => {
    setDeleteShowId(id);
  };
  
  const confirmDeleteShow = () => {
    if (deleteShowId) {
      deleteShowMutation.mutate(deleteShowId);
    }
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    navigate("/shows");
  };
  
  // Render cover image or fallback
  const renderCoverImage = (show: Show) => {
    if (show.coverImage) {
      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={`/uploads/${show.coverImage.split('/').pop()}`} alt={show.title} />
          <AvatarFallback>{show.title.charAt(0)}</AvatarFallback>
        </Avatar>
      );
    }
    
    return (
      <Avatar className="h-10 w-10">
        <AvatarFallback className="bg-primary-100 text-primary-800">
          {show.title.charAt(0)}
        </AvatarFallback>
      </Avatar>
    );
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
              <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Shows</h1>
                <div className="mt-3 sm:mt-0">
                  {!showForm && (
                    <Button onClick={handleNewShow}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Show
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              {showForm ? (
                <div className="mb-6">
                  <ShowForm 
                    showId={editId || undefined} 
                    onSuccess={handleFormSuccess} 
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>All Shows</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : shows && shows.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[80px]"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Host</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shows.map((show) => (
                            <TableRow key={show.id}>
                              <TableCell>
                                {renderCoverImage(show)}
                              </TableCell>
                              <TableCell className="font-medium">{show.title}</TableCell>
                              <TableCell>{show.host}</TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {show.isRecorded ? (
                                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200 inline-flex items-center">
                                      <Music className="mr-1 h-3 w-3" />
                                      Pre-recorded
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200 inline-flex items-center">
                                      <Headphones className="mr-1 h-3 w-3" />
                                      Live
                                    </Badge>
                                  )}
                                  
                                  {show.autoRotation && (
                                    <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 inline-flex items-center">
                                      <RefreshCw className="mr-1 h-3 w-3" />
                                      Auto-rotation
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditShow(show.id)}
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
                                      onClick={() => handleDeleteShow(show.id)}
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
                                        show and any schedules associated with it.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteShow}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteShowMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : "Delete Show"}
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
                        <FileImage className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No shows found</h3>
                        <p className="text-gray-500 mb-4">Get started by creating a new show.</p>
                        <Button onClick={handleNewShow}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add New Show
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
