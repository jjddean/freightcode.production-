import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { cn } from '@/lib/utils';
import { BrandLogo } from '../ui/brand-logo';

interface MobileNavItem {
  label: string;
  path: string;
  icon: string;
  protected: boolean;
  badge?: number;
}

const MobileNavigation: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems: MobileNavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊', protected: true },
    { label: 'Shipments', path: '/shipments', icon: '🚢', protected: true, badge: 3 },
    { label: 'Documents', path: '/documents', icon: '📄', protected: true },
    { label: 'Quotes', path: '/quotes', icon: '💬', protected: true },
    { label: 'Reports', path: '/reports', icon: '📈', protected: true }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 md:hidden">
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            if (item.protected) {
              return (
                <SignedIn key={item.label}>
                  <Link
                    to={item.path}
                    className={cn(
                      "flex flex-col items-center justify-center space-y-1 relative",
                      isActive(item.path)
                        ? "text-primary bg-primary/5"
                        : "text-gray-600 hover:text-gray-900"
                    )}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-xs font-medium">{item.label}</span>
                    {item.badge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SignedIn>
              );
            } else {
              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={cn(
                    "flex flex-col items-center justify-center space-y-1 relative",
                    isActive(item.path)
                      ? "text-primary bg-primary/5"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            }
          })}
        </div>
      </div>

      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40 md:hidden flex items-center justify-between px-4 h-14">
        <Link to="/" className="flex items-center">
          <BrandLogo size="lg" />
        </Link>

        <div className="flex items-center space-x-3">
          <SignedIn>
            {/* Mobile Notifications */}
            <button className="relative p-2 text-gray-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3.5" />
              </svg>
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                3
              </span>
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </SignedIn>

          <SignedOut>
            <Link
              to="/sign-in"
              className="text-sm font-medium text-primary hover:text-primary/80"
            >
              Sign In
            </Link>
          </SignedOut>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
          <div className="py-2">
            <SignedIn>
              <Link
                to="/compliance"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                📋 Compliance
              </Link>
              <Link
                to="/account"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                ⚙️ Account Settings
              </Link>
              <Link
                to="/help"
                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                onClick={() => setIsOpen(false)}
              >
                ❓ Help & Support
              </Link>
            </SignedIn>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
