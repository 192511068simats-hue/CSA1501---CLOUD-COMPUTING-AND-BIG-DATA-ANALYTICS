import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  QrCode,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  GraduationCap,
  ArrowLeft,
  FileCheck,
  Blocks,
  Clock,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { HashDisplay } from '../components/ui/HashDisplay';
import { verificationService } from '../services/verificationService';
import { parseQRCodePayload } from '../services/qrService';
import { VerificationResponse } from '../types/blockchain';

export function Verify() {
  const [searchParams] = useSearchParams();
  const { id: urlParamId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [certificateId, setCertificateId] = useState(urlParamId || searchParams.get('id') || '');
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isProcessingRef = useRef(false);
  const verificationRequestIdRef = useRef(0);

  const queryId = searchParams.get('id');

  // Auto-verify if ID is in URL
  useEffect(() => {
    const id = urlParamId || queryId;
    if (id && id !== certificateId) {
      setCertificateId(id);
      handleVerify(id);
    }
  }, [urlParamId, queryId]);

  const handleVerify = async (id?: string | any) => {
    console.log('[VERIFY] Button clicked', { id, certificateId });
    const certId = typeof id === 'string' ? id : certificateId.trim();
    if (!certId) {
      console.log('[VERIFY] No cert ID');
      return;
    }

    console.log('[VERIFY] Certificate ID:', certId);
    console.log('[VERIFY] Starting verification');

    const currentRequestId = ++verificationRequestIdRef.current;
    
    setVerifying(true);
    setResult(null);
    
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      });
      
      const res = await Promise.race([
        verificationService.verifyCertificate(certId, 'certificate_id'),
        timeoutPromise
      ]);
      
      if (currentRequestId === verificationRequestIdRef.current) {
        setResult(res as VerificationResponse);
      }
    } catch (err: any) {
      if (currentRequestId === verificationRequestIdRef.current) {
        if (err.message === 'TIMEOUT') {
          setResult({
            result: 'timeout',
            message: 'Verification timed out. The certificate verification service did not respond within the expected time. Please try again.',
          });
        } else {
          setResult({
            result: 'error',
            message: 'Unable to reach verification service. Please try again.',
          });
        }
      }
    } finally {
      if (currentRequestId === verificationRequestIdRef.current) {
        setVerifying(false);
        setIsProcessing(false);
        isProcessingRef.current = false;
      }
    }
  };

  const handleScan = (detected: any) => {
    if (!detected || isProcessingRef.current) return;
    
    let scannedValue = '';
    if (Array.isArray(detected) && detected.length > 0) {
      scannedValue = detected[0].rawValue;
    } else if (detected.text) {
      scannedValue = detected.text;
    } else if (typeof detected === 'string') {
      scannedValue = detected;
    }

    if (scannedValue) {
      isProcessingRef.current = true;
      setIsProcessing(true);
      const extractedId = parseQRCodePayload(scannedValue);
      
      setShowScanner(false);
      
      if (extractedId) {
        setCertificateId(extractedId);
        handleVerify(extractedId);
      } else {
        setResult({
          result: 'not_found',
          message: 'Invalid AcademicVerify QR Code. The QR code format is not recognized.',
        });
        isProcessingRef.current = false;
        setIsProcessing(false);
      }
    }
  };

  const closeScanner = () => {
    setShowScanner(false);
    isProcessingRef.current = false;
    setIsProcessing(false);
    verificationRequestIdRef.current++;
  };

  const resetVerification = () => {
    setResult(null);
    setCertificateId('');
    isProcessingRef.current = false;
    setIsProcessing(false);
    verificationRequestIdRef.current++;
    navigate('/verify');
  };

  const handleDemoTampered = async () => {
    verificationRequestIdRef.current++;
    setCertificateId('CERT-2026-TAMPERED');
    setVerifying(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult({
      result: 'tampered',
      certificateId: 'CERT-2026-TAMPERED',
      integrityStatus: 'tampered',
      hashMatch: false,
      originalHash: '7c9a1f2b8e4d92bd...',
      currentHash: '91ab42cd11771c...',
      registeredAt: new Date(Date.now() - 3600000).toISOString(),
      verifiedAt: new Date().toISOString(),
      blockchainRecordId: '0x8a3291ef...',
      blockchainStatus: 'confirmed',
      message: 'The certificate fingerprint does not match the registered blockchain record.',
    });
    setVerifying(false);
  };

  const renderResult = () => {
    if (!result) return null;

    switch (result.result) {
      case 'authentic':
        return (
          <div className="animate-scale-in max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-emerald-800 mt-4">✓ CERTIFICATE AUTHENTIC</h2>
                <p className="text-sm text-emerald-600 mt-2 max-w-lg mx-auto">The current certificate matches the original blockchain-registered fingerprint.</p>
              </div>

              {/* Certificate Details */}
              <div className="p-6 space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  {result.certificate && [
                    { label: 'Student Name', value: result.certificate.studentName },
                    { label: 'Register Number', value: result.certificate.registerNumber },
                    { label: 'Institution', value: result.certificate.institution },
                    { label: 'Department', value: result.certificate.department },
                    { label: 'Degree', value: result.certificate.degree },
                    { label: 'Certificate ID', value: result.certificate.certificateId },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-navy-500">{item.label}</p>
                      <p className="text-sm font-medium text-navy-800 mt-0.5">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Hash Comparison */}
                <div className="bg-navy-50 rounded-xl p-5 border border-navy-100">
                  <h3 className="text-sm font-bold text-navy-800 mb-4 text-center tracking-wide uppercase">Integrity Verification Evidence</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 relative">
                      <p className="text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wide">Original (Blockchain)</p>
                      <code className="text-sm font-mono text-emerald-700 break-all">{result.originalHash ? result.originalHash.substring(0, 16) + '...' : ''}</code>
                      <p className="text-[10px] text-navy-400 mt-2">Registered: {new Date(result.registeredAt || '').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-emerald-100 relative">
                      <p className="text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wide">Current (Certificate)</p>
                      <code className="text-sm font-mono text-emerald-700 break-all">{result.currentHash ? result.currentHash.substring(0, 16) + '...' : ''}</code>
                      <p className="text-[10px] text-navy-400 mt-2">Verified: {new Date(result.verifiedAt || '').toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-4 text-center">
                    <Badge variant="green" className="px-3 py-1 font-bold text-sm tracking-widest shadow-sm">INTEGRITY MATCH ✓</Badge>
                  </div>
                </div>

                {/* Blockchain Info */}
                {result.blockchain && (
                  <div className="border-t border-navy-100 pt-5">
                     <div className="text-center space-y-2">
                       <p className="text-xs font-semibold text-navy-800">Verified against block #{result.blockchain.blockNumber}</p>
                       <div>
                         <p className="text-[10px] text-navy-400 mb-1">Transaction ID</p>
                         <code className="text-xs font-mono text-navy-600 bg-navy-50 px-2 py-1 rounded border border-navy-100">
                           {result.blockchain.transactionId || result.blockchain.transactionHash}
                         </code>
                       </div>
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'tampered':
        return (
          <div className="animate-scale-in max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg overflow-hidden">
              <div className="bg-red-50 border-b border-red-200 px-6 py-6 text-center">
                <div className="w-16 h-16 bg-red-100 border-4 border-white shadow-sm rounded-full flex items-center justify-center mx-auto">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-red-800 mt-4">✕ CERTIFICATE INTEGRITY FAILED</h2>
                <p className="text-sm font-semibold text-red-600 mt-2 uppercase tracking-wide">Certificate Content Has Changed</p>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Hash Comparison Box */}
                <div className="bg-red-50/50 rounded-xl p-5 border-2 border-red-100">
                  <h3 className="text-sm font-bold text-red-800 mb-4 text-center tracking-wide uppercase">Certificate Integrity Evidence</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm relative">
                      <p className="text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wide">Original Blockchain Hash</p>
                      <code className="text-sm font-mono text-navy-800 break-all">{result.originalHash ? result.originalHash.substring(0, 16) + '...' : ''}</code>
                      <p className="text-[10px] text-navy-400 mt-2">Registered: {new Date(result.registeredAt || '').toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-red-200 shadow-sm relative">
                      <p className="text-xs font-semibold text-navy-500 mb-2 uppercase tracking-wide">Current Certificate Hash</p>
                      <code className="text-sm font-mono text-red-700 break-all">{result.currentHash ? result.currentHash.substring(0, 16) + '...' : ''}</code>
                      <p className="text-[10px] text-navy-400 mt-2">Detected: {new Date(result.verifiedAt || '').toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="mt-5 text-center">
                    <Badge variant="red" className="px-4 py-1.5 font-bold text-sm tracking-widest shadow-sm">✕ HASH MISMATCH</Badge>
                  </div>
                </div>

                {/* Audit Timeline */}
                <div className="border border-navy-100 rounded-xl p-5 bg-white">
                  <h3 className="text-sm font-semibold text-navy-800 mb-4">Audit Timeline</h3>
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2.5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-navy-200 before:to-transparent">
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-emerald-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <Check className="w-3 h-3" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-navy-100 bg-navy-50/50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-navy-900">Certificate Registered</h4>
                          <span className="text-[10px] font-medium text-navy-500">{new Date(result.registeredAt || '').toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-navy-600">Original hash committed to blockchain block #{result.blockchain?.blockNumber || '?'}.</p>
                      </div>
                    </div>
                    
                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white bg-red-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow">
                        <XCircle className="w-3 h-3" />
                      </div>
                      <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-1.5rem)] p-3 rounded-lg border border-red-100 bg-red-50">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-xs font-bold text-red-900">Integrity Verification Failed</h4>
                          <span className="text-[10px] font-medium text-red-500">{new Date(result.verifiedAt || '').toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[11px] text-red-700">Current certificate content differs from original.</p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );

      case 'revoked':
        return (
          <div className="animate-scale-in max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-amber-200 shadow-lg overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-100 px-6 py-6 text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-xl font-bold text-amber-800 mt-4">Certificate Revoked</h2>
                <p className="text-sm text-amber-600 mt-1">{result.message}</p>
              </div>
              <div className="p-6 space-y-4">
                {result.certificate && (
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-navy-500">Certificate ID</p>
                      <p className="text-sm font-mono text-navy-800">{result.certificate.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-navy-500">Student</p>
                      <p className="text-sm text-navy-800">{result.certificate.studentName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-navy-500">Institution</p>
                      <p className="text-sm text-navy-800">{result.certificate.institution}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-navy-500">Revocation Status</p>
                      <Badge variant="red" dot>Revoked</Badge>
                    </div>
                  </div>
                )}
                {result.revocation && (
                  <div className="bg-amber-50/50 rounded-lg p-4 border border-amber-100">
                    <p className="text-xs font-medium text-navy-500 mb-1">Revocation Date</p>
                    <p className="text-sm text-navy-700">{new Date(result.revocation.revokedAt).toLocaleDateString()}</p>
                    <p className="text-xs font-medium text-navy-500 mt-3 mb-1">Reason</p>
                    <p className="text-sm text-navy-700">{result.revocation.reason}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'pending':
        return (
          <div className="animate-scale-in max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl border border-blue-200 shadow-lg overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 px-6 py-6 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-blue-800 mt-4">Certificate Pending Review</h2>
                <p className="text-sm text-blue-600 mt-1">{result.message}</p>
              </div>
              <div className="p-6">
                <p className="text-sm text-navy-600 text-center">
                  This certificate has been issued but is currently pending administrative review. 
                  Please check back later once the verification is complete.
                </p>
                {result.certificate && (
                  <div className="grid sm:grid-cols-2 gap-4 mt-6">
                    <div>
                      <p className="text-xs font-medium text-navy-500">Certificate ID</p>
                      <p className="text-sm font-mono text-navy-800">{result.certificate.certificateId}</p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-navy-500">Student</p>
                      <p className="text-sm text-navy-800">{result.certificate.studentName}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'not_found':
        return (
          <div className="animate-scale-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-navy-200 shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-navy-100 rounded-full flex items-center justify-center mx-auto">
                <HelpCircle className="w-8 h-8 text-navy-400" />
              </div>
              <h2 className="text-lg font-bold text-navy-800 mt-4">Certificate Not Found</h2>
              <p className="text-sm text-navy-500 mt-2">{result.message}</p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={resetVerification}
              >
                Try Again
              </Button>
            </div>
          </div>
        );

      case 'timeout':
        return (
          <div className="animate-scale-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-red-800 mt-4">Verification Timed Out</h2>
              <p className="text-sm text-red-600 mt-2">{result.message}</p>
              <div className="flex justify-center gap-3 mt-6">
                <Button variant="outline" onClick={resetVerification}>Back</Button>
                <Button onClick={() => handleVerify(certificateId)}>Try Again</Button>
              </div>
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="animate-scale-in max-w-lg mx-auto">
            <div className="bg-white rounded-2xl border border-red-200 shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-red-800 mt-4">Verification Error</h2>
              <p className="text-sm text-red-600 mt-2">{result.message}</p>
              <div className="flex justify-center gap-3 mt-6">
                <Button variant="outline" onClick={resetVerification}>Back</Button>
                <Button onClick={() => handleVerify(certificateId)}>Try Again</Button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy-50/30 to-white">
      {/* Header */}
      <header className="bg-white border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900 tracking-tight">AcademicVerify</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!result && !verifying ? (
          <div className="animate-fade-in">
            <div className="text-center mb-10">
              <div className="w-14 h-14 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7 text-primary-600" />
              </div>
              <h1 className="text-3xl font-bold text-navy-900 mt-5">Verify Academic Certificate</h1>
              <p className="text-navy-500 mt-2 max-w-lg mx-auto">
                Verify the authenticity and integrity of an academic certificate in seconds.
              </p>
            </div>

            {/* Verification Methods */}
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
              {/* Certificate ID */}
              <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-primary-500" />
                  <h2 className="text-sm font-semibold text-navy-800">Certificate ID</h2>
                </div>
                <input
                  type="text"
                  placeholder="Enter Certificate ID"
                  value={certificateId}
                  onChange={(e) => setCertificateId(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  className="w-full px-3.5 py-2.5 text-sm border border-navy-200 rounded-lg placeholder:text-navy-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono transition-all"
                />
                <Button
                  className="w-full mt-3"
                  onClick={() => handleVerify()}
                  loading={verifying}
                  loadingText="Verifying certificate..."
                  disabled={!certificateId.trim()}
                  icon={<ShieldCheck className="w-4 h-4" />}
                >
                  Verify Certificate
                </Button>
              </div>

              {/* QR Code */}
              <div className="bg-white rounded-xl border border-navy-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-5 h-5 text-primary-500" />
                  <h2 className="text-sm font-semibold text-navy-800">QR Code</h2>
                </div>
                <p className="text-xs text-navy-500 mb-4">
                  Scan a certificate QR code to verify its authenticity instantly.
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowScanner(true)}
                  icon={<QrCode className="w-4 h-4" />}
                >
                  Scan QR Code
                </Button>
                
                {/* Full Screen Scanner Overlay */}
                {showScanner && (
                  <div className="fixed inset-0 z-50 flex flex-col bg-black/95">
                    <div className="flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
                      <h2 className="text-white font-semibold">Scan Certificate QR Code</h2>
                      <button 
                        onClick={closeScanner}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                      >
                        <XCircle className="w-6 h-6" />
                      </button>
                    </div>
                    
                    <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      <div className="w-full max-w-lg aspect-square max-h-[80vh] relative">
                        {/* Scanner Frame Guide */}
                        <div className="absolute inset-0 z-10 pointer-events-none border-[3px] border-white/20 m-6 rounded-3xl" />
                        
                        {!isProcessing ? (
                          <Scanner 
                            onScan={handleScan}
                            constraints={{ facingMode: undefined }}
                            onError={(err) => {
                              console.error('Camera error:', err);
                              let msg = 'Camera access is required to scan a certificate QR code. Please allow camera access in your browser settings.';
                              
                              const errName = err && typeof err === 'object' && 'name' in err ? err.name : (err instanceof Error ? err.name : String(err));
                              
                              if (errName === 'NotAllowedError' || errName === 'SecurityError') {
                                msg = 'Camera access was denied. Please allow camera access in your browser settings and try again.';
                              } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
                                msg = 'No camera was detected on this device.';
                              } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
                                msg = 'Camera already in use. Please close other applications using the camera.';
                              } else if (errName === 'OverconstrainedError' || errName === 'ConstraintNotSatisfiedError') {
                                msg = 'The requested camera constraints are not supported by this device.';
                              } else if (errName === 'NotSupportedError' || (err && typeof err === 'object' && 'message' in err && err.message === 'this browser has no Stream API support')) {
                                msg = 'Camera access is not supported by this browser.';
                              }

                              closeScanner();
                              setResult({
                                result: 'not_found',
                                message: msg,
                              });
                            }}
                            styles={{
                              container: { width: '100%', height: '100%' },
                              video: { objectFit: 'cover' }
                            }}
                          />
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-navy-900/90 text-white">
                            <Loader2 className="w-10 h-10 animate-spin text-primary-400 mb-4" />
                            <p className="font-medium text-lg">QR Code Detected</p>
                            <p className="text-sm text-navy-300">Verifying Certificate...</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-8 text-center bg-gradient-to-t from-black/80 to-transparent">
                      <p className="text-white/70 text-sm">Point your camera at the AcademicVerify QR code</p>
                      <Button 
                        variant="outline" 
                        onClick={closeScanner}
                        className="mt-6 border-white/20 text-white hover:bg-white/10 w-full max-w-xs mx-auto"
                      >
                        Cancel Scanning
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Demo Quick Actions */}
            <div className="max-w-2xl mx-auto mt-8">
              <p className="text-xs font-medium text-navy-400 text-center mb-3 uppercase tracking-wider">
                Demo Verification — Try These
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" size="sm" onClick={() => { setCertificateId('CERT-2026-000001'); handleVerify('CERT-2026-000001'); }}>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Valid Certificate
                </Button>
                <Button variant="outline" size="sm" onClick={handleDemoTampered}>
                  <XCircle className="w-3.5 h-3.5 text-red-500" /> Tampered Demo
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCertificateId('CERT-2026-000005'); handleVerify('CERT-2026-000005'); }}>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Revoked Certificate
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setCertificateId('CERT-INVALID-999'); handleVerify('CERT-INVALID-999'); }}>
                  <HelpCircle className="w-3.5 h-3.5 text-navy-400" /> Not Found
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={resetVerification}
                className="flex items-center gap-2 text-sm text-navy-500 hover:text-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                New Verification
              </button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetVerification();
                  setTimeout(() => setShowScanner(true), 50);
                }}
                icon={<QrCode className="w-4 h-4" />}
              >
                Scan Another
              </Button>
            </div>
            {verifying ? (
              <div className="flex flex-col items-center py-20">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
                <p className="text-sm text-navy-500 mt-3">Verifying certificate...</p>
              </div>
            ) : (
              renderResult()
            )}
          </div>
        )}
      </main>
    </div>
  );
}
