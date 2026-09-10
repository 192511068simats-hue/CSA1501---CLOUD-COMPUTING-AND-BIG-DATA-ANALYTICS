import React, { useEffect, useState } from 'react';
import { adminService, ActivityLog } from '../../services/adminService';
import { Badge } from '../../components/ui/Badge';

export function AdminActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');

  const fetchLogs = async () => {
    try {
      const data = await adminService.getActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    
    // Listen for SSE events
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const eventSource = new EventSource(`${API_URL}/admin/events`);
    
    eventSource.onmessage = () => {
      fetchLogs();
    };

    const query = new URLSearchParams(window.location.search);
    const filterParam = query.get('filter');
    if (filterParam) {
      setFilterType(filterParam);
    }

    return () => eventSource.close();
  }, [window.location.search]);

  const filteredLogs = logs.filter(log => {
    if (filterType === 'integrity') {
      // Show logs related to failed verifications or simulated tampering
      return log.action.toLowerCase().includes('tamper') || 
             log.status === 'failed' || 
             log.description.toLowerCase().includes('tamper') ||
             log.description.toLowerCase().includes('failed');
    }
    return true;
  });

  const getEntityBadgeColor = (entityType: string) => {
    switch (entityType) {
      case 'authentication': return 'indigo';
      case 'certificate': return 'blue';
      case 'verification': return 'green';
      case 'blockchain': return 'purple';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">System Activity</h1>
          <p className="text-sm text-navy-500 mt-1">
            Real-time audit logs for all system interactions
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">User</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Module</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-navy-400">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-navy-400">
                    No activity logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap text-sm text-navy-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-navy-900">{log.userName}</span>
                        <span className="text-xs text-navy-400 uppercase tracking-wider mt-0.5">{log.userRole}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm text-navy-800">{log.action}</span>
                        <span className="text-xs text-navy-500 mt-0.5">{log.description}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={getEntityBadgeColor(log.entityType) as any}>
                        {log.entityType}
                      </Badge>
                      {log.entityId && (
                        <div className="text-xs font-mono text-primary-600 mt-1">{log.entityId}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={log.status === 'success' ? 'green' : log.status === 'failed' ? 'red' : 'yellow'}>
                        {log.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
