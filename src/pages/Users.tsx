import React, { useState } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  Shield,
  GraduationCap,
  Building,
  Eye,
  Edit2,
  UserX,
  Search,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { useToastContext } from '../components/ui/Toast';
import { adminService } from '../services/adminService';
import { User, UserRole } from '../types/user';

export function Users() {
  const { addToast } = useToastContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'student' as UserRole,
    institution: '',
    status: 'active' as 'active' | 'inactive',
  });

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await adminService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to load users:', err);
        addToast('error', 'Failed to load users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();

    const query = new URLSearchParams(window.location.search);
    const statusParam = query.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [window.location.search]);

  const filtered = users.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.institution.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const admins = users.filter((u) => u.role === 'admin').length;
  const institutions = users.filter((u) => u.role === 'institution').length;
  const students = users.filter((u) => u.role === 'student').length;

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="indigo" dot>Admin</Badge>;
      case 'institution': return <Badge variant="blue" dot>Institution</Badge>;
      case 'student': return <Badge variant="green" dot>Student</Badge>;
      default: return <Badge variant="gray">{role}</Badge>;
    }
  };

  const roleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4" />;
      case 'institution': return <Building className="w-4 h-4" />;
      case 'student': return <GraduationCap className="w-4 h-4" />;
      default: return <UsersIcon className="w-4 h-4" />;
    }
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      addToast('error', 'Missing fields', 'Please complete all required fields.');
      return;
    }
    const user: User = {
      id: `usr-${String(users.length + 1).padStart(3, '0')}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      institution: newUser.institution,
      status: newUser.status,
      createdAt: new Date().toISOString(),
      lastLogin: '-',
    };
    setUsers((prev) => [user, ...prev]);
    setShowAddModal(false);
    setNewUser({ name: '', email: '', role: 'student', institution: '', status: 'active' });
    addToast('success', 'User created', `${user.name} has been added as ${user.role}.`);
  };

  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
          : u
      )
    );
    addToast('info', 'User status updated');
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'User Management', path: '/users' }, { label: 'Users' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">User Management</h1>
              <p className="text-sm text-navy-500 mt-0.5">Manage platform users, roles, and access permissions.</p>
            </div>
            <Button onClick={() => setShowAddModal(true)} icon={<UserPlus className="w-4 h-4" />}>
              Add User
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={users.length} icon={UsersIcon} color="blue" />
            <StatCard title="Admins" value={admins} icon={Shield} color="indigo" />
            <StatCard title="Institutions" value={institutions} icon={Building} color="purple" />
            <StatCard title="Students" value={students} icon={GraduationCap} color="green" />
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl border border-navy-100 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or institution..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-navy-50 border border-navy-100 rounded-lg placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-sm border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-navy-500">Loading users...</div>
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center text-navy-500">No users found.</div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-navy-50/50 border-b border-navy-100">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">User</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider hidden md:table-cell">Institution</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider hidden lg:table-cell">Last Login</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {filtered.map((user) => (
                    <tr key={user.id} className="hover:bg-navy-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
                            {user.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-navy-800 truncate">{user.name}</p>
                            <p className="text-xs text-navy-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{roleBadge(user.role)}</td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-sm text-navy-600 truncate max-w-[160px] block">{user.institution}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={user.status === 'active' ? 'green' : 'gray'} dot>
                          {user.status === 'active' ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-xs text-navy-500">
                          {user.lastLogin === '-' ? '-' : new Date(user.lastLogin).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setSelectedUser(user)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                          <button onClick={() => handleToggleStatus(user.id)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors" title={user.status === 'active' ? 'Disable' : 'Enable'}><UserX className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Add User Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New User">
        <div className="space-y-4">
          <Input label="Full Name" placeholder="Enter full name" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} required />
          <Input label="Email" type="email" placeholder="email@institution.edu" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required />
          <Select
            label="Role"
            value={newUser.role}
            onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value as UserRole }))}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'institution', label: 'Institution' },
              { value: 'student', label: 'Student' },
            ]}
          />
          <Input label="Institution" placeholder="e.g. Northstar Institute of Technology" value={newUser.institution} onChange={(e) => setNewUser((p) => ({ ...p, institution: e.target.value }))} />
          <Select
            label="Status"
            value={newUser.status}
            onChange={(e) => setNewUser((p) => ({ ...p, status: e.target.value as 'active' | 'inactive' }))}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-3 border-t border-navy-100">
            <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button onClick={handleAddUser} icon={<UserPlus className="w-4 h-4" />}>Create User</Button>
          </div>
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)} title="User Details">
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xl font-bold">
                {selectedUser.name.charAt(0)}
              </div>
              <div>
                <p className="text-lg font-semibold text-navy-900">{selectedUser.name}</p>
                <p className="text-sm text-navy-500">{selectedUser.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-navy-100">
              <div>
                <p className="text-xs font-medium text-navy-500">Role</p>
                <div className="mt-1">{roleBadge(selectedUser.role)}</div>
              </div>
              <div>
                <p className="text-xs font-medium text-navy-500">Status</p>
                <div className="mt-1">
                  <Badge variant={selectedUser.status === 'active' ? 'green' : 'gray'} dot>
                    {selectedUser.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-navy-500">Institution</p>
                <p className="text-sm text-navy-800 mt-0.5">{selectedUser.institution}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-navy-500">Last Login</p>
                <p className="text-sm text-navy-800 mt-0.5">
                  {selectedUser.lastLogin === '-' ? 'Never' : new Date(selectedUser.lastLogin).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Role Permissions */}
            <div className="pt-4 border-t border-navy-100">
              <p className="text-xs font-semibold text-navy-500 uppercase tracking-wider mb-2">Permissions</p>
              <div className="space-y-1.5">
                {selectedUser.role === 'admin' && (
                  <>
                    <p className="text-xs text-navy-600">✓ Manage users and roles</p>
                    <p className="text-xs text-navy-600">✓ Upload and manage certificates</p>
                    <p className="text-xs text-navy-600">✓ View blockchain records</p>
                    <p className="text-xs text-navy-600">✓ Revoke certificates</p>
                    <p className="text-xs text-navy-600">✓ View verification activity</p>
                  </>
                )}
                {selectedUser.role === 'institution' && (
                  <>
                    <p className="text-xs text-navy-600">✓ Upload certificates</p>
                    <p className="text-xs text-navy-600">✓ View issued certificates</p>
                    <p className="text-xs text-navy-600">✓ Manage institutional records</p>
                    <p className="text-xs text-navy-600">✓ Verify certificates</p>
                  </>
                )}
                {selectedUser.role === 'student' && (
                  <>
                    <p className="text-xs text-navy-600">✓ View own certificates</p>
                    <p className="text-xs text-navy-600">✓ Download certificates</p>
                    <p className="text-xs text-navy-600">✓ View QR codes</p>
                    <p className="text-xs text-navy-600">✓ View verification details</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
