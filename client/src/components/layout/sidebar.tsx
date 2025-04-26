import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  LayoutDashboard, 
  Radio, 
  Calendar, 
  Headphones, 
  FileImage, 
  LineChart, 
  Settings,
  LogOut,
  Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  active: boolean;
}

function NavItem({ icon, label, href, active }: NavItemProps) {
  return (
    <Link href={href}>
      <a className={`group flex items-center px-2 py-2 text-base rounded-md ${
        active 
          ? "text-white bg-primary-800" 
          : "text-blue-100 hover:text-white hover:bg-primary-700"
      }`}>
        <span className="mr-4 h-6 w-6">{icon}</span>
        {label}
      </a>
    </Link>
  );
}

export default function Sidebar({ mobile = false, onClose }: { mobile?: boolean, onClose?: () => void }) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const navItems = [
    { icon: <LayoutDashboard size={24} />, label: "Dashboard", href: "/dashboard" },
    { icon: <Radio size={24} />, label: "Streams", href: "/streams" },
    { icon: <Calendar size={24} />, label: "Schedule", href: "/schedule" },
    { icon: <Headphones size={24} />, label: "Shows", href: "/shows" },
    { icon: <FileImage size={24} />, label: "Media", href: "/media" },
    { icon: <LineChart size={24} />, label: "Analytics", href: "/analytics" },
    { icon: <Mic size={24} />, label: "Voice Announcements", href: "/voice-announcements" },
    { icon: <Settings size={24} />, label: "Settings", href: "/settings" },
  ];
  
  // Handle the click for mobile nav items
  const handleNavClick = () => {
    if (mobile && onClose) {
      onClose();
    }
  };
  
  return (
    <div className={`flex flex-col h-full ${mobile ? "w-64 bg-primary-800 text-white" : "w-64 bg-primary-800 text-white"}`}>
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 13.5V15m-6 4h12a2 2 0 002-2v-12a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xl font-bold">Grace Waves Radio</span>
        </div>
        
        <ScrollArea className="px-2 mt-5 flex-1">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavItem 
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                active={location === item.href}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-primary-700 p-4">
        <div className="flex items-center w-full">
          <div className="flex-shrink-0">
            <Avatar>
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary-700 text-white">
                {user?.fullName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-white">{user?.fullName || "Admin User"}</p>
            <p className="text-xs font-medium text-blue-200">Admin</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="ml-2 text-blue-200 hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
}
