import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertStreamSchema, Stream } from "@shared/schema";
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
import { Loader2 } from "lucide-react";

const streamFormSchema = insertStreamSchema.extend({
  isActive: z.boolean().optional(),
});

type StreamFormValues = z.infer<typeof streamFormSchema>;

interface StreamFormProps {
  streamId?: string;
  onSuccess?: () => void;
}

export default function StreamForm({ streamId, onSuccess }: StreamFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(!!streamId);
  
  // Fetch stream data if editing
  const { data: stream, isLoading: isLoadingStream } = useQuery<Stream>({
    queryKey: [`/api/streams/${streamId}`],
    enabled: !!streamId,
  });
  
  const form = useForm<StreamFormValues>({
    resolver: zodResolver(streamFormSchema),
    defaultValues: {
      title: "",
      streamUrl: "",
      description: "",
      isActive: false,
    },
  });
  
  // Update form when stream data is loaded
  useEffect(() => {
    if (stream) {
      form.reset({
        title: stream.title,
        streamUrl: stream.streamUrl,
        description: stream.description,
        isActive: stream.isActive,
      });
    }
  }, [stream, form]);
  
  const createStreamMutation = useMutation({
    mutationFn: async (data: StreamFormValues) => {
      const response = await apiRequest("POST", "/api/streams", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stream created",
        description: "Your new stream has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/streams");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to create stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const updateStreamMutation = useMutation({
    mutationFn: async (data: StreamFormValues) => {
      const response = await apiRequest("PUT", `/api/streams/${streamId}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stream updated",
        description: "Your stream has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/streams"] });
      queryClient.invalidateQueries({ queryKey: [`/api/streams/${streamId}`] });
      
      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/streams");
      }
    },
    onError: (error) => {
      toast({
        title: "Failed to update stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: StreamFormValues) {
    if (isEditing) {
      updateStreamMutation.mutate(data);
    } else {
      createStreamMutation.mutate(data);
    }
  }
  
  if (isLoadingStream && isEditing) {
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
        <CardTitle>{isEditing ? "Edit Stream" : "Create New Stream"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter stream title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for your stream.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="streamUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stream URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL where your audio stream is hosted.
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
                      placeholder="Describe your stream" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide details about the stream content.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
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
                      Make this stream active
                    </FormLabel>
                    <FormDescription>
                      If checked, this stream will be set as the active stream and will be played on the radio player.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            <CardFooter className="px-0 pb-0 pt-6">
              <Button 
                type="submit" 
                disabled={createStreamMutation.isPending || updateStreamMutation.isPending}
                className="mr-4"
              >
                {(createStreamMutation.isPending || updateStreamMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update Stream" : "Create Stream"}
              </Button>
              
              <Button variant="outline" type="button" onClick={() => navigate("/streams")}>
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
