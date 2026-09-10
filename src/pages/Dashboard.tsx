import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Eye,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Blocks,
  Users,
  AlertTriangle
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { adminService, AdminStats, ActivityLog } from '../services/adminService';
import { certificateService } from '../services/certificateService';
import { Certificate } from '../types/certificate';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [studentCerts, setStudentCerts] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      const [certsData, newActivities] = await Promise.all([
        certificateService.getAll(),
        adminService.getActivityLogs(),
      ]);
      
      const userCerts = certsData.filter(c => c.registerNumber === user?.studentId);
      setStudentCerts(userCerts);
      
      const userActivities = newActivities.filter(a => a.userId === user?.id || a.userName === user?.name);
      setActivities(userActivities.slice(0, 10));
    } catch (err) {
      console.error('Failed to load student data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(false);
      const [newStats, newActivities] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getActivityLogs(),
      ]);
      setStats(newStats);
      setActivities(newActivities.slice(0, 10)); // Just recent ones
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchDashboardData();

      // Listen for SSE events
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
      const eventSource = new EventSource(`${API_URL}/admin/events`);
      
      eventSource.onmessage = (event) => {
        // We received an event from the server. Refetch dashboard data.
        fetchDashboardData();
      };

      return () => {
        eventSource.close();
      };
    } else if (user?.role === 'student') {
      fetchStudentData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="green" dot>Verified</Badge>;
      case 'pending':
        return <Badge variant="yellow" dot>Pending</Badge>;
      case 'revoked':
        return <Badge variant="red" dot>Revoked</Badge>;
      default:
        return <Badge variant="gray">{status}</Badge>;
    }
  };

  const verificationBadge = (result: string) => {
    switch (result) {
      case 'valid':
        return <Badge variant="green">Verified</Badge>;
      case 'tampered':
        return <Badge variant="red">Tampered</Badge>;
      case 'revoked':
        return <Badge variant="red">Revoked</Badge>;
      case 'not_found':
        return <Badge variant="gray">Not Found</Badge>;
      default:
        return <Badge>{result}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Overview' }, { label: 'Dashboard' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}
              </h1>
              <p className="text-sm text-navy-500 mt-0.5">
                {user?.role === 'student' 
                  ? 'Monitor your academic certificates, verification status, blockchain records, and recent activity.' 
                  : 'Monitor certificate issuance, blockchain records, and verification activity.'}
              </p>
            </div>
          </div>

          {error ? (
            <div className="bg-white p-12 rounded-xl border border-red-100 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
              <h2 className="text-xl font-bold text-navy-900 mb-2">Unable to load live dashboard data.</h2>
              <p className="text-navy-500 mb-6">Please refresh or check your connection.</p>
              <Button onClick={() => user?.role === 'admin' ? fetchDashboardData() : fetchStudentData()}>
                Refresh Data
              </Button>
            </div>
          ) : user?.role === 'admin' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Certificates"
                value={loading ? '...' : stats?.totalCertificates || 0}
                icon={FileCheck}
                trend="Live Data"
                trendUp
                color="blue"
                onClick={() => navigate('/certificates')}
              />
              <StatCard
                title="Verified"
                value={loading ? '...' : stats?.verified || 0}
                icon={CheckCircle2}
                trend="Live Data"
                trendUp
                color="green"
                onClick={() => navigate('/certificates?status=active')}
              />
              <StatCard
                title="Pending"
                value={loading ? '...' : stats?.pending || 0}
                icon={Clock}
                trend="Live Data"
                trendUp={false}
                color="yellow"
                onClick={() => navigate('/certificates?status=pending')}
              />
              <StatCard
                title="Revoked"
                value={loading ? '...' : stats?.revoked || 0}
                icon={XCircle}
                color="red"
                onClick={() => navigate('/certificates?status=revoked')}
              />
              <StatCard
                title="Registered Students"
                value={loading ? '...' : stats?.totalStudents || 0}
                icon={Users}
                color="indigo"
                onClick={() => navigate('/users')}
              />
              <StatCard
                title="Integrity Alerts"
                value={loading ? '...' : stats?.integrityAlerts || 0}
                icon={AlertTriangle}
                color="red"
                onClick={() => navigate('/admin/activity-logs?filter=integrity')}
              />
              <StatCard
                title="Active Students"
                value={loading ? '...' : stats?.activeStudents || 0}
                icon={TrendingUp}
                color="blue"
                onClick={() => navigate('/users?status=active')}
              />
              <StatCard
                title="Blockchain Records"
                value={loading ? '...' : stats?.blockchainRecords || 0}
                icon={Blocks}
                color="green"
                onClick={() => navigate('/blockchain')}
              />
            </div>
          ) : user?.role === 'student' ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Certificates"
                value={studentCerts.length}
                icon={FileCheck}
                trend="Your Records"
                trendUp
                color="blue"
              />
              <StatCard
                title="Verified"
                value={studentCerts.filter(c => c.certificateStatus === 'active').length}
                icon={CheckCircle2}
                trend="Verified"
                trendUp
                color="green"
              />
              <StatCard
                title="Pending"
                value={studentCerts.filter(c => c.certificateStatus === 'pending').length}
                icon={Clock}
                trend="Awaiting"
                trendUp={false}
                color="yellow"
              />
              <StatCard
                title="Blockchain Records"
                value={studentCerts.filter(c => c.blockchainStatus === 'registered').length}
                icon={Blocks}
                color="indigo"
              />
            </div>
          ) : (
            <div className="bg-white p-6 rounded-xl border border-navy-100 flex items-center justify-center">
              <p className="text-navy-500">Welcome to AcademicVerify. Navigate using the sidebar.</p>
            </div>
          )}


          {(user?.role === 'admin' || user?.role === 'student') && (
            <div className="mt-6 bg-white rounded-xl border border-navy-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-navy-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-navy-800">
                    {user?.role === 'student' ? 'Recent Activity' : 'Recent System Activity'}
                  </h2>
                  <p className="text-xs text-navy-400 mt-0.5">
                    {user?.role === 'student' ? 'Your recent actions and updates' : 'Real-time audit log from all users'}
                  </p>
                </div>
                {user?.role === 'admin' && (
                  <Button variant="ghost" size="sm" onClick={() => navigate('/admin/activity-logs')}>
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              <div className="divide-y divide-navy-50">
                {loading
                  ? Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="px-5 py-3">
                        <div className="skeleton h-4 w-full mb-2" />
                        <div className="skeleton h-3 w-2/3" />
                      </div>
                    ))
                  : activities.length === 0 ? (
                      <div className="px-5 py-6 text-center text-sm text-navy-400">No recent activities found</div>
                  ) : activities.map((act) => (
                      <div 
                        key={act.id} 
                        className={`px-5 py-3.5 hover:bg-navy-50/50 transition-colors ${act.entityId ? 'cursor-pointer hover:bg-navy-100' : ''}`}
                        onClick={() => {
                          if (!act.entityId) return;
                          if (act.entityType === 'certificate' || act.entityType === 'verification') navigate('/certificates');
                          if (act.entityType === 'user' || act.entityType === 'authentication') navigate('/users');
                          if (act.entityType === 'blockchain') navigate('/blockchain');
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-navy-800">{act.action}</span>
                          <span className="text-xs text-navy-400">
                            {new Date(act.timestamp).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-navy-500">
                          <Badge variant="gray">{act.userRole}</Badge>
                          <span>{act.userName}</span>
                          {act.entityId && (
                            <>
                              <span className="text-navy-300">•</span>
                              <span className="font-mono text-primary-600">{act.entityId}</span>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
