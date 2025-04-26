import { Button } from "@/components/ui/button";
import { 
  Copy, 
  StopCircle, 
  Edit, 
  BarChart 
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { Stream, Show } from "@shared/schema";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";

interface StreamResponse {
  stream: Stream;
  currentShow?: Show;
}

export default function StreamStatus() {
  const { toast } = useToast();
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  
  const { data, isLoading, isError } = useQuery<StreamResponse>({
    queryKey: ["/api/public/current-stream"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  const stopStreamMutation = useMutation({
    mutationFn: async (streamId: number) => {
      await apiRequest("PUT", `/api/streams/${streamId}`, { isActive: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/public/current-stream"] });
      toast({
        title: "Stream stopped",
        description: "The stream has been stopped successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to stop stream",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleCopyStreamUrl = () => {
    if (data?.stream?.streamUrl) {
      navigator.clipboard.writeText(data.stream.streamUrl);
      toast({
        title: "URL copied",
        description: "Stream URL copied to clipboard",
      });
    }
  };
  
  const handleStopStream = () => {
    if (window.confirm("Are you sure you want to stop the current stream?") && data?.stream?.id) {
      stopStreamMutation.mutate(data.stream.id);
    }
  };
  
  if (isLoading) {
    return (
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg animate-pulse">
        <div className="px-4 py-16 sm:px-6 flex justify-center">
          <p>Loading current stream information...</p>
        </div>
      </div>
    );
  }
  
  if (isError || !data?.stream) {
    return (
      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Current Stream</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Live broadcast details and status.</p>
          </div>
          <div>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
              OFFLINE
            </Badge>
          </div>
        </div>
        <div className="px-4 py-8 flex justify-center items-center">
          <p className="text-gray-500">No active stream. Create or activate a stream to start broadcasting.</p>
        </div>
      </div>
    );
  }
  
  const { stream, currentShow } = data;
  
  return (
    <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">Current Stream</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Live broadcast details and status.</p>
        </div>
        <div>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <span className="mr-1 h-2 w-2 rounded-full bg-green-600 inline-block"></span>
            LIVE
          </Badge>
        </div>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Show Title</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentShow?.title || stream.title}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Host</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentShow?.host || "No host information"}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Stream URL</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center">
              <span className="font-mono bg-gray-100 p-1 rounded">
                {stream.streamUrl}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyStreamUrl}
                className="ml-2 p-1 text-gray-400 hover:text-gray-600"
              >
                <Copy size={16} />
              </Button>
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Time Slot</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentShow ? "Current scheduled show" : "No scheduled show information"}
            </dd>
          </div>
          <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Description</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {currentShow?.description || stream.description}
            </dd>
          </div>
          <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">Controls</dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              <div className="flex flex-wrap gap-4">
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleStopStream}
                  disabled={stopStreamMutation.isPending}
                >
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Stream
                </Button>
                
                <Link href={`/streams?edit=${stream.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                </Link>
                
                <Link href="/analytics">
                  <Button variant="outline" size="sm">
                    <BarChart className="mr-2 h-4 w-4" />
                    Statistics
                  </Button>
                </Link>
              </div>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
