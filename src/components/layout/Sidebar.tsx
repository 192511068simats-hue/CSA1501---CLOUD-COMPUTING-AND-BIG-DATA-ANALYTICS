import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck,
  Blocks,
  ShieldCheck,
  Users,
  UserCircle,
  Settings,
  LogOut,
  ChevronLeft,
  GraduationCap,
  Menu,
  X,
  Activity,
  UserCog
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  roles?: string[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'CERTIFICATE UPLOAD',
    items: [
      {
        label: 'Upload Certificate',
        path: '/certificates/upload',
        icon: <UploadCloud className="w-[18px] h-[18px]" />,
        roles: ['admin', 'institution', 'student'],
      },
      { label: 'Certificate Records', path: '/certificates', icon: <FileCheck className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'BLOCKCHAIN STORAGE',
    items: [
      { label: 'Blockchain Records', path: '/blockchain', icon: <Blocks className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'VERIFICATION PORTAL',
    items: [
      { label: 'Verify Certificate', path: '/verify', icon: <ShieldCheck className="w-[18px] h-[18px]" /> },
    ],
  },
  {
    title: 'USER MANAGEMENT',
    items: [
      {
        label: 'Students',
        path: '/admin/students',
        icon: <GraduationCap className="w-[18px] h-[18px]" />,
        roles: ['admin'],
      },
      {
        label: 'Staff / Users',
        path: '/users',
        icon: <UserCog className="w-[18px] h-[18px]" />,
        roles: ['admin'],
      },
      {
        label: 'Activity Logs',
        path: '/admin/activity-logs',
        icon: <Activity className="w-[18px] h-[18px]" />,
        roles: ['admin'],
      }
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Profile', path: '/profile', icon: <UserCircle className="w-[18px] h-[18px]" /> },
      { label: 'Settings', path: '/settings', icon: <Settings className="w-[18px] h-[18px]" />, roles: ['admin'] },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const filteredGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.roles || (user && item.roles.includes(user.role))
      ),
    }))
    .filter((group) => group.items.length > 0);

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-navy-100 shrink-0">
        <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-sm font-bold text-navy-900 tracking-tight">
              AcademicVerify
            </span>
            <span className="text-[10px] text-navy-400 font-medium">
              Prototype Mode
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {filteredGroups.map((group) => (
          <div key={group.title}>
            {!collapsed && (
              <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-navy-400 uppercase">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-navy-600 hover:bg-navy-50 hover:text-navy-800'
                    } ${collapsed ? 'justify-center' : ''}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User section */}
      {user && (
        <div className="border-t border-navy-100 p-3 shrink-0">
          {!collapsed ? (
            <div className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold">
                {user.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy-800 truncate">{user.name}</p>
                <p className="text-xs text-navy-400 capitalize">{user.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full p-2 rounded-lg text-navy-400 hover:text-red-600 hover:bg-red-50 transition-colors flex justify-center"
              title="Logout"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Collapse toggle (desktop only) */}
      <div className="hidden lg:block border-t border-navy-100 p-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full p-2 rounded-lg text-navy-400 hover:bg-navy-50 hover:text-navy-600 transition-colors flex items-center justify-center"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md border border-navy-100 text-navy-600"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-navy-100 flex flex-col transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-navy-400 hover:bg-navy-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-navy-100 h-screen sticky top-0 transition-all duration-300 ${
          collapsed ? 'w-[68px]' : 'w-64'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
