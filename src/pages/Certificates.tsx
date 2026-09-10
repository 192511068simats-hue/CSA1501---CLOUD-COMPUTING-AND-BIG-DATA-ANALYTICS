import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Eye,
  ShieldCheck,
  QrCode,
  Download,
  XCircle,
  FileCheck,
  UploadCloud,
  Filter,
  CheckCircle2,
  RotateCcw,
  ClipboardList,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { HashDisplay } from '../components/ui/HashDisplay';
import { EmptyState, LoadingState } from '../components/ui/EmptyState';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { certificateService } from '../services/certificateService';
import { getCertificateQRValue } from '../services/qrService';
import { Certificate } from '../types/certificate';

export function Certificates() {
  const navigate = useNavigate();
  const { addToast } = useToastContext();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [showQR, setShowQR] = useState<Certificate | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const { user } = useAuth();
  
  useEffect(() => {
    loadCertificates();
    const query = new URLSearchParams(window.location.search);
    const statusParam = query.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
  }, [window.location.search]);

  const loadCertificates = async () => {
    setLoading(true);
    const data = await certificateService.getAll();
    const filteredData = user?.role === 'student'
      ? data.filter(c => c.registerNumber === user.studentId)
      : data;
    setCertificates(filteredData);
    setLoading(false);
  };

  const filtered = certificates.filter((cert) => {
    const matchesSearch =
      !searchQuery ||
      cert.certificateId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.registerNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.institution.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || cert.certificateStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginated = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  const handleRevoke = async (cert: Certificate) => {
    try {
      await certificateService.revoke(cert.certificateId, 'Administrative action');
      addToast('success', 'Certificate revoked', `${cert.certificateId} has been revoked.`);
      loadCertificates();
    } catch {
      addToast('error', 'Revoke failed');
    }
  };

  const handleApprove = async (cert: Certificate) => {
    try {
      await certificateService.approve(cert.certificateId, user?.id, user?.name);
      addToast('success', 'Certificate approved', `${cert.certificateId} has been verified and registered on the blockchain.`);
      loadCertificates();
    } catch {
      addToast('error', 'Approve failed');
    }
  };

  const handleRestore = async (cert: Certificate) => {
    try {
      await certificateService.restoreFromBlockchain(cert.certificateId);
      addToast('success', 'Certificate Restored', `${cert.certificateId} hash has been restored from blockchain.`);
      loadCertificates();
      setSelectedCert(null);
    } catch {
      addToast('error', 'Restore failed');
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge variant="green" dot>Verified</Badge>;
      case 'pending': return <Badge variant="yellow" dot>Pending</Badge>;
      case 'revoked': return <Badge variant="red" dot>Revoked</Badge>;
      default: return <Badge variant="gray">Unregistered</Badge>;
    }
  };

  const blockchainBadge = (status: string) => {
    switch (status) {
      case 'registered': return <Badge variant="green">Registered</Badge>;
      case 'pending': return <Badge variant="yellow">Pending</Badge>;
      case 'failed': return <Badge variant="red">Failed</Badge>;
      default: return <Badge variant="gray">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Certificate Upload', path: '/certificates' }, { label: 'Certificate Records' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">Certificate Records</h1>
              <p className="text-sm text-navy-500 mt-0.5">{filtered.length} certificates found</p>
            </div>
            <Button onClick={() => navigate('/certificates/upload')} icon={<UploadCloud className="w-4 h-4" />}>
              Upload Certificate
            </Button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl border border-navy-100 mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400" />
                <input
                  type="text"
                  placeholder="Search by ID, student, register number, or institution..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-navy-50 border border-navy-100 rounded-lg placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-navy-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="text-sm border border-navy-200 rounded-lg px-3 py-2 bg-white text-navy-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="active">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-navy-100 overflow-hidden">
            {loading ? (
              <LoadingState text="Loading certificates..." />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon={<FileCheck className="w-12 h-12" />}
                title="No certificates found"
                description="Uploaded certificates will appear here."
                action={
                  <Button onClick={() => navigate('/certificates/upload')} icon={<UploadCloud className="w-4 h-4" />}>
                    Upload Certificate
                  </Button>
                }
              />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-navy-50/50 border-b border-navy-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Certificate ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Student</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider hidden lg:table-cell">Degree</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider hidden md:table-cell">Institution</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider hidden xl:table-cell">Hash</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-navy-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-navy-50">
                      {paginated.map((cert) => (
                        <tr key={cert.id} className="hover:bg-navy-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="text-sm font-mono font-medium text-primary-600">{cert.certificateId}</span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-navy-800">{cert.studentName}</p>
                            <p className="text-xs text-navy-400">{cert.registerNumber}</p>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            <p className="text-sm text-navy-600 truncate max-w-[200px]">{cert.degree}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-sm text-navy-600 truncate max-w-[160px]">{cert.institution}</p>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <code className="text-xs font-mono text-navy-500">
                              {cert.sha256Hash.slice(0, 12)}...
                            </code>
                          </td>
                          <td className="px-4 py-3">{statusBadge(cert.certificateStatus)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => setSelectedCert(cert)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors" title="View"><Eye className="w-4 h-4" /></button>
                              <button onClick={() => navigate(`/verify?id=${cert.certificateId}`)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors" title="Verify"><ShieldCheck className="w-4 h-4" /></button>
                              <button onClick={() => setShowQR(cert)} className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors" title="QR Code"><QrCode className="w-4 h-4" /></button>
                              {user?.role === 'admin' && cert.certificateStatus === 'pending' && (
                                <button onClick={() => navigate(`/admin/certificates/${cert.certificateId}`)} className="p-1.5 rounded-lg text-navy-400 hover:bg-primary-100 hover:text-primary-600 transition-colors" title="Review">
                                  <ClipboardList className="w-4 h-4" />
                                </button>
                              )}
                              {user?.role === 'admin' && cert.certificateStatus !== 'revoked' && (
                                <button onClick={() => handleRevoke(cert)} className="p-1.5 rounded-lg text-navy-400 hover:bg-red-100 hover:text-red-600 transition-colors" title="Revoke"><XCircle className="w-4 h-4" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-navy-100">
                    <p className="text-xs text-navy-500">
                      Showing {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPage(i + 1)}
                          className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                            currentPage === i + 1 ? 'bg-primary-600 text-white' : 'text-navy-600 hover:bg-navy-100'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedCert} onClose={() => setSelectedCert(null)} title="Certificate Details" size="lg">
        {selectedCert && (
          <div className="space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Certificate ID', value: selectedCert.certificateId },
                { label: 'Student Name', value: selectedCert.studentName },
                { label: 'Register Number', value: selectedCert.registerNumber },
                { label: 'Degree', value: selectedCert.degree },
                { label: 'Department', value: selectedCert.department },
                { label: 'Institution', value: selectedCert.institution },
                { label: 'Certificate Type', value: selectedCert.certificateType },
                { label: 'Academic Year', value: selectedCert.academicYear },
                { label: 'Issue Date', value: selectedCert.issueDate },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs font-medium text-navy-500">{item.label}</p>
                  <p className="text-sm text-navy-800 mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-navy-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-navy-500">Certificate Status</span>
                {statusBadge(selectedCert.certificateStatus)}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-navy-500">Blockchain Status</span>
                {blockchainBadge(selectedCert.blockchainStatus)}
              </div>
              <HashDisplay hash={selectedCert.sha256Hash} label="Current SHA-256 Hash" truncated={false} />
              {selectedCert.blockchainTransaction && (
                <HashDisplay hash={selectedCert.blockchainTransaction} label="Blockchain Transaction" />
              )}
            </div>

            {user?.role === 'admin' && (
              <div className="pt-4 border-t border-navy-100 space-y-3">
                {/* Tamper Simulation */}
                <div className="bg-red-50/50 rounded-lg p-4 border border-red-100">
                  <h4 className="text-xs font-bold text-red-800 mb-2 uppercase tracking-wide">Tamper Simulation — Demo Only</h4>
                  <p className="text-[11px] text-red-600 mb-4">
                    This will modify the stored certificate hash to simulate tampering, while leaving the immutable blockchain record intact.
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 text-red-700 border-red-200 hover:bg-red-100"
                      onClick={async () => {
                        try {
                          await certificateService.simulateTamper(selectedCert.certificateId, user?.id, user?.name);
                          addToast('success', 'Tamper Simulated', 'The certificate file has been modified.');
                          loadCertificates();
                          setSelectedCert(null);
                        } catch (e) {
                          addToast('error', 'Simulation Failed', 'Could not simulate tampering.');
                        }
                      }}
                    >
                      Simulate Modification — Demo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      onClick={() => handleRestore(selectedCert)}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Restore from Blockchain
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* QR Modal */}
      <Modal isOpen={!!showQR} onClose={() => setShowQR(null)} title="Certificate QR Code" size="sm">
        {showQR && (
          <div className="flex flex-col items-center py-4">
            <div className="bg-white rounded-xl border-2 border-navy-100 p-6">
              <QRCodeSVG value={getCertificateQRValue(showQR.certificateId)} size={200} level="M" />
            </div>
            <p className="text-sm font-mono font-semibold text-primary-600 mt-4">{showQR.certificateId}</p>
            <p className="text-xs text-navy-400 mt-1">Scan to verify this certificate</p>
            <div className="mt-4 flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getCertificateQRValue(showQR.certificateId));
                  addToast('success', 'Copied', 'Verification link copied to clipboard');
                }}
              >
                Copy Link
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
