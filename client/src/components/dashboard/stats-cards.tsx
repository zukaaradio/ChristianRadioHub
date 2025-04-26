import { Card, CardContent } from "@/components/ui/card";
import { Users, TrendingUp, Headphones, HardDrive } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  link?: string;
  linkText?: string;
}

function StatCard({ title, value, icon, iconBg, iconColor, link, linkText }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${iconBg} rounded-md p-3`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      {link && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <a href={link} className={`font-medium ${iconColor} hover:opacity-90`}>
              {linkText || "View details"}
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}

export default function StatsCards() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["/api/analytics/current"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });
  
  return (
    <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Current Listeners"
        value={isLoading ? "Loading..." : analytics?.currentListeners || 0}
        icon={<Users size={24} />}
        iconBg="bg-blue-100"
        iconColor="text-blue-600"
        link="/analytics"
      />
      
      <StatCard
        title="Peak Listeners Today"
        value={isLoading ? "Loading..." : analytics?.peakListeners || 0}
        icon={<TrendingUp size={24} />}
        iconBg="bg-purple-100"
        iconColor="text-purple-600"
        link="/analytics"
      />
      
      <StatCard
        title="Active Shows"
        value={isLoading ? "Loading..." : analytics?.activeShows || 0}
        icon={<Headphones size={24} />}
        iconBg="bg-yellow-100"
        iconColor="text-yellow-600"
        link="/shows"
      />
      
      <StatCard
        title="Storage Used"
        value={isLoading ? "Loading..." : analytics?.storageUsed || "0 KB"}
        icon={<HardDrive size={24} />}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        link="/media"
      />
    </div>
  );
}
