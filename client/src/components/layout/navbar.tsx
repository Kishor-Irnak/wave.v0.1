import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, Menu, PenSquare, User, Settings, LogOut } from "lucide-react";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { user, dbUser, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <svg
                className="w-8 h-8 text-primary"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z"></path>
              </svg>
              <span className="text-xl font-bold text-primary">BlogWave</span>
            </Link>
            <div className="hidden md:block">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search for blogs, authors..."
                  className="bg-gray-100 rounded-full py-2 pl-10 pr-4 w-64 text-sm"
                />
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              </div>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link href="/">
              <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                Home
              </div>
            </Link>
            <Link href="/explore">
              <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                Explore
              </div>
            </Link>
            {user && (
              <Link href="/bookmarks">
                <div className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Bookmarks
                </div>
              </Link>
            )}
            {user ? (
              <Link href="/create-blog">
                <Button className="ml-4 flex items-center">
                  <PenSquare className="w-4 h-4 mr-2" />
                  New Blog
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button className="ml-4">Sign In</Button>
              </Link>
            )}

            {/* User Dropdown */}
            {user && (
              <div className="relative ml-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="rounded-full p-0 h-8 w-8 overflow-hidden"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.photoURL || undefined} />
                        <AvatarFallback>
                          {getInitials(user.displayName || user.email || "")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${dbUser?.username || user.uid}`}>
                        <div className="flex cursor-pointer items-center">
                          <User className="mr-2 h-4 w-4" />
                          <span>Your Profile</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">
                        <div className="flex cursor-pointer items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Settings</span>
                        </div>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <Link href="/create-blog">
                <Button variant="ghost" size="icon" className="mr-2">
                  <PenSquare className="h-5 w-5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-controls="mobile-menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/">
              <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                Home
              </div>
            </Link>
            <Link href="/explore">
              <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                Explore
              </div>
            </Link>
            {user && (
              <Link href="/bookmarks">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100 cursor-pointer">
                  Bookmarks
                </div>
              </Link>
            )}
            {user ? (
              <Link href="/create-blog">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer">
                  New Blog
                </div>
              </Link>
            ) : (
              <Link href="/login">
                <div className="block px-3 py-2 rounded-md text-base font-medium text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer">
                  Sign In
                </div>
              </Link>
            )}

            {user && (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-5">
                  <div className="flex-shrink-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>
                        {getInitials(user.displayName || user.email || "")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.displayName || "User"}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.email}
                    </div>
                  </div>
                </div>
                <div className="mt-3 px-2 space-y-1">
                  <Link href={`/profile/${dbUser?.username || user.uid}`}>
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                      Your Profile
                    </a>
                  </Link>
                  <Link href="/settings">
                    <a className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100">
                      Settings
                    </a>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
