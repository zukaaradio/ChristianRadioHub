import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const uploadFormSchema = z.object({
  file: z.instanceof(FileList).refine(files => files.length > 0, {
    message: "Please select a file to upload.",
  }),
});

type UploadFormValues = z.infer<typeof uploadFormSchema>;

interface UploadFormProps {
  onSuccess?: () => void;
}

export default function UploadForm({ onSuccess }: UploadFormProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const form = useForm<UploadFormValues>({
    resolver: zodResolver(uploadFormSchema),
    defaultValues: {
      file: undefined,
    },
  });
  
  async function onSubmit(data: UploadFormValues) {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const formData = new FormData();
      formData.append("file", data.file[0]);
      
      // Create a custom request to track upload progress
      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
        }
      });
      
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);
          toast({
            title: "Upload complete",
            description: "Your file has been uploaded successfully.",
          });
          
          // Reset the form
          form.reset();
          
          // Invalidate the media query to refresh the list
          queryClient.invalidateQueries({ queryKey: ["/api/media"] });
          
          // Navigate back or call success callback
          if (onSuccess) {
            onSuccess();
          } else {
            navigate("/media");
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`);
        }
        
        setIsUploading(false);
      });
      
      xhr.addEventListener("error", () => {
        setIsUploading(false);
        toast({
          title: "Upload failed",
          description: "There was an error uploading your file.",
          variant: "destructive",
        });
      });
      
      xhr.addEventListener("abort", () => {
        setIsUploading(false);
        toast({
          title: "Upload cancelled",
          description: "The upload was cancelled.",
          variant: "destructive",
        });
      });
      
      xhr.open("POST", "/api/media/upload");
      xhr.withCredentials = true;
      xhr.send(formData);
      
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upload Media</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { value, onChange, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>Select File</FormLabel>
                  <FormControl>
                    <div className="flex flex-col gap-4">
                      <Input 
                        type="file" 
                        accept="audio/*,image/*"
                        onChange={(e) => onChange(e.target.files)}
                        disabled={isUploading}
                        {...fieldProps}
                      />
                      
                      {isUploading && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <Progress value={uploadProgress} />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload audio files (MP3, WAV) or images (JPG, PNG) for your radio station.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="px-0 pb-0 pt-6">
              <Button 
                type="submit" 
                disabled={isUploading}
                className="mr-4"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </>
                )}
              </Button>
              
              <Button 
                variant="outline" 
                type="button" 
                onClick={() => navigate("/media")}
                disabled={isUploading}
              >
                Cancel
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
