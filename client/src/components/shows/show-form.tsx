import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertShowSchema, Show } from "@shared/schema";
import { useLocation } from "wouter";

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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";

const showFormSchema = insertShowSchema.extend({
  coverImageFile: z.instanceof(FileList).optional(),
  audioFile: z.instanceof(FileList).optional(),
});

type ShowFormValues = z.infer<typeof showFormSchema>;

interface ShowFormProps {
  showId?: string;
  onSuccess?: () => void;
}

export default function ShowForm({ showId, onSuccess }: ShowFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!!showId);
  
  // Fetch show data if editing
  const { data: show, isLoading: isLoadingShow } = useQuery<Show>({
    queryKey: [`/api/shows/${showId}`],
    enabled: !!showId,
  });
  
  const form = useForm<ShowFormValues>({
    resolver: zodResolver(showFormSchema),
    defaultValues: {
      title: "",
      host: "",
      description: "",
      isRecorded: false,
      autoRotation: false,
    },
  });
  
  // Update form when show data is loaded
  useEffect(() => {
    if (show) {
      form.reset({
        title: show.title,
        host: show.host,
        description: show.description,
        coverImage: show.coverImage,
        isRecorded: show.isRecorded,
        audioFile: undefined,
        autoRotation: show.autoRotation,
      });
    }
  }, [show, form]);
  
  const createShowMutation = useMutation({
    mutationFn: async (data: ShowFormValues) => {
      // Handle file uploads if present
      const formData = new FormData();
      
      // Upload cover image if selected
      let coverImagePath = data.coverImage;
      if (data.coverImageFile && data.coverImageFile.length > 0) {
        const coverImageFormData = new FormData();
        coverImageFormData.append("file", data.coverImageFile[0]);
        
        const uploadResponse = await fetch("/api/media/upload", {
          method: "POST",
          body: coverImageFormData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload cover image");
        }
        
        const uploadResult = await uploadResponse.json();
        coverImagePath = uploadResult.filePath;
      }
      
      // Upload audio file if selected
      let audioFilePath = data.audioFile;
      if (data.audioFile && data.audioFile.length > 0) {
        const audioFileFormData = new FormData();
        audioFileFormData.append("file", data.audioFile[0]);
        
        const uploadResponse = await fetch("/api/media/upload", {
          method: "POST",
          body: audioFileFormData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload audio file");
        }
        
        const uploadResult = await uploadResponse.json();
        audioFilePath = uploadResult.filePath;
      }
      
      // Create show with uploaded file paths
      const showData = {
        title: data.title,
        host: data.host,
        description: data.description,
        coverImage: coverImagePath,
        isRecorded: data.isRecorded,
        audioFile: audioFilePath,
        autoRotation: data.autoRotation,
      };
      
      const response = await apiRequest("POST", "/api/shows", showData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Show created",
        description: "Your new show has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/shows");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create show",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateShowMutation = useMutation({
    mutationFn: async (data: ShowFormValues) => {
      // Handle file uploads if present
      let coverImagePath = data.coverImage;
      if (data.coverImageFile && data.coverImageFile.length > 0) {
        const coverImageFormData = new FormData();
        coverImageFormData.append("file", data.coverImageFile[0]);
        
        const uploadResponse = await fetch("/api/media/upload", {
          method: "POST",
          body: coverImageFormData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload cover image");
        }
        
        const uploadResult = await uploadResponse.json();
        coverImagePath = uploadResult.filePath;
      }
      
      // Upload audio file if selected
      let audioFilePath = data.audioFile;
      if (data.audioFile && data.audioFile.length > 0) {
        const audioFileFormData = new FormData();
        audioFileFormData.append("file", data.audioFile[0]);
        
        const uploadResponse = await fetch("/api/media/upload", {
          method: "POST",
          body: audioFileFormData,
          credentials: "include",
        });
        
        if (!uploadResponse.ok) {
          throw new Error("Failed to upload audio file");
        }
        
        const uploadResult = await uploadResponse.json();
        audioFilePath = uploadResult.filePath;
      }
      
      // Update show with uploaded file paths
      const showData = {
        title: data.title,
        host: data.host,
        description: data.description,
        coverImage: coverImagePath,
        isRecorded: data.isRecorded,
        audioFile: audioFilePath,
        autoRotation: data.autoRotation,
      };
      
      const response = await apiRequest("PUT", `/api/shows/${showId}`, showData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Show updated",
        description: "Your show has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/shows"] });
      queryClient.invalidateQueries({ queryKey: [`/api/shows/${showId}`] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/shows");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update show",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: ShowFormValues) {
    if (isEditing) {
      updateShowMutation.mutate(data);
    } else {
      createShowMutation.mutate(data);
    }
  }
  
  if (isLoadingShow && isEditing) {
    return (
      <Card className="w-full">
        <CardContent className="p-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Show" : "Create New Show"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Show Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter show title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your show.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="host"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Host</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter host name" {...field} />
                  </FormControl>
                  <FormDescription>
                    The name of the show host or presenter.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your show" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about the show content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="coverImageFile"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Cover Image</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => onChange(e.target.files)}
                        {...fieldProps}
                      />
                      {show?.coverImage && (
                        <div className="h-16 w-16 border rounded overflow-hidden flex items-center justify-center">
                          <img 
                            src={`/uploads/${show.coverImage.split('/').pop()}`} 
                            alt="Cover"
                            className="max-h-full max-w-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a cover image for your show.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="isRecorded"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Pre-recorded Show
                      </FormLabel>
                      <FormDescription>
                        If checked, you can upload an audio file for this show.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="autoRotation"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Auto-rotation
                      </FormLabel>
                      <FormDescription>
                        If checked, this show will be included in the auto-rotation schedule.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            {form.watch("isRecorded") && (
              <FormField
                control={form.control}
                name="audioFile"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel>Audio File</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input 
                          type="file" 
                          accept="audio/*"
                          onChange={(e) => onChange(e.target.files)}
                          {...fieldProps}
                        />
                        {show?.audioFile && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <a href={`/uploads/${show.audioFile.split('/').pop()}`} target="_blank" rel="noopener noreferrer">
                              <Upload className="mr-2 h-4 w-4" />
                              Play Current
                            </a>
                          </Button>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      Upload the audio file for this pre-recorded show.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <CardFooter className="px-0 pb-0 pt-6">
              <Button 
                type="submit" 
                disabled={createShowMutation.isPending || updateShowMutation.isPending}
                className="mr-4"
              >
                {(createShowMutation.isPending || updateShowMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Show" : "Create Show"}
              </Button>
              
              <Button variant="outline" type="button" onClick={() => navigate("/shows")}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
