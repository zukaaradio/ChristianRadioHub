import { useState } from "react";
import { 
  Bell, 
  Search, 
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import Sidebar from "./sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export default function TopNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  return (
    <div className="relative z-10 flex-shrink-0 flex h-16 bg-background shadow">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden px-4 text-foreground">
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar mobile onClose={() => setIsOpen(false)} />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <form className="w-full flex md:ml-0" action="#" method="GET">
            <label htmlFor="search-field" className="sr-only">
              Search
            </label>
            <div className="relative w-full text-muted-foreground focus-within:text-foreground">
              <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-3">
                <Search className="h-5 w-5" />
              </div>
              <Input
                id="search-field"
                className="block w-full h-full pl-10 pr-3 py-2 border-transparent rounded-md focus:outline-none focus:ring-0 focus:border-transparent sm:text-sm"
                placeholder="Search"
                type="search"
                name="search"
              />
            </div>
          </form>
        </div>
        <div className="ml-4 flex items-center md:ml-6 space-x-2">
          <ThemeToggle />
          
          <Button
            variant="ghost"
            size="icon"
            className="p-1 rounded-full text-muted-foreground hover:text-foreground"
          >
            <span className="sr-only">View notifications</span>
            <Bell className="h-6 w-6" />
          </Button>

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div>
              <Button
                variant="ghost"
                size="icon"
                className="max-w-xs rounded-full flex items-center text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                id="user-menu-button"
              >
                <span className="sr-only">Open user menu</span>
                <Avatar>
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary-100 text-primary-800 font-medium">
                    {user?.fullName?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
