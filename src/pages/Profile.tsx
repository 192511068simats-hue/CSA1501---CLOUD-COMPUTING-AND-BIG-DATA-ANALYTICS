import React from 'react';
import {
  UserCircle,
  Mail,
  Building,
  Shield,
  Calendar,
  Clock,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

export function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="indigo" dot>Admin</Badge>;
      case 'institution': return <Badge variant="blue" dot>Institution</Badge>;
      case 'student': return <Badge variant="green" dot>Student</Badge>;
      default: return <Badge variant="gray">{role}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'System', path: '/profile' }, { label: 'Profile' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold text-navy-900 mb-6">Profile</h1>

          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{user.name}</h2>
                  <p className="text-primary-200 text-sm">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <UserCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Full Name</p>
                    <p className="text-sm text-navy-800 mt-0.5">{user.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Email</p>
                    <p className="text-sm text-navy-800 mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Role</p>
                    <div className="mt-1">{roleBadge(user.role)}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Institution</p>
                    <p className="text-sm text-navy-800 mt-0.5">{user.institution}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Member Since</p>
                    <p className="text-sm text-navy-800 mt-0.5">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-navy-50 text-navy-600 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-navy-500">Last Login</p>
                    <p className="text-sm text-navy-800 mt-0.5">{new Date(user.lastLogin).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-navy-100">
                <Badge variant="indigo">Prototype Mode — Profile editing will be available with Firebase integration</Badge>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
