import Sidebar from "@/components/layout/sidebar";
import TopNav from "@/components/layout/top-nav";
import StatsCards from "@/components/dashboard/stats-cards";
import StreamStatus from "@/components/dashboard/stream-status";
import UpcomingShows from "@/components/dashboard/upcoming-shows";
import AnalyticsSummary from "@/components/dashboard/analytics-summary";
import QuickActions from "@/components/dashboard/quick-actions";

export default function DashboardPage() {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - hidden on mobile */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation */}
        <TopNav />
        
        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
                <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                <div className="mt-3 sm:mt-0 sm:ml-4">
                  <div className="font-serif text-sm text-gray-600 italic">
                    "Let everything that has breath praise the Lord." — Psalm 150:6
                  </div>
                </div>
              </div>
            </div>
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Stats Cards */}
              <StatsCards />
              
              {/* Current Stream Status */}
              <StreamStatus />
              
              {/* Upcoming Shows */}
              <UpcomingShows />
              
              {/* Analytics Summary */}
              <AnalyticsSummary />
              
              {/* Quick Actions */}
              <QuickActions />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
