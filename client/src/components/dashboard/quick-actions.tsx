import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { PlusCircle, Upload, Calendar, Settings } from "lucide-react";

export default function QuickActions() {
  const actions = [
    {
      icon: <PlusCircle className="text-primary-600 h-8 w-8 mb-2" />,
      title: "Add New Show",
      href: "/shows?action=new"
    },
    {
      icon: <Upload className="text-purple-600 h-8 w-8 mb-2" />,
      title: "Upload Media",
      href: "/media?action=upload"
    },
    {
      icon: <Calendar className="text-yellow-600 h-8 w-8 mb-2" />,
      title: "Schedule Show",
      href: "/schedule?action=new"
    },
    {
      icon: <Settings className="text-gray-600 h-8 w-8 mb-2" />,
      title: "Stream Settings",
      href: "/streams"
    }
  ];
  
  return (
    <Card className="mt-8">
      <CardHeader className="pb-3">
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {actions.map((action, index) => (
            <Link key={index} href={action.href}>
              <a className="block w-full py-6 px-3 text-center bg-white hover:bg-gray-50 shadow border border-gray-200 rounded-lg">
                {action.icon}
                <span className="mt-2 block text-sm font-medium text-gray-900">{action.title}</span>
              </a>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
