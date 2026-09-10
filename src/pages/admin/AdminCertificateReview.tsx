import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Blocks,
  Hash,
  FileText,
  GraduationCap,
  Building2,
  Calendar,
  User,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Navbar } from '../../components/layout/Navbar';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { HashDisplay } from '../../components/ui/HashDisplay';
import { Modal } from '../../components/ui/Modal';
import { useToastContext } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import { certificateService } from '../../services/certificateService';
import { blockchainService } from '../../services/blockchainService';
import { Certificate } from '../../types/certificate';
import { BlockchainRecord } from '../../types/blockchain';

export function AdminCertificateReview() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToastContext();
  const { user } = useAuth();

  const [cert, setCert] = useState<Certificate | null>(null);
  const [blockRecord, setBlockRecord] = useState<BlockchainRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);

  useEffect(() => {
    async function load() {
      if (!certificateId) return;
      const c = await certificateService.getById(certificateId);
      setCert(c);
      const br = await blockchainService.getCertificate(certificateId);
      setBlockRecord(br);
      setLoading(false);
    }
    load();
  }, [certificateId]);

  const handleApprove = async () => {
    if (!cert) return;
    setApproving(true);
    try {
      await certificateService.approve(cert.certificateId, user?.id, user?.name);
      addToast('success', 'Certificate Approved', `${cert.certificateId} has been verified and registered on the blockchain.`);
      navigate('/certificates');
    } catch (e) {
      addToast('error', 'Approval Failed', 'An error occurred while approving this certificate.');
    } finally {
      setApproving(false);
      setShowApproveConfirm(false);
    }
  };

  const handleReject = async () => {
    if (!cert || !rejectReason.trim()) {
      addToast('error', 'Reason Required', 'Please provide a reason for rejection.');
      return;
    }
    setRejecting(true);
    try {
      await certificateService.reject(cert.certificateId, rejectReason, user?.id, user?.name);
      addToast('success', 'Certificate Rejected', `${cert.certificateId} has been rejected.`);
      navigate('/certificates');
    } catch (e) {
      addToast('error', 'Rejection Failed', 'An error occurred while rejecting this certificate.');
    } finally {
      setRejecting(false);
      setShowRejectModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar breadcrumbs={[{ label: 'Certificates', path: '/certificates' }, { label: 'Review' }]} />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-navy-500">Loading certificate details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar breadcrumbs={[{ label: 'Certificates', path: '/certificates' }, { label: 'Not Found' }]} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-navy-300 mx-auto" />
            <h2 className="text-lg font-bold text-navy-800 mt-4">Certificate Not Found</h2>
            <Button variant="outline" className="mt-4" onClick={() => navigate('/certificates')}>Back to Records</Button>
          </div>
        </main>
      </div>
    );
  }

  const isPending = cert.certificateStatus === 'pending';

  const timelineSteps = [
    {
      label: 'Certificate Uploaded',
      time: cert.createdAt,
      done: true,
      icon: FileText,
      color: 'bg-emerald-500',
    },
    {
      label: 'SHA-256 Hash Generated',
      time: cert.createdAt,
      done: true,
      icon: Hash,
      color: 'bg-emerald-500',
    },
    {
      label: 'Blockchain Record Created',
      time: blockRecord?.timestamp || cert.createdAt,
      done: !!blockRecord,
      icon: Blocks,
      color: blockRecord ? 'bg-emerald-500' : 'bg-navy-300',
    },
    {
      label: isPending ? 'Awaiting Admin Review' : cert.certificateStatus === 'active' ? 'Admin Approved' : 'Admin Rejected',
      time: cert.approvedAt || cert.rejectedAt || '',
      done: !isPending,
      icon: isPending ? Clock : cert.certificateStatus === 'active' ? CheckCircle2 : XCircle,
      color: isPending ? 'bg-amber-500' : cert.certificateStatus === 'active' ? 'bg-emerald-500' : 'bg-red-500',
      current: isPending,
    },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Certificates', path: '/certificates' }, { label: 'Review Certificate' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto animate-fade-in space-y-6">

          {/* Back + Title */}
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/certificates')} className="flex items-center gap-2 text-sm text-navy-500 hover:text-primary-600 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Records
            </button>
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold text-primary-600">{cert.certificateId}</span>
              {isPending ? (
                <Badge variant="yellow" dot>Pending Review</Badge>
              ) : cert.certificateStatus === 'active' ? (
                <Badge variant="green" dot>Approved</Badge>
              ) : (
                <Badge variant="red" dot>Rejected</Badge>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column: Details */}
            <div className="lg:col-span-2 space-y-6">

              {/* Student Info */}
              <div className="bg-white rounded-xl border border-navy-100 p-6">
                <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                  <User className="w-4 h-4 text-primary-500" />
                  Student Information
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Student Name', value: cert.studentName },
                    { label: 'Register Number', value: cert.registerNumber },
                    { label: 'Institution', value: cert.institution, icon: Building2 },
                    { label: 'Department', value: cert.department },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-navy-500">{item.label}</p>
                      <p className="text-sm font-medium text-navy-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Certificate Info */}
              <div className="bg-white rounded-xl border border-navy-100 p-6">
                <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary-500" />
                  Certificate Details
                </h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Degree', value: cert.degree },
                    { label: 'Certificate Type', value: cert.certificateType },
                    { label: 'Academic Year', value: cert.academicYear },
                    { label: 'Issue Date', value: cert.issueDate },
                  ].map(item => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-navy-500">{item.label}</p>
                      <p className="text-sm font-medium text-navy-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic Information */}
              <div className="bg-white rounded-xl border border-navy-100 p-6">
                <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary-500" />
                  Cryptographic Information
                </h2>
                <HashDisplay hash={cert.sha256Hash} label="SHA-256 Document Fingerprint" truncated={false} />

                {blockRecord && (
                  <div className="mt-4 pt-4 border-t border-navy-100 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-navy-500">Blockchain Hash Match</span>
                      {cert.sha256Hash === blockRecord.hash ? (
                        <Badge variant="green">✓ Match</Badge>
                      ) : (
                        <Badge variant="red">✕ Mismatch</Badge>
                      )}
                    </div>
                    {blockRecord.previousHash && (
                      <HashDisplay hash={blockRecord.previousHash} label="Previous Block Hash" />
                    )}
                    {blockRecord.currentHash && (
                      <HashDisplay hash={blockRecord.currentHash} label="Current Block Hash" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Timeline + Actions */}
            <div className="space-y-6">

              {/* Lifecycle Timeline */}
              <div className="bg-white rounded-xl border border-navy-100 p-6">
                <h2 className="text-sm font-semibold text-navy-800 mb-5">Certificate Lifecycle</h2>
                <div className="space-y-0">
                  {timelineSteps.map((step, i) => (
                    <div key={step.label} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white ${step.color} ${step.current ? 'animate-pulse' : ''}`}>
                          <step.icon className="w-3.5 h-3.5" />
                        </div>
                        {i < timelineSteps.length - 1 && <div className="w-0.5 h-8 bg-navy-200 my-1" />}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${step.current ? 'text-amber-700' : step.done ? 'text-navy-800' : 'text-navy-400'}`}>
                          {step.label}
                        </p>
                        {step.time && (
                          <p className="text-[10px] text-navy-400 mt-0.5">
                            {new Date(step.time).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Blockchain Info */}
              {blockRecord && (
                <div className="bg-white rounded-xl border border-navy-100 p-6">
                  <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-primary-500" />
                    Blockchain Record
                  </h2>
                  <div className="space-y-3 text-xs">
                    {[
                      { label: 'Block Number', value: `#${blockRecord.blockNumber}` },
                      { label: 'Transaction ID', value: blockRecord.transactionId || blockRecord.transactionHash.slice(0, 16) + '...' },
                      { label: 'Network', value: blockRecord.network },
                      { label: 'Status', value: blockRecord.status },
                      { label: 'Timestamp', value: new Date(blockRecord.timestamp).toLocaleString() },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-1 border-b border-navy-50">
                        <span className="text-navy-500 font-medium">{item.label}</span>
                        <span className="text-navy-800 font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Actions */}
              {isPending && (
                <div className="bg-white rounded-xl border border-navy-100 p-6">
                  <h2 className="text-sm font-semibold text-navy-800 mb-4">Admin Decision</h2>
                  <div className="space-y-3">
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => setShowApproveConfirm(true)}
                      icon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Approve Certificate
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-red-700 border-red-200 hover:bg-red-50"
                      onClick={() => setShowRejectModal(true)}
                      icon={<XCircle className="w-4 h-4" />}
                    >
                      Reject Certificate
                    </Button>
                  </div>
                </div>
              )}

              {/* If already decided */}
              {cert.certificateStatus === 'active' && cert.approvedBy && (
                <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">Approved</span>
                  </div>
                  <p className="text-xs text-emerald-700">By {cert.approvedBy} on {new Date(cert.approvedAt || '').toLocaleString()}</p>
                </div>
              )}
              {cert.certificateStatus === 'revoked' && cert.rejectedBy && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="text-sm font-semibold text-red-800">Rejected</span>
                  </div>
                  <p className="text-xs text-red-700">By {cert.rejectedBy} on {new Date(cert.rejectedAt || '').toLocaleString()}</p>
                  {cert.rejectedReason && (
                    <p className="text-xs text-red-600 mt-2 bg-white rounded p-2 border border-red-100">Reason: {cert.rejectedReason}</p>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </main>

      {/* Approve Confirmation Modal */}
      <Modal isOpen={showApproveConfirm} onClose={() => setShowApproveConfirm(false)} title="Confirm Approval" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Are you sure you want to approve <strong className="text-navy-800">{cert.certificateId}</strong>?
          </p>
          <p className="text-xs text-navy-500">
            This will mark the certificate as verified and create a permanent blockchain record. This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowApproveConfirm(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleApprove}
              loading={approving}
              loadingText="Approving..."
            >
              Confirm Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal with Reason */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Certificate" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-navy-600">
            Please provide a reason for rejecting <strong className="text-navy-800">{cert.certificateId}</strong>.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter rejection reason..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-navy-200 rounded-lg placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          />
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowRejectModal(false)}>Cancel</Button>
            <Button
              className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              onClick={handleReject}
              loading={rejecting}
              loadingText="Rejecting..."
              disabled={!rejectReason.trim()}
            >
              Confirm Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
