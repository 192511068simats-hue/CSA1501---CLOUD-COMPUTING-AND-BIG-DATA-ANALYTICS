import React, { useEffect, useState } from 'react';
import { adminService } from '../../services/adminService';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Search, Eye, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function AdminStudents() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    adminService.getStudents().then((data) => {
      setStudents(data);
      setLoading(false);
    });
  }, []);

  const filtered = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Student Management</h1>
          <p className="text-sm text-navy-500 mt-1">
            View all registered students and their certificate counts
          </p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-navy-100 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-navy-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-navy-50/50">
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Student ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Certificates</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-navy-400">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-navy-400">
                    No students found matching your search.
                  </td>
                </tr>
              ) : (
                filtered.map((student) => (
                  <tr key={student.id} className="hover:bg-navy-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-primary-600">
                        {student.studentId || '-'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                          {student.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-navy-900">{student.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-navy-600">{student.email}</td>
                    <td className="px-5 py-4 text-sm text-navy-600 font-medium">{student.certificatesCount || 0}</td>
                    <td className="px-5 py-4">
                      <Badge variant={student.status === 'active' ? 'green' : 'gray'}>
                        {student.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                       <Button variant="ghost" size="sm" onClick={() => navigate(`/users`)}>
                        <Eye className="w-4 h-4" />
                       </Button>
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
