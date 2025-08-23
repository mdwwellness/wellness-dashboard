"use client";

import Avatar from '@/assests/avatars/avatar2.svg'
import Image from "next/image";
import Link from "next/link";
import {
  CalendarClock,
  Home,
  PanelLeft,
  Settings,
  Stethoscope,
  UserPlus,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeToggle } from "./theme-mode/mode-toggle";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logout } from '@/actions/logout';

const navLinks = [
  {
    title: "Dasboard",
    icon: <Home className="h-5 w-5" />,
    href: "/dashboard",
  },
  {
    title: "Book Slot",
    icon: <CalendarClock className="h-5 w-5" />,
    href: "/dashboard/appointments",
  },
  {
    title: "Therapist List",
    icon: <UserPlus className="h-5 w-5" />,
    href: "/dashboard/alltherapist",
  },
];

const SlimSidebar = ({ children }: { children: React.ReactNode }) => {
  const user = useCurrentUser();
  const pathname = usePathname();

  /**
   * Array of all pathname variables, example: if pathname is "/dashboard/orders" then PATH_NAME will be ["dashboard", "orders"]
   * it is to help show the user location with breadcrums
   * @type {string[]}
   */
  let PATH_NAMES = pathname.split("/");
  PATH_NAMES = PATH_NAMES.splice(1, PATH_NAMES.length);

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 h-screen flex-col border-r bg-background sm:flex">
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-4 mt-10 ">
          <TooltipProvider>
            {navLinks.map((navItems, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Link
                    href={navItems.href}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8 ${
                      pathname === navItems.href ? `bg-accent` : ""
                    } `}
                  >
                    {navItems.icon}
                    <span className="sr-only">{navItems.title}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{navItems.title}</TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <ModeToggle />
                  <span className="sr-only">Theme</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">Theme</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/settings"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      <div className="min-h-screen h-full flex flex-col sm:gap-4 sm:py-4 sm:pl-14">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="sm:max-w-xs">
              <nav className="grid gap-6 text-lg font-medium mt-12 ">
                {navLinks.map((navItems, index) => (
                  <Link
                    key={index}
                    href={navItems.href}
                    className={`${
                      pathname === navItems.href ? "bg-accent" : " "
                    } flex items-center gap-4 py-1 px-2.5 text-muted-foreground  hover:text-foreground rounded-lg`}
                  >
                    {navItems.icon}
                    {navItems.title}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          {/* Update this with real pathname */}
          <Breadcrumb className="hidden md:flex">
            <BreadcrumbList>
              {PATH_NAMES.map((path, index) => (
                <span
                  key={index}
                  className="flex items-center justify-center gap-1"
                >
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link
                        href={
                          index > 0
                            ? `${PATH_NAMES[index - 1]}/${PATH_NAMES[index]}`
                            : PATH_NAMES[index]
                        }
                        className=" flex items-center capitalize"
                      >
                        {PATH_NAMES[index]}
                      </Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="pt-[2px]" />
                </span>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="relative ml-auto flex-1 md:grow-0">
            {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[320px]"
            /> */}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
              >
                {user?.image ? (
                  <Image
                    src={user?.image}
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full"
                  />
                ) : (
                  <Image
                    src={Avatar}
                    width={36}
                    height={36}
                    alt="Avatar"
                    className="overflow-hidden rounded-full bg-muted"
                  />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
                <Link href="/dashboard/settings">
              <DropdownMenuItem className=' cursor-pointer'>
                Settings
              </DropdownMenuItem>
                </Link>
              <DropdownMenuItem className=' cursor-not-allowed'>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className=' cursor-pointer' onClick={() => logout()}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <div className='px-5' >
        {children}
        </div>
      </div>
    </>
  );
};

export default SlimSidebar;
