import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Play, Download, Mic, RefreshCw } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

// Type for voice options
interface Voice {
  id: string;
  name: string;
  description: string;
}

// Type for announcements
interface Announcement {
  scriptText: string;
  audioPath: string;
  type: string;
  metadata: {
    voice: string;
    duration?: number;
    showId?: number;
    showTitle?: string;
    verseReference?: string;
    createdAt: string;
  };
}

// Custom form schema for voice announcements
const customAnnouncementSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters" }),
  voice: z.string(),
  includeVerse: z.boolean().default(false),
  includeTrending: z.boolean().default(false),
});

const showAnnouncementSchema = z.object({
  showId: z.string(),
  voice: z.string(),
  includeVerse: z.boolean().default(false),
});

const simpleAnnouncementSchema = z.object({
  voice: z.string(),
});

// Component for audio player with download button
function AudioPlayer({ audioPath, scriptText }: { audioPath: string; scriptText: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.createRef<HTMLAudioElement>();

  // Get the filename from the path
  const filename = audioPath.split('/').pop() || 'announcement.mp3';
  
  // Create audio URL
  const audioUrl = `/api/ai-voice/audio/${filename}`;

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card border rounded-md p-4">
        <p className="text-sm text-muted-foreground mb-2">Script:</p>
        <p className="text-sm italic">{scriptText}</p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-start gap-4">
        <audio ref={audioRef} src={audioUrl} onEnded={handleEnded} className="hidden" />
        
        <Button className="gap-2" onClick={handlePlay}>
          {isPlaying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Playing...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4" />
              <span>Play</span>
            </>
          )}
        </Button>
        
        <Button variant="outline" className="gap-2" asChild>
          <a href={audioUrl} download={filename}>
            <Download className="h-4 w-4" />
            <span>Download</span>
          </a>
        </Button>
      </div>
    </div>
  );
}

export default function VoiceAnnouncementsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("custom");
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch voice options
  const { data: voiceData, isLoading: loadingVoices } = useQuery({
    queryKey: ["/api/ai-voice/voices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai-voice/voices");
      return res.json();
    },
  });

  // Fetch shows for announcements
  const { data: showsData, isLoading: loadingShows } = useQuery({
    queryKey: ["/api/shows"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/shows");
      return res.json();
    },
  });

  // Get daily verse
  const { data: verseData, isLoading: loadingVerse } = useQuery({
    queryKey: ["/api/ai-voice/daily-verse"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai-voice/daily-verse");
      return res.json();
    },
  });

  // Get trending topics
  const { data: trendingData, isLoading: loadingTrending } = useQuery({
    queryKey: ["/api/ai-voice/trending"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai-voice/trending");
      return res.json();
    },
  });

  // Custom form setup
  const customForm = useForm<z.infer<typeof customAnnouncementSchema>>({
    resolver: zodResolver(customAnnouncementSchema),
    defaultValues: {
      prompt: "",
      voice: "nova",
      includeVerse: false,
      includeTrending: false,
    },
  });

  // Show intro form setup
  const showIntroForm = useForm<z.infer<typeof showAnnouncementSchema>>({
    resolver: zodResolver(showAnnouncementSchema),
    defaultValues: {
      showId: "",
      voice: "nova",
      includeVerse: false,
    },
  });

  // Show outro form setup
  const showOutroForm = useForm<z.infer<typeof showAnnouncementSchema>>({
    resolver: zodResolver(showAnnouncementSchema),
    defaultValues: {
      showId: "",
      voice: "nova",
      includeVerse: false,
    },
  });

  // Simple announcement forms
  const verseForm = useForm<z.infer<typeof simpleAnnouncementSchema>>({
    resolver: zodResolver(simpleAnnouncementSchema),
    defaultValues: {
      voice: "nova",
    },
  });

  const newsForm = useForm<z.infer<typeof simpleAnnouncementSchema>>({
    resolver: zodResolver(simpleAnnouncementSchema),
    defaultValues: {
      voice: "nova",
    },
  });

  const stationIdForm = useForm<z.infer<typeof simpleAnnouncementSchema>>({
    resolver: zodResolver(simpleAnnouncementSchema),
    defaultValues: {
      voice: "nova",
    },
  });

  const devotionalForm = useForm<z.infer<typeof simpleAnnouncementSchema>>({
    resolver: zodResolver(simpleAnnouncementSchema),
    defaultValues: {
      voice: "nova",
    },
  });

  // Generic generate announcement handler
  const generateAnnouncementMutation = useMutation({
    mutationFn: async ({ 
      endpoint, 
      data 
    }: { 
      endpoint: string; 
      data: any 
    }) => {
      setIsGenerating(true);
      try {
        const res = await apiRequest("POST", `/api/ai-voice/${endpoint}`, data);
        const result = await res.json();
        return result;
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Announcement generated",
        description: "Your announcement is ready to play",
      });
      setCurrentAnnouncement(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Generation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitCustom = (data: z.infer<typeof customAnnouncementSchema>) => {
    generateAnnouncementMutation.mutate({
      endpoint: "custom",
      data: {
        prompt: data.prompt,
        voice: data.voice,
        includeVerse: data.includeVerse,
        includeTrending: data.includeTrending,
      },
    });
  };

  const onSubmitShowIntro = (data: z.infer<typeof showAnnouncementSchema>) => {
    generateAnnouncementMutation.mutate({
      endpoint: "show-intro",
      data: {
        showId: data.showId,
        voice: data.voice,
        includeVerse: data.includeVerse,
      },
    });
  };

  const onSubmitShowOutro = (data: z.infer<typeof showAnnouncementSchema>) => {
    generateAnnouncementMutation.mutate({
      endpoint: "show-outro",
      data: {
        showId: data.showId,
        voice: data.voice,
      },
    });
  };

  const onSubmitSimple = (endpoint: string, voice: string) => {
    generateAnnouncementMutation.mutate({
      endpoint,
      data: { voice },
    });
  };

  // Voice selector component for reuse
  const VoiceSelector = ({ name, control }: { name: string; control: any }) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Voice</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {loadingVoices ? (
                  <SelectItem value="loading" disabled>
                    Loading voices...
                  </SelectItem>
                ) : (
                  voiceData?.voices.map((voice: Voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name} - {voice.description}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Show selector component for reuse
  const ShowSelector = ({ name, control }: { name: string; control: any }) => (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>Show</FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Select a show" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectGroup>
                {loadingShows ? (
                  <SelectItem value="loading" disabled>
                    Loading shows...
                  </SelectItem>
                ) : (
                  showsData?.map((show: any) => (
                    <SelectItem key={show.id} value={String(show.id)}>
                      {show.title} with {show.host}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <div className="container py-10 space-y-8">
      <div>
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
          AI Voice Announcements
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Create professional radio announcements for your station
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Create Announcements</CardTitle>
              <CardDescription>
                Generate AI-powered announcements to engage your listeners
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="custom" className="space-y-4">
                  <Form {...customForm}>
                    <form onSubmit={customForm.handleSubmit(onSubmitCustom)} className="space-y-4">
                      <FormField
                        control={customForm.control}
                        name="prompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Announcement Prompt</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Describe the announcement content..."
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              Describe what you want the AI to say in the announcement
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <VoiceSelector name="voice" control={customForm.control} />

                      <div className="flex flex-col gap-3 pt-2">
                        <FormField
                          control={customForm.control}
                          name="includeVerse"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Include Bible verse</FormLabel>
                                <FormDescription>
                                  Add an inspirational Bible verse to the announcement
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={customForm.control}
                          name="includeTrending"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Include trending topic</FormLabel>
                                <FormDescription>
                                  Reference a current trending Christian topic
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button type="submit" disabled={isGenerating} className="w-full">
                        {isGenerating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Generate Custom Announcement
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="presets" className="space-y-6">
                  <Tabs defaultValue="intro">
                    <TabsList className="grid grid-cols-3 mb-4">
                      <TabsTrigger value="intro">Show Intro</TabsTrigger>
                      <TabsTrigger value="outro">Show Outro</TabsTrigger>
                      <TabsTrigger value="other">Station IDs</TabsTrigger>
                    </TabsList>

                    <TabsContent value="intro" className="space-y-4">
                      <Form {...showIntroForm}>
                        <form
                          onSubmit={showIntroForm.handleSubmit(onSubmitShowIntro)}
                          className="space-y-4"
                        >
                          <ShowSelector name="showId" control={showIntroForm.control} />
                          <VoiceSelector name="voice" control={showIntroForm.control} />
                          
                          <FormField
                            control={showIntroForm.control}
                            name="includeVerse"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel>Include Bible verse</FormLabel>
                                  <FormDescription>
                                    Add an inspirational Bible verse to the introduction
                                  </FormDescription>
                                </div>
                              </FormItem>
                            )}
                          />

                          <Button type="submit" disabled={isGenerating} className="w-full">
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Mic className="mr-2 h-4 w-4" />
                                Generate Show Introduction
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    <TabsContent value="outro" className="space-y-4">
                      <Form {...showOutroForm}>
                        <form
                          onSubmit={showOutroForm.handleSubmit(onSubmitShowOutro)}
                          className="space-y-4"
                        >
                          <ShowSelector name="showId" control={showOutroForm.control} />
                          <VoiceSelector name="voice" control={showOutroForm.control} />

                          <Button type="submit" disabled={isGenerating} className="w-full">
                            {isGenerating ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Mic className="mr-2 h-4 w-4" />
                                Generate Show Outro
                              </>
                            )}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>

                    <TabsContent value="other" className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Station ID</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...stationIdForm}>
                              <form className="space-y-4">
                                <VoiceSelector name="voice" control={stationIdForm.control} />
                              </form>
                            </Form>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              disabled={isGenerating}
                              onClick={() => onSubmitSimple("station-id", stationIdForm.getValues().voice)}
                            >
                              {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mic className="mr-2 h-4 w-4" />
                              )}
                              Generate ID
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Bible Verse</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...verseForm}>
                              <form className="space-y-4">
                                <VoiceSelector name="voice" control={verseForm.control} />
                              </form>
                            </Form>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              disabled={isGenerating}
                              onClick={() => onSubmitSimple("verse", verseForm.getValues().voice)}
                            >
                              {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mic className="mr-2 h-4 w-4" />
                              )}
                              Generate Verse
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">News Update</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...newsForm}>
                              <form className="space-y-4">
                                <VoiceSelector name="voice" control={newsForm.control} />
                              </form>
                            </Form>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              disabled={isGenerating}
                              onClick={() => onSubmitSimple("news", newsForm.getValues().voice)}
                            >
                              {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mic className="mr-2 h-4 w-4" />
                              )}
                              Generate News
                            </Button>
                          </CardFooter>
                        </Card>

                        <Card>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-lg">Devotional</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Form {...devotionalForm}>
                              <form className="space-y-4">
                                <VoiceSelector name="voice" control={devotionalForm.control} />
                              </form>
                            </Form>
                          </CardContent>
                          <CardFooter>
                            <Button
                              className="w-full"
                              disabled={isGenerating}
                              onClick={() => onSubmitSimple("devotional", devotionalForm.getValues().voice)}
                            >
                              {isGenerating ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Mic className="mr-2 h-4 w-4" />
                              )}
                              Generate Devotional
                            </Button>
                          </CardFooter>
                        </Card>
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Announcement Preview</CardTitle>
              <CardDescription>
                Listen to and download your generated announcements
              </CardDescription>
            </CardHeader>
            <CardContent className="h-full flex flex-col">
              {currentAnnouncement ? (
                <AudioPlayer
                  audioPath={currentAnnouncement.audioPath}
                  scriptText={currentAnnouncement.scriptText}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="border border-dashed rounded-full p-6 mb-4">
                    <Mic className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No announcement yet</h3>
                  <p className="text-muted-foreground">
                    Your generated announcements will appear here for preview and download
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-8 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loadingVerse ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : verseData ? (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Today's Verse</h3>
                    <p className="text-sm font-semibold">{verseData.reference}</p>
                    <p className="text-sm text-muted-foreground italic">{verseData.text}</p>
                  </div>
                ) : null}
                
                <Separator />
                
                {loadingTrending ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : trendingData ? (
                  <div>
                    <h3 className="text-sm font-medium mb-1">Trending Topics</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {trendingData.topics.map((topic: string, index: number) => (
                        <div key={index} className="bg-secondary text-secondary-foreground text-xs rounded-full px-3 py-1">
                          {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </CardContent>
              <CardFooter>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/daily-verse"] });
                    queryClient.invalidateQueries({ queryKey: ["/api/ai-voice/trending"] });
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Resources
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}