import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { MediaUpload } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import UploadForm from "@/components/media/upload-form";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PlusCircle,
  Trash2,
  Loader2,
  Upload,
  FileImage,
  FileAudio,
  Download,
  Eye,
  HardDrive
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
import { Badge } from "@/components/ui/badge";

export default function MediaPage() {
  const [location, navigate] = useLocation();
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const showUpload = searchParams.get("action") === "upload";
  const { toast } = useToast();
  
  const [deleteMediaId, setDeleteMediaId] = useState<number | null>(null);
  
  // Fetch media
  const { data: media, isLoading } = useQuery<MediaUpload[]>({
    queryKey: ["/api/media"],
  });
  
  // Delete media mutation
  const deleteMediaMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/media/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Media deleted",
        description: "The media file has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/media"] });
      setDeleteMediaId(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete media",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleNewUpload = () => {
    navigate("/media?action=upload");
  };
  
  const handleDeleteMedia = (id: number) => {
    setDeleteMediaId(id);
  };
  
  const confirmDeleteMedia = () => {
    if (deleteMediaId) {
      deleteMediaMutation.mutate(deleteMediaId);
    }
  };
  
  const handleUploadSuccess = () => {
    navigate("/media");
  };
  
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (fileType.startsWith('audio/')) {
      return <FileAudio className="h-5 w-5 text-purple-500" />;
    } else {
      return <HardDrive className="h-5 w-5 text-gray-500" />;
    }
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
                <h1 className="text-2xl font-semibold text-gray-900">Media</h1>
                <div className="mt-3 sm:mt-0">
                  {!showUpload && (
                    <Button onClick={handleNewUpload}>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Media
                    </Button>
                  )}
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
              {showUpload ? (
                <div className="mb-6">
                  <UploadForm onSuccess={handleUploadSuccess} />
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Media Library</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center items-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : media && media.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>File</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead>Upload Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {media.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center">
                                  {getFileIcon(item.fileType)}
                                  <span className="ml-2">{item.fileName}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {item.fileType.startsWith('image/') ? (
                                  <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                                    Image
                                  </Badge>
                                ) : item.fileType.startsWith('audio/') ? (
                                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                                    Audio
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                    {item.fileType.split('/')[1]?.toUpperCase() || "Unknown"}
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>{formatFileSize(item.fileSize)}</TableCell>
                              <TableCell>
                                {item.uploadDate ? format(new Date(item.uploadDate), 'MMM d, yyyy') : 'Unknown'}
                              </TableCell>
                              <TableCell className="text-right space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  asChild
                                >
                                  <a 
                                    href={`/uploads/${item.filePath.split('/').pop()}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    {item.fileType.startsWith('image/') ? (
                                      <>
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                      </>
                                    ) : (
                                      <>
                                        <Download className="mr-2 h-4 w-4" />
                                        Download
                                      </>
                                    )}
                                  </a>
                                </Button>
                                
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                      onClick={() => handleDeleteMedia(item.id)}
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
                                        media file from our servers.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={confirmDeleteMedia}
                                        className="bg-red-600 hover:bg-red-700"
                                      >
                                        {deleteMediaMutation.isPending ? (
                                          <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Deleting...
                                          </>
                                        ) : "Delete Media"}
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
                        <HardDrive className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No media files found</h3>
                        <p className="text-gray-500 mb-4">Upload media files to use in your radio station.</p>
                        <Button onClick={handleNewUpload}>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Media
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
