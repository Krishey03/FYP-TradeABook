import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { shoppingViewHeaderMenuItems } from "@/config";
import { ShoppingCart, LogOut, UserRound, SquareStack, ScrollText, MessageCircle } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PropTypes from 'prop-types';

import "@fontsource/inspiration";
import "@fontsource/inika";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { logoutUser } from "@/store/auth-slice";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import InitiateChatButton from "@/components/chat/InitiateChatButton";
import useMessageDropdown from "@/hooks/useMessageDropdown";

function MenuItems({ closeMenu }) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <nav className="flex items-center gap-4 sm:gap-4 md:gap-6">
      {shoppingViewHeaderMenuItems.map((menuItem) => (
        <Link
          className={`text-base md:text-sm font-medium transition-all relative group font-inika ${
            location.pathname === menuItem.path
              ? "text-emerald-700 font-semibold"
              : "text-slate-700 hover:text-emerald-600"
          }`}
          key={menuItem.id}
          to={menuItem.path}
          onClick={closeMenu}
        >
          {menuItem.label}
          <span
            className={`absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 transition-all duration-300 group-hover:w-full ${
              location.pathname === menuItem.path ? "w-full" : ""
            }`}
          ></span>
        </Link>
      ))}
    </nav>
  );
}

// In your header.jsx
function MessageDropdown() {
  const {
    handleViewAll,
    isLoading,
    unreadCount,
  } = useMessageDropdown();

  return (
    <Button variant="ghost" 
    size="icon" 
    className="relative rounded-full bg-white hover:bg-emerald-50"
    onClick={handleViewAll}
    disabled={isLoading}>
      {isLoading ? (
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-600 border-t-transparent" />
  ) : (
    <>
      <MessageCircle className="h-5 w-5 text-slate-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
          {unreadCount}
        </span>
      )}
    </>
  )}
    </Button>
  );
}

function HeaderRightContent() {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  function handleLogoutClick() {
    setShowLogoutConfirm(true);
  }

  function confirmLogout() {
    setShowLogoutConfirm(false);
    dispatch(logoutUser());
    navigate("/auth/login");
  }

  function cancelLogout() {
    setShowLogoutConfirm(false);
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <InitiateChatButton />
      <MessageDropdown />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Avatar className="bg-emerald-600 cursor-pointer hover:ring-2 hover:ring-emerald-200 transition-all h-8 w-8 sm:h-10 sm:w-10">
            <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm sm:text-lg">
              {user?.userName ? user.userName[0].toUpperCase() : "U"}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-64 bg-white border shadow-lg rounded-lg p-1 animate-in fade-in-50 zoom-in-95"
        >
          <div className="p-2">
            <DropdownMenuItem
              onClick={() => navigate("/shop/checkout")}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm">My Cart</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/shop/uploads")}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors"
            >
              <ScrollText className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm">My Uploads</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/shop/account")}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors"
            >
              <UserRound className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm">My Account</p>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate("/shop/orders")}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-slate-50 focus:bg-slate-50 transition-colors"
            >
              <SquareStack className="h-4 w-4 text-slate-500" />
              <div>
                <p className="text-sm">Purchases</p>
              </div>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogoutClick}
            className="flex items-center gap-2 p-2 m-1 rounded-md cursor-pointer text-rose-600 hover:bg-rose-50 focus:bg-rose-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
          <Card className="w-[320px] bg-white shadow-lg rounded-lg">
            <CardHeader>
              <h3 className="text-lg font-semibold">Confirm Logout</h3>
            </CardHeader>
            <CardContent>Are you sure you want to log out?</CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button variant="ghost" onClick={cancelLogout} className="text-white hover:text-emerald-600">
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmLogout} className="bg-rose-600 hover:bg-rose-700 text-white">
                Logout
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}

function ShoppingHeader() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* Desktop Header - Fixed at top */}
      <header className={`hidden md:flex fixed top-0 left-0 right-0 z-50 w-full border-b bg-white shadow-md py-2 transition-all ${
        isScrolled ? 'shadow-lg' : ''
      }`}>
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <Link
              className="flex items-center gap-2 text-emerald-700 font-inspiration text-2xl transition-transform hover:scale-105"
              to="/shop/home"
            >
              Trade a Book
            </Link>

            <div className="flex items-center justify-center gap-4 flex-1">
              <MenuItems closeMenu={() => {}} />
            </div>

            <div className="flex items-center">
              <HeaderRightContent />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Fixed at bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg h-16">
        <div className="container mx-auto h-full">
          <div className="flex items-center justify-center gap-6 px-4 h-full">
            <MenuItems closeMenu={() => {}} />
            <HeaderRightContent />
          </div>
        </div>
      </div>

      {/* Desktop Spacer - Only shows on desktop */}
      <div className="hidden md:block pt-[56px]"></div>
    </>
  );
}

MenuItems.propTypes = {
  closeMenu: PropTypes.func
};

export default ShoppingHeader;