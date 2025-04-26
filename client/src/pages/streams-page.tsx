import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { Stream } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import StreamForm from "@/components/streams/stream-form";
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
  Radio,
  CheckCircle
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

export default function StreamsPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const editId = searchParams.get("edit");
  const { toast } = useToast();
  
  const [deleteStreamId, setDeleteStreamId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState<boolean>(!!editId);
  
  // Fetch streams
  const { data: streams, isLoading } = useQuery<Stream[]>({
    queryKey: ["/api/streams"],
  });
  
  // Delete stream mutation
  const deleteStreamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/streams/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Stream deleted",
        description: "The stream has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      setDeleteStreamId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Activate stream mutation
  const activateStreamMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/streams/${id}/activate`);
    },
    onSuccess: () => {
      toast({
        title: "Stream activated",
        description: "The stream has been activated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to activate stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleNewStream = () => {
    setShowForm(true);
    // Clear any edit params from URL
    navigate("/streams");
  };
  
  const handleEditStream = (id: number) => {
    navigate(`/streams?edit=${id}`);
    setShowForm(true);
  };
  
  const handleDeleteStream = (id: number) => {
    setDeleteStreamId(id);
  };
  
  const confirmDeleteStream = () => {
    if (deleteStreamId) {
      deleteStreamMutation.mutate(deleteStreamId);
    }
  };
  
  const handleActivateStream = (id: number) => {
    activateStreamMutation.mutate(id);
  };
  
  const handleFormSuccess = () => {
    setShowForm(false);
    navigate("/streams");
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
                <h1 className="text-2xl font-semibold text-gray-900">Streams</h1>
                <div className="mt-3 sm:mt-0">
                  {!showForm && (
                    <Button onClick={handleNewStream}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add New Stream
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              {showForm ? (
                <div className="mb-6">
                  <StreamForm 
                    streamId={editId || undefined} 
                    onSuccess={handleFormSuccess} 
                  />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>All Streams</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : streams && streams.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>URL</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {streams.map((stream) => (
                            <TableRow key={stream.id}>
                              <TableCell className="font-medium">{stream.title}</TableCell>
                              <TableCell className="font-mono text-sm truncate max-w-[200px]">
                                {stream.streamUrl}
                              </TableCell>
                              <TableCell>
                                {stream.isActive ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    Active
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                    Inactive
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                {!stream.isActive && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleActivateStream(stream.id)}
                                    disabled={activateStreamMutation.isPending}
                                  >
                                    <Radio className="mr-2 h-4 w-4" />
                                    Activate
                                  </Button>
                                )}
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStream(stream.id)}
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
                                      onClick={() => handleDeleteStream(stream.id)}
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
                                        stream and remove it from our servers.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteStream}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteStreamMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : "Delete Stream"}
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
                        <Radio className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No streams found</h3>
                        <p className="text-gray-500 mb-4">Get started by creating a new stream.</p>
                        <Button onClick={handleNewStream}>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add New Stream
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
