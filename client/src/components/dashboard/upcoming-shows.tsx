import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Schedule, Show } from "@shared/schema";
import { Link } from "wouter";
import { format } from "date-fns";

interface UpcomingSchedule extends Schedule {
  show?: Show;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'scheduled':
      return (
        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Scheduled
        </Badge>
      );
    case 'auto-rotation':
      return (
        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
          Auto-rotation
        </Badge>
      );
    case 'pre-recorded':
      return (
        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
          Pre-recorded
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
          {status}
        </Badge>
      );
  }
}

export default function UpcomingShows() {
  const { data: schedules, isLoading } = useQuery<UpcomingSchedule[]>({
    queryKey: ["/api/schedules/upcoming"],
  });
  
  const { data: shows } = useQuery<Show[]>({
    queryKey: ["/api/shows"],
  });
  
  // Join shows with schedules
  const schedulesWithShows = schedules?.map(schedule => {
    const show = shows?.find(show => show.id === schedule.showId);
    return { ...schedule, show };
  });
  
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Upcoming Shows</h2>
        <Link href="/schedule">
          <a className="text-sm font-medium text-primary-600 hover:text-primary-500">
            View all<span className="hidden lg:inline"> shows</span>
          </a>
        </Link>
      </div>
      
      {isLoading ? (
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <div className="p-4 text-center text-gray-500">Loading upcoming shows...</div>
        </div>
      ) : schedulesWithShows && schedulesWithShows.length > 0 ? (
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Show</TableHead>
                <TableHead className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 lg:table-cell">Host</TableHead>
                <TableHead className="hidden px-3 py-3.5 text-left text-sm font-semibold text-gray-900 sm:table-cell">Time</TableHead>
                <TableHead className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</TableHead>
                <TableHead className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200 bg-white">
              {schedulesWithShows.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {schedule.show?.title || `Show #${schedule.showId}`}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 lg:table-cell">
                    {schedule.show?.host || "Unknown host"}
                  </TableCell>
                  <TableCell className="hidden whitespace-nowrap px-3 py-4 text-sm text-gray-500 sm:table-cell">
                    {schedule.startTime && schedule.endTime ? (
                      <>
                        {format(new Date(schedule.startTime), "h:mm a")} - {format(new Date(schedule.endTime), "h:mm a")}
                      </>
                    ) : "No time info"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(schedule.status)}
                  </TableCell>
                  <TableCell className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <Link href={`/schedule?edit=${schedule.id}`}>
                      <a className="text-primary-600 hover:text-primary-900 mr-4">Edit</a>
                    </Link>
                    <Button 
                      variant="ghost" 
                      className="text-red-600 hover:text-red-900"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="mt-4 overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
          <div className="p-8 text-center text-gray-500">
            No upcoming shows scheduled. 
            <Link href="/schedule">
              <a className="text-primary-600 hover:text-primary-500 ml-2">
                Schedule a show
              </a>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
