import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import EnhancedRadioPlayer from "@/components/player/enhanced-radio-player";
import { User, Music, Calendar, Clock, ChevronRight } from "lucide-react";
import { Stream, Show, Schedule } from "@shared/schema";
import { format } from "date-fns";

interface StreamResponse {
  stream: Stream;
  currentShow?: Show;
}

export default function HomePage() {
  const { data: currentStreamData } = useQuery<StreamResponse>({
    queryKey: ["/api/public/current-stream"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: upcomingSchedules } = useQuery<Schedule[]>({
    queryKey: ["/api/schedules/upcoming"],
    refetchInterval: 300000, // Refresh every 5 minutes
  });

  const { data: shows } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });

  // Get show details for schedules
  const schedulesWithShows = upcomingSchedules?.map(schedule => {
    const show = shows?.find(s => s.id === schedule.showId);
    return { ...schedule, show };
  }).slice(0, 3);

  const formatDateTime = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13.5V15m-6 4h12a2 2 0 002-2v-12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h1 className="text-2xl font-bold">Grace Waves Radio</h1>
            </div>
            <div>
              <Link href="/auth">
                <Button variant="outline" className="border-white text-white hover:bg-primary-700">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Radio Player Section */}
      <section className="py-6 border-b border-gray-200">
        <div className="container mx-auto px-4">
          <EnhancedRadioPlayer />
        </div>
      </section>

      {/* Current Show Section */}
      <section className="py-12 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-foreground">Now Playing</h2>
            <div className="scripture font-serif text-lg text-muted-foreground italic mt-2">
              "Let everything that has breath praise the Lord." — Psalm 150:6
            </div>
          </div>

          {currentStreamData ? (
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-lg overflow-hidden">
                <div className="bg-primary-800 py-4 px-6 text-white">
                  <h3 className="text-xl font-semibold">{currentStreamData.currentShow?.title || currentStreamData.stream.title}</h3>
                  <p className="text-primary-100">{currentStreamData.currentShow?.host || "Live Stream"}</p>
                </div>
                <CardContent className="p-6">
                  <p className="text-gray-700 mb-4">
                    {currentStreamData.currentShow?.description || currentStreamData.stream.description}
                  </p>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>Currently Live</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <p>No active stream at the moment. Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      {/* Upcoming Shows Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-foreground mb-6">Upcoming Shows</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {schedulesWithShows && schedulesWithShows.length > 0 ? (
              schedulesWithShows.map((schedule) => (
                <Card key={schedule.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start mb-4">
                      <div className="bg-primary-100 p-3 rounded-full mr-4">
                        <Music className="h-6 w-6 text-primary-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{schedule.show?.title || `Show #${schedule.showId}`}</h3>
                        <p className="text-sm text-muted-foreground">Host: {schedule.show?.host || "Unknown host"}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="text-muted-foreground">{formatDateTime(schedule.startTime)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {schedule.show?.description || "No description available"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p>No upcoming shows scheduled at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-primary-800 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-6">About Grace Waves Radio</h2>
            <p className="text-lg mb-8">
              Grace Waves Radio is dedicated to spreading God's word through uplifting content,
              inspirational music, and spiritual teachings. Our mission is to reach listeners
              worldwide with messages of hope, faith, and love.
            </p>
            <div className="font-serif italic text-xl mb-8">
              "For I know the plans I have for you," declares the LORD, "plans to prosper you
              and not to harm you, plans to give you hope and a future." — Jeremiah 29:11
            </div>
            <Link href="/auth">
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-primary-900">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13.5V15m-6 4h12a2 2 0 002-2v-12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-semibold">Grace Waves Radio</span>
              </div>
            </div>
            <div>
              <p className="text-sm">&copy; {new Date().getFullYear()} Grace Waves Radio. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
