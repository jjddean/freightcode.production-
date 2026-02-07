import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { BrandLogo } from './ui/brand-logo';
import AuthButtons from './AuthButtons';
import NotificationCenter from './ui/notification-center';

interface SubMenuItem {
  label: string;
  path: string;
  protected: boolean;
}

interface MenuItem {
  label: string;
  path?: string;
  submenu?: SubMenuItem[];
  protected: boolean;
  hideOnAuth?: boolean;
  isButton?: boolean;
}

const Navbar: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const location = useLocation();

  // Close dropdown when route changes
  useEffect(() => {
    setActiveMenu(null);
  }, [location.pathname]);

  const menuItems: MenuItem[] = [
    { label: 'Home', path: '/', protected: false },
    // Marketing pages - visible to all
    { label: 'Services', path: '/services', protected: false },
    { label: 'Solutions', path: '/solutions', protected: false },
    { label: 'Platform', path: '/platform', protected: false },
    { label: 'Resources', path: '/resources', protected: false },
    { label: 'About', path: '/about', protected: false },
    { label: 'Contact', path: '/contact', protected: false },
    // Dashboard link only when signed in (sidebar has the rest)
    { label: 'Dashboard', path: '/dashboard', protected: true, isButton: true },
  ];
  const toggleSubmenu = (label: string) => {
    if (activeMenu === label) {
      setActiveMenu(null);
    } else {
      setActiveMenu(label);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <BrandLogo size="lg" />
        </Link>

        <ul className="nav-menu">
          {menuItems.map((item: any) => {
            // For protected items, only show when signed in
            if (item.protected) {
              return (
                <SignedIn key={item.label}>
                  <li className="nav-item">
                    {item.submenu ? (
                      <>
                        <div
                          className={`nav-link ${activeMenu === item.label ? 'active' : ''}`}
                          onClick={() => toggleSubmenu(item.label)}
                        >
                          {item.label} <span className="dropdown-arrow">▼</span>
                        </div>
                        {activeMenu === item.label && (
                          <ul className="submenu">
                            {item.submenu.map((subItem: any) => (
                              <li key={subItem.label} className="submenu-item">
                                <Link to={subItem.path} className="submenu-link">
                                  {subItem.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </>
                    ) : item.isButton ? (
                      <Button asChild className="bg-primary hover:bg-primary/90 text-white shadow-sm text-sm font-medium h-8 px-3">
                        <Link to={item.path || '#'}>
                          {item.label}
                        </Link>
                      </Button>
                    ) : (
                      <Link to={item.path || '#'} className="nav-link">
                        {item.label}
                      </Link>
                    )}
                  </li>
                </SignedIn>
              );
            } else if (item.hideOnAuth) {
              // Marketing items hidden when auth
              return (
                <SignedOut key={item.label}>
                  <li className="nav-item">
                    <Link to={item.path || '#'} className="nav-link">
                      {item.label}
                    </Link>
                  </li>
                </SignedOut>
              );
            } else {
              // Non-protected, always visible (Home, Contact)
              return (
                <li key={item.label} className="nav-item">
                  <Link to={item.path || '#'} className="nav-link">
                    {item.label}
                  </Link>
                </li>
              );
            }
          })}
        </ul>

        <div className="auth-section">
          <SignedIn>
            <div className="flex items-center space-x-3">
              <NotificationCenter />
              {/* Org Switcher Removed */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
          <SignedOut>
            <AuthButtons />
          </SignedOut>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;