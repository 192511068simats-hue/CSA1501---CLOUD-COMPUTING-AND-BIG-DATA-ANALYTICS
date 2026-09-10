import React, { useState, useEffect } from 'react';
import {
  Blocks,
  FileCheck,
  Hash,
  ArrowDown,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowRight,
  Link2,
  RotateCcw,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { HashDisplay } from '../components/ui/HashDisplay';
import { Button } from '../components/ui/Button';
import { LoadingState } from '../components/ui/EmptyState';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { blockchainService } from '../services/blockchainService';
import { certificateService } from '../services/certificateService';
import { BlockchainRecord, ChainValidationResult } from '../types/blockchain';

export function Blockchain() {
  const [records, setRecords] = useState<BlockchainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<BlockchainRecord | null>(null);
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<ChainValidationResult | null>(null);
  const { addToast } = useToastContext();
  const { user } = useAuth();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const data = await blockchainService.getAllRecords();
    setRecords(data);
    setLoading(false);
  }

  async function handleValidateChain() {
    setValidating(true);
    try {
      const result = await blockchainService.validateChain();
      setValidation(result);
      if (result.valid) {
        addToast('success', 'Chain Valid', `All ${result.totalBlocks} blocks passed integrity validation.`);
      } else {
        addToast('error', 'Chain Invalid', `${result.invalidBlocks} out of ${result.totalBlocks} blocks failed validation.`);
      }
    } catch {
      addToast('error', 'Validation Failed', 'Could not validate the blockchain chain.');
    } finally {
      setValidating(false);
    }
  }

  async function handleSimulateTamper(certId: string) {
    try {
      await certificateService.simulateTamper(certId, user?.id, user?.name);
      addToast('success', 'Tamper Simulated', `Certificate ${certId} hash has been modified.`);
      // Re-validate to show the break
      await handleValidateChain();
    } catch {
      addToast('error', 'Simulation Failed');
    }
  }

  async function handleRestore(certId: string) {
    try {
      await certificateService.restoreFromBlockchain(certId);
      addToast('success', 'Certificate Restored', `Certificate ${certId} hash has been restored from blockchain.`);
      await handleValidateChain();
    } catch {
      addToast('error', 'Restore Failed');
    }
  }

  const confirmed = records.filter((r) => r.status === 'confirmed').length;
  const pending = records.filter((r) => r.status === 'pending').length;

  const getBlockValidation = (certId: string) => {
    if (!validation) return null;
    return validation.blocks.find(b => b.certificateId === certId);
  };

  const getActionColor = (action?: string) => {
    switch (action) {
      case 'CERTIFICATE_REGISTERED': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CERTIFICATE_APPROVED': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CERTIFICATE_REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-navy-50 text-navy-700 border-navy-200';
    }
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case 'CERTIFICATE_REGISTERED': return 'Registered';
      case 'CERTIFICATE_APPROVED': return 'Approved';
      case 'CERTIFICATE_REJECTED': return 'Rejected';
      default: return action || 'Unknown';
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Blockchain Storage', path: '/blockchain' }, { label: 'Blockchain Records' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-navy-900">Blockchain Storage</h1>
              <p className="text-sm text-navy-500 mt-1">Tamper-resistant certificate integrity records with hash chain validation.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleValidateChain}
                loading={validating}
                loadingText="Validating..."
                icon={<Shield className="w-4 h-4" />}
              >
                Validate Chain
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={load}
                icon={<RefreshCw className="w-4 h-4" />}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Chain Validation Result */}
          {validation && (
            <div className={`rounded-xl border-2 p-5 ${validation.valid ? 'bg-emerald-50/50 border-emerald-200' : 'bg-red-50/50 border-red-200'}`}>
              <div className="flex items-center gap-3 mb-3">
                {validation.valid ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <h3 className="text-lg font-bold text-emerald-800">Chain Integrity: VALID ✓</h3>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-bold text-red-800">Chain Integrity: INVALID ✕</h3>
                  </>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-navy-600">Total Blocks: <strong>{validation.totalBlocks}</strong></span>
                <span className="text-emerald-700">Valid: <strong>{validation.validBlocks}</strong></span>
                {validation.invalidBlocks > 0 && (
                  <span className="text-red-700">Invalid: <strong>{validation.invalidBlocks}</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Important notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">How the Hash Chain Works</p>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                Each block contains the SHA-256 hash of the certificate and is cryptographically linked to the previous block via a <code className="bg-blue-100 px-1 rounded">previousHash</code> field. The <code className="bg-blue-100 px-1 rounded">currentHash</code> is computed from all block data including the previous hash, creating a tamper-evident chain. Any modification to a certificate or block will cause a chain break.
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Blocks" value={records.length} icon={Blocks} color="indigo" />
            <StatCard title="Confirmed" value={confirmed} icon={CheckCircle2} color="green" />
            <StatCard title="Pending" value={pending} icon={Clock} color="yellow" />
            <StatCard title="Chain Status" value={validation ? (validation.valid ? 'VALID' : 'INVALID') : '—'} icon={Shield} color={validation ? (validation.valid ? 'green' : 'red') : 'blue'} />
          </div>

          {/* Block Chain Visualization */}
          <div className="bg-white rounded-xl border border-navy-100 p-6">
            <h2 className="text-sm font-semibold text-navy-800 mb-6 flex items-center gap-2">
              <Blocks className="w-4 h-4 text-primary-500" />
              Block Chain Visualization
            </h2>

            {loading ? (
              <LoadingState text="Loading blockchain records..." />
            ) : records.length === 0 ? (
              <div className="text-center py-12">
                <Blocks className="w-12 h-12 text-navy-200 mx-auto" />
                <p className="text-sm text-navy-500 mt-3">No blockchain records yet. Upload a certificate to create the first block.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {records.map((rec, i) => {
                  const blockVal = getBlockValidation(rec.certificateId);
                  const isInvalid = blockVal && !blockVal.valid;
                  const isCertMismatch = blockVal && blockVal.hashValid === false;

                  return (
                    <React.Fragment key={rec.id}>
                      {/* Block Card */}
                      <div className={`rounded-xl border-2 p-5 transition-all ${
                        isInvalid
                          ? 'border-red-300 bg-red-50/30 shadow-red-100 shadow-md'
                          : validation
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : 'border-navy-200 bg-white'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isInvalid ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                            }`}>
                              #{rec.blockIndex ?? i}
                            </div>
                            <div>
                              <p className="text-sm font-mono font-semibold text-primary-600">{rec.certificateId}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {rec.action && (
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getActionColor(rec.action)}`}>
                                    {getActionLabel(rec.action)}
                                  </span>
                                )}
                                <span className="text-[10px] text-navy-400">{new Date(rec.timestamp).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isInvalid ? (
                              <Badge variant="red" dot>✕ INVALID</Badge>
                            ) : validation ? (
                              <Badge variant="green" dot>✓ VALID</Badge>
                            ) : (
                              <Badge variant={rec.status === 'confirmed' ? 'green' : 'yellow'} dot>
                                {rec.status === 'confirmed' ? 'Confirmed' : 'Pending'}
                              </Badge>
                            )}
                            <button
                              onClick={() => setSelectedRecord(rec)}
                              className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-600 transition-colors"
                              title="View Details"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Hash Grid */}
                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                          <div className="bg-navy-50/50 rounded-lg p-3 border border-navy-100">
                            <p className="text-navy-500 font-medium mb-1 uppercase tracking-wide text-[10px]">Certificate Hash</p>
                            <code className={`font-mono break-all ${isCertMismatch ? 'text-red-700' : 'text-navy-700'}`}>
                              {rec.hash.substring(0, 32)}...
                            </code>
                          </div>
                          {rec.currentHash && (
                            <div className="bg-navy-50/50 rounded-lg p-3 border border-navy-100">
                              <p className="text-navy-500 font-medium mb-1 uppercase tracking-wide text-[10px]">Block Hash</p>
                              <code className="text-navy-700 font-mono break-all">
                                {rec.currentHash.substring(0, 32)}...
                              </code>
                            </div>
                          )}
                        </div>

                        {rec.previousHash && (
                          <div className="mt-2 text-[10px] text-navy-400 font-mono flex items-center gap-1">
                            <Link2 className="w-3 h-3" />
                            Previous: {rec.previousHash.substring(0, 24)}...
                          </div>
                        )}

                        {rec.transactionId && (
                          <div className="mt-1 text-[10px] text-navy-400 font-mono">
                            TX: {rec.transactionId}
                          </div>
                        )}

                        {/* Tamper / Restore Buttons (Admin only) */}
                        {user?.role === 'admin' && rec.action === 'CERTIFICATE_REGISTERED' && (
                          <div className="mt-3 pt-3 border-t border-navy-100 flex gap-2">
                            {isCertMismatch ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                                onClick={() => handleRestore(rec.certificateId)}
                                icon={<RotateCcw className="w-3.5 h-3.5" />}
                              >
                                Restore Original Hash
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleSimulateTamper(rec.certificateId)}
                                icon={<AlertTriangle className="w-3.5 h-3.5" />}
                              >
                                Simulate Tampering — Demo
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Validation Error Details */}
                        {isInvalid && blockVal?.message && (
                          <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-200">
                            <p className="text-xs font-medium text-red-800 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Validation Error
                            </p>
                            <p className="text-[11px] text-red-700 mt-1">{blockVal.message}</p>
                          </div>
                        )}
                      </div>

                      {/* Chain Link Arrow */}
                      {i < records.length - 1 && (
                        <div className="flex justify-center">
                          <div className="flex flex-col items-center">
                            <ArrowDown className="w-5 h-5 text-navy-300" />
                            <span className="text-[9px] text-navy-300 font-mono">chain link</span>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )}
          </div>

          {/* Why Blockchain? */}
          <div className="bg-white rounded-xl border border-navy-100 p-6">
            <h2 className="text-sm font-semibold text-navy-800 mb-2">Why Blockchain?</h2>
            <p className="text-xs text-navy-500 mb-5">
              Blockchain provides a tamper-resistant record of the certificate fingerprint. If the certificate is modified later,
              its new hash will not match the original blockchain record.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Match */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-800">Authentic Certificate</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-navy-500 font-medium">Original Certificate Hash</p>
                    <code className="text-navy-700 font-mono">ABC123...XYZ</code>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-emerald-100">
                    <p className="text-navy-500 font-medium">Blockchain Hash</p>
                    <code className="text-navy-700 font-mono">ABC123...XYZ</code>
                  </div>
                  <div className="text-center">
                    <Badge variant="green">✓ MATCH — Authentic</Badge>
                  </div>
                </div>
              </div>
              {/* Mismatch */}
              <div className="rounded-xl border border-red-200 bg-red-50/50 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-800">Tampered Certificate</span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-navy-500 font-medium">Modified Certificate Hash</p>
                    <code className="text-navy-700 font-mono">XYZ789...QRS</code>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-red-100">
                    <p className="text-navy-500 font-medium">Blockchain Hash</p>
                    <code className="text-navy-700 font-mono">ABC123...XYZ</code>
                  </div>
                  <div className="text-center">
                    <Badge variant="red">✕ MISMATCH — Tampered</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)} title="Blockchain Record Details" size="md">
        {selectedRecord && (
          <div className="space-y-4">
            {[
              { label: 'Certificate ID', value: selectedRecord.certificateId },
              { label: 'Action', value: getActionLabel(selectedRecord.action) },
              { label: 'Actor', value: selectedRecord.actor || 'System' },
              { label: 'Block Number', value: `#${selectedRecord.blockNumber}` },
              { label: 'Transaction ID', value: selectedRecord.transactionId || 'N/A' },
              { label: 'Network', value: selectedRecord.network },
              { label: 'Timestamp', value: new Date(selectedRecord.timestamp).toLocaleString() },
              { label: 'Status', value: selectedRecord.status },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-navy-50">
                <span className="text-xs font-medium text-navy-500">{item.label}</span>
                <span className="text-sm text-navy-800 font-medium">{item.value}</span>
              </div>
            ))}
            <HashDisplay hash={selectedRecord.hash} label="Certificate SHA-256 Hash" truncated={false} />
            {selectedRecord.previousHash && (
              <HashDisplay hash={selectedRecord.previousHash} label="Previous Block Hash" />
            )}
            {selectedRecord.currentHash && (
              <HashDisplay hash={selectedRecord.currentHash} label="Current Block Hash" truncated={false} />
            )}
            <HashDisplay hash={selectedRecord.transactionHash} label="Transaction Hash" truncated={false} />
          </div>
        )}
      </Modal>
    </div>
  );
}
