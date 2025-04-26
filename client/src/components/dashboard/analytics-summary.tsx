import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Headphones, Music, BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function AnalyticsSummary() {
  // This would be connected to real analytics data in a production environment
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/current"],
  });
  
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
      {/* Listener Demographics */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Listener Demographics</h3>
          <div className="h-64 bg-gray-50 rounded border border-gray-200 mb-4 flex items-center justify-center">
            {/* This would be a map visualization in production */}
            <div className="text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p>Geographic Distribution Map</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Top Location</p>
              <p className="text-lg font-semibold text-gray-900">Houston, TX</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">New Listeners</p>
              <p className="text-lg font-semibold text-gray-900">+42 today</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Avg. Listen Time</p>
              <p className="text-lg font-semibold text-gray-900">23 minutes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popular Shows */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Popular Shows</h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded bg-blue-100 flex items-center justify-center">
                <Headphones className="text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Morning Glory</h4>
                  <span className="text-sm text-gray-500">8,432 listeners</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                  <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded bg-purple-100 flex items-center justify-center">
                <Music className="text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Worship Hour</h4>
                  <span className="text-sm text-gray-500">6,218 listeners</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                  <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: "62%" }}></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10 rounded bg-yellow-100 flex items-center justify-center">
                <BookOpen className="text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-900">Scripture Study</h4>
                  <span className="text-sm text-gray-500">4,756 listeners</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                  <div className="bg-yellow-600 h-1.5 rounded-full" style={{ width: "48%" }}></div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/analytics">
              <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View detailed analytics
              </a>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
