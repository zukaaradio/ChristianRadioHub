import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Volume2, VolumeX, Music, Clock, Radio, User, Calendar } from "lucide-react";
import { Stream, Show } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface StreamResponse {
  stream: Stream;
  currentShow?: Show;
}

export default function EnhancedRadioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [expandedView, setExpandedView] = useState(false);
  const [listenTime, setListenTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const listenTimerRef = useRef<NodeJS.Timeout | null>(null);
  
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
      if (listenTimerRef.current) {
        clearInterval(listenTimerRef.current);
      }
    };
  }, [data, volume]);

  // Listen time tracker
  useEffect(() => {
    if (isPlaying) {
      // Start the timer
      listenTimerRef.current = setInterval(() => {
        setListenTime(prev => prev + 1);
      }, 1000);
    } else {
      // Stop the timer
      if (listenTimerRef.current) {
        clearInterval(listenTimerRef.current);
      }
    }
    
    return () => {
      if (listenTimerRef.current) {
        clearInterval(listenTimerRef.current);
      }
    };
  }, [isPlaying]);
  
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
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  if (isLoading) {
    return (
      <Card className="w-full bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-center p-4">
            <p className="text-muted-foreground">Loading stream information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isError || !data?.stream) {
    return (
      <Card className="w-full bg-card">
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
    <Card className={`w-full transition-all duration-300 ${expandedView ? 'bg-gradient-to-br from-primary-800 to-primary-950' : 'bg-primary-800'} text-white`}>
      <CardContent className={`p-4 ${expandedView ? 'pb-6' : ''}`}>
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
            <div className="font-semibold tracking-tight text-xl">
              {currentShow?.title || stream.title}
            </div>
            <div className="text-sm text-primary-100 flex items-center gap-1">
              <User className="h-3 w-3" />
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
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedView(!expandedView)}
            className="text-primary-100 hover:text-white"
          >
            {expandedView ? "Show Less" : "Show More"}
          </Button>
        </div>
        
        {expandedView && (
          <div className="mt-6 space-y-4 animate-fadeIn">
            <Separator className="bg-primary-700" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-primary-700/50 rounded-lg p-4">
                <div className="text-primary-100 text-sm mb-1 flex items-center">
                  <Music className="h-4 w-4 mr-1" /> Now Playing
                </div>
                <p className="font-medium text-lg">{currentShow?.title || stream.title}</p>
                {currentShow && (
                  <Badge className="bg-primary-600 text-white border-none mt-2">
                    {currentShow.isRecorded ? "Pre-recorded" : "Live"}
                  </Badge>
                )}
              </div>
              
              <div className="bg-primary-700/50 rounded-lg p-4">
                <div className="text-primary-100 text-sm mb-1 flex items-center">
                  <User className="h-4 w-4 mr-1" /> Host
                </div>
                <p className="font-medium">{currentShow?.host || "Station DJ"}</p>
                {currentShow?.description && (
                  <p className="text-sm text-primary-100 mt-2 line-clamp-2">
                    {currentShow.description}
                  </p>
                )}
              </div>
              
              <div className="bg-primary-700/50 rounded-lg p-4">
                <div className="text-primary-100 text-sm mb-1 flex items-center">
                  <Clock className="h-4 w-4 mr-1" /> Your Session
                </div>
                <p className="font-medium">{formatTime(listenTime)}</p>
                <p className="text-xs text-primary-100 mt-1">
                  Started at {format(new Date(), 'h:mm a')}
                </p>
              </div>
            </div>
            
            {currentShow?.description && (
              <div className="bg-primary-700/30 rounded-lg p-4 max-w-3xl">
                <div className="text-primary-100 text-sm mb-2 flex items-center">
                  <Radio className="h-4 w-4 mr-1" /> About This Show
                </div>
                <p className="text-sm leading-relaxed">{currentShow.description}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}