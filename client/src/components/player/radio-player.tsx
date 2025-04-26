import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Stream, Show } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";

interface StreamResponse {
  stream: Stream;
  currentShow?: Show;
}

export default function RadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { data, isLoading, isError } = useQuery<StreamResponse>({
    queryKey: ["/api/public/current-stream"],
    refetchInterval: 60000, // Refresh every minute
  });
  
  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // Set the stream URL when data is loaded
    if (data?.stream?.streamUrl) {
      audioRef.current.src = data.stream.streamUrl;
      
      // Setup event listeners for the audio element
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => setIsPlaying(false);
      audioRef.current.onerror = () => {
        setIsPlaying(false);
        console.error("Error playing audio");
      };
      
      // Set the volume
      audioRef.current.volume = volume / 100;
      
      // Check if we should start playing
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.error("Failed to play:", err);
          setIsPlaying(false);
        });
      }
    }
    
    // Cleanup on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, [data, volume]);
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Failed to play:", err);
          setIsPlaying(false);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
      
      // If we're adjusting volume up from zero, unmute
      if (isMuted && newVolume > 0) {
        setIsMuted(false);
      }
      
      // If we're adjusting volume to zero, mute
      if (newVolume === 0) {
        setIsMuted(true);
      }
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
      } else {
        audioRef.current.volume = 0;
      }
      setIsMuted(!isMuted);
    }
  };
  
  if (isLoading) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-4">
            <p className="text-gray-500">Loading stream information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError || !data?.stream) {
    return (
      <Card className="w-full bg-white">
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-4">
            <p className="text-red-500">No active stream available</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const { stream, currentShow } = data;
  
  return (
    <Card className="w-full bg-primary-800 text-white">
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white bg-primary-700 hover:bg-primary-600 h-12 w-12 rounded-full"
            onClick={togglePlayPause}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </Button>
          
          <div className="flex-1">
            <div className="font-semibold tracking-tight">
              {currentShow?.title || stream.title}
            </div>
            <div className="text-sm text-primary-100">
              {currentShow?.host || "Live Stream"}
            </div>
          </div>
          
          <div className="flex items-center space-x-2 w-36">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-100 hover:text-white"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
