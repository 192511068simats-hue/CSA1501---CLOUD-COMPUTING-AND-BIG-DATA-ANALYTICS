import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ChevronRight, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { certificateService } from '../../services/certificateService';
import { Certificate } from '../../types/certificate';

interface NavbarProps {
  breadcrumbs?: { label: string; path?: string }[];
}

export function Navbar({ breadcrumbs = [] }: NavbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Certificate[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    
    if (user?.role === 'admin') {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      eventSource = new EventSource(`${API_URL}/admin/events`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setNotifications(prev => [data, ...prev].slice(0, 10)); // Keep last 10
          setHasUnread(true);
        } catch (e) {}
      };
    }
    
    return () => {
      if (eventSource) eventSource.close();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      const results = await certificateService.search(query);
      setSearchResults(results.slice(0, 5));
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-navy-100 flex items-center justify-between px-4 lg:px-6 shrink-0">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-sm min-w-0 ml-12 lg:ml-0">
        {breadcrumbs.map((crumb, i) => (
          <React.Fragment key={i}>
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-navy-300 shrink-0" />}
            {crumb.path ? (
              <button
                onClick={() => navigate(crumb.path!)}
                className="text-navy-500 hover:text-primary-600 truncate transition-colors"
              >
                {crumb.label}
              </button>
            ) : (
              <span className="text-navy-800 font-medium truncate">{crumb.label}</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Right: Search + Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
          <input
            type="text"
            placeholder="Search certificates..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-56 lg:w-72 pl-9 pr-3 py-2 text-sm bg-navy-50 border border-navy-100 rounded-lg text-navy-800 placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
          />
          {showSearch && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-navy-100 z-50 overflow-hidden">
              {searchResults.map((cert) => (
                <button
                  key={cert.id}
                  onClick={() => {
                    navigate('/certificates');
                    setShowSearch(false);
                    setSearchQuery('');
                  }}
                  className="w-full px-4 py-2.5 text-left hover:bg-navy-50 transition-colors"
                >
                  <p className="text-sm font-medium text-navy-800">{cert.certificateId}</p>
                  <p className="text-xs text-navy-500">{cert.studentName} — {cert.degree}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setHasUnread(false);
            }}
            className="relative p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {hasUnread && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary-500 rounded-full border border-white" />}
          </button>
          
          {showNotifications && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-white rounded-xl shadow-xl border border-navy-100 z-50 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-navy-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-800">Notifications</h3>
                <span className="text-xs text-navy-400">Live</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-navy-400">
                    No new notifications
                  </div>
                ) : (
                  <div className="divide-y divide-navy-50">
                    {notifications.map((notif, i) => (
                      <div key={i} className="p-4 hover:bg-navy-50/50 transition-colors">
                        <p className="text-sm text-navy-800 font-medium">
                          {notif.message || 'System Update'}
                        </p>
                        {notif.certId && (
                          <p className="text-xs font-mono text-primary-600 mt-1">{notif.certId}</p>
                        )}
                        {notif.result && (
                          <p className="text-xs text-navy-500 mt-1 capitalize">Result: {notif.result}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        {user && (
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 pr-3 rounded-lg hover:bg-navy-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-navy-800 leading-tight">{user.name}</p>
                <p className="text-xs text-navy-400 capitalize leading-tight">{user.role}</p>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-xl border border-navy-100 z-50 overflow-hidden animate-scale-in">
                <button
                  onClick={() => {
                    navigate('/profile');
                    setShowUserMenu(false);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-navy-700 hover:bg-navy-50 flex items-center gap-2 transition-colors"
                >
                  <UserCircle className="w-4 h-4" />
                  Profile
                </button>
                <hr className="border-navy-100" />
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
