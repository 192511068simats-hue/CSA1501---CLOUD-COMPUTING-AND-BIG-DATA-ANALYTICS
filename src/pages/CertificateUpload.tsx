import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  Hash,
  Cloud,
  Blocks,
  Shield,
  QrCode,
  Copy,
  Check,
  Download,
  ExternalLink,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Navbar } from '../components/layout/Navbar';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { HashDisplay } from '../components/ui/HashDisplay';
import { useToastContext } from '../components/ui/Toast';
import { useAuth } from '../hooks/useAuth';
import { generateSHA256 } from '../services/hashService';
import { certificateService } from '../services/certificateService';
import { getCertificateQRValue } from '../services/qrService';
import { CertificateFormData, CertificateType, Certificate } from '../types/certificate';

export function CertificateUpload() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToastContext();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState('');
  const [hashLoading, setHashLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdCert, setCreatedCert] = useState<Certificate | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState<CertificateFormData>({
    studentName: user?.role === 'student' ? user.name : '',
    registerNumber: user?.role === 'student' && user.studentId ? user.studentId : '',
    degree: '',
    department: '',
    institution: user?.institution || '',
    certificateType: 'Degree Certificate',
    academicYear: '',
    issueDate: '',
  });

  const updateForm = (field: keyof CertificateFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  useEffect(() => {
    const successId = searchParams.get('success');
    if (successId && !createdCert) {
      certificateService.getById(successId).then(cert => {
        if (cert) {
          setCreatedCert(cert);
          setSuccess(true);
        }
      });
    }
  }, [searchParams, createdCert]);

  const handleFileSelect = useCallback(async (selected: File) => {
    if (selected.type !== 'application/pdf') {
      addToast('error', 'Invalid file type', 'Please upload a valid PDF file.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      addToast('error', 'File too large', 'File size exceeds the 10 MB limit.');
      return;
    }
    setFile(selected);
    setHashLoading(true);
    try {
      const hash = await generateSHA256(selected);
      setFileHash(hash);
    } catch {
      addToast('error', 'Hash generation failed', 'Could not generate certificate fingerprint.');
    } finally {
      setHashLoading(false);
    }
  }, [addToast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!form.studentName.trim()) newErrors.studentName = 'Student name is required';
    if (!form.registerNumber.trim()) newErrors.registerNumber = 'Register number is required';
    if (!form.degree.trim()) newErrors.degree = 'Degree is required';
    if (!form.department.trim()) newErrors.department = 'Department is required';
    if (!form.institution.trim()) newErrors.institution = 'Institution is required';
    if (!form.academicYear.trim()) newErrors.academicYear = 'Academic year is required';
    if (!form.issueDate) newErrors.issueDate = 'Issue date is required';
    if (!file) newErrors.file = 'Please upload a certificate PDF';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !file) return;

    setUploading(true);
    try {
      const cert = await certificateService.create(form, file, fileHash, user?.id, user?.name, user?.role);
      setCreatedCert(cert);
      setSuccess(true);
      setSearchParams({ success: cert.certificateId }, { replace: true });
      addToast('success', 'Certificate uploaded successfully', `Certificate ID: ${cert.certificateId}`);
    } catch (err) {
      addToast('error', 'Upload failed', err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const previewCertId = `CERT-${new Date().getFullYear()}-XXXXXX`;

  const handleDownloadQR = () => {
    if (!createdCert) return;
    const svg = document.getElementById('certificate-qr');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${createdCert.certificateId}-QR.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    if (!createdCert) return;
    const url = getCertificateQRValue(createdCert.certificateId);
    navigator.clipboard.writeText(url);
    addToast('success', 'Link Copied', 'Verification link copied to clipboard.');
  };

  // ============================
  // Enhanced Success Screen
  // ============================
  if (success && createdCert) {
    const steps = [
      { label: 'Certificate Uploaded', icon: UploadCloud, done: true },
      { label: 'SHA-256 Hash Generated', icon: Hash, done: true },
      { label: 'Certificate ID Created', icon: FileText, done: true },
      { label: 'Blockchain Record Created', icon: Blocks, done: true },
      { label: 'QR Verification Code Generated', icon: QrCode, done: true },
    ];

    return (
      <div className="flex-1 flex flex-col">
        <Navbar breadcrumbs={[{ label: 'Certificate Upload', path: '/certificates/upload' }, { label: 'Success' }]} />
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto animate-fade-in space-y-6">

            {/* Success Header */}
            <div className="bg-white rounded-2xl border border-emerald-200 shadow-lg overflow-hidden">
              <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-6 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-emerald-800 mt-4">Certificate Registered Successfully</h2>
                <p className="text-sm text-emerald-600 mt-1">Your academic certificate has been securely registered and is awaiting admin verification.</p>
              </div>

              {/* Progress Steps */}
              <div className="px-6 py-5 border-b border-navy-100">
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {steps.map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
                        <step.icon className="w-3.5 h-3.5" />
                        {step.label}
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                      {i < steps.length - 1 && <ArrowRight className="w-3 h-3 text-navy-300 hidden sm:block" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Verification Status */}
              <div className="px-6 py-4 bg-amber-50/50 border-b border-navy-100 flex items-center justify-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-semibold text-amber-700">Pending Admin Verification</span>
              </div>

              {/* Certificate Details */}
              <div className="p-6">
                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Certificate ID', value: createdCert.certificateId, mono: true },
                    { label: 'Student', value: createdCert.studentName },
                    { label: 'Register Number', value: createdCert.registerNumber },
                    { label: 'Institution', value: createdCert.institution },
                    { label: 'Degree', value: createdCert.degree },
                    { label: 'Certificate Type', value: createdCert.certificateType },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-xs font-medium text-navy-500">{item.label}</p>
                      <p className={`text-sm font-medium mt-0.5 ${item.mono ? 'font-mono text-primary-600' : 'text-navy-800'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Hash */}
                <div className="bg-navy-50 rounded-xl p-4 mb-6">
                  <HashDisplay hash={createdCert.sha256Hash} label="SHA-256 Document Fingerprint" truncated={false} />
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-emerald-500" />
                    <Badge variant="green" dot>Cloud Stored</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Blocks className="w-4 h-4 text-emerald-500" />
                    <Badge variant="green" dot>Blockchain Registered</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-amber-500" />
                    <Badge variant="yellow" dot>Pending Admin Approval</Badge>
                  </div>
                </div>

                {/* QR Code */}
                <div className="flex flex-col items-center bg-white rounded-xl border border-navy-200 p-6">
                  <h3 className="text-sm font-semibold text-navy-800 mb-4">Certificate QR Verification Code</h3>
                  <div className="bg-white rounded-xl border-2 border-navy-100 p-5 inline-block">
                    <QRCodeSVG
                      id="certificate-qr"
                      value={getCertificateQRValue(createdCert.certificateId)}
                      size={180}
                      level="M"
                    />
                  </div>
                  <p className="text-xs text-navy-400 mt-3">Scan this QR code to verify the certificate</p>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/verify?id=${createdCert.certificateId}`)} icon={<ExternalLink className="w-3.5 h-3.5" />}>
                      Open Verification Page
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadQR} icon={<Download className="w-3.5 h-3.5" />}>
                      Download QR
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyLink} icon={<Copy className="w-3.5 h-3.5" />}>
                      Copy Link
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
                <Button variant="outline" className="flex-1" onClick={() => navigate('/blockchain')} icon={<Blocks className="w-4 h-4" />}>
                  View Blockchain Record
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => navigate('/certificates')}>
                  View All Records
                </Button>
                <Button className="flex-1" onClick={() => navigate('/dashboard')}>
                  Back to Dashboard
                </Button>
              </div>
            </div>

          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <Navbar breadcrumbs={[{ label: 'Certificate Upload', path: '/certificates/upload' }, { label: 'Upload Certificate' }]} />
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
        <div className="animate-fade-in max-w-5xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-navy-900">Certificate Upload</h1>
            <p className="text-sm text-navy-500 mt-1">Securely register a new academic certificate.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Left: Upload + Form */}
              <div className="lg:col-span-2 space-y-6">
                {/* File Upload */}
                <div className="bg-white rounded-xl border border-navy-100 p-6">
                  <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-primary-500" />
                    Upload Certificate Document
                  </h2>

                  {!file ? (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                        dragOver
                          ? 'border-primary-400 bg-primary-50/50'
                          : errors.file
                          ? 'border-red-300 bg-red-50/30'
                          : 'border-navy-200 hover:border-primary-300 hover:bg-primary-50/30'
                      }`}
                    >
                      <UploadCloud className="w-10 h-10 text-navy-300 mx-auto" />
                      <p className="text-sm font-medium text-navy-700 mt-3">Upload PDF</p>
                      <p className="text-xs text-navy-400 mt-1">Drag and drop or click to browse</p>
                      <p className="text-xs text-navy-300 mt-2">PDF • Maximum 10 MB</p>
                      {errors.file && <p className="text-xs text-red-600 mt-2">{errors.file}</p>}
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 p-4 bg-navy-50 rounded-lg border border-navy-100">
                      <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-800 truncate">{file.name}</p>
                        <p className="text-xs text-navy-400">{formatFileSize(file.size)} • PDF</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setFile(null); setFileHash(''); }}
                        className="p-1.5 rounded-lg text-navy-400 hover:bg-navy-200 hover:text-navy-600 transition-colors"
                        aria-label="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </div>

                {/* Certificate Information */}
                <div className="bg-white rounded-xl border border-navy-100 p-6">
                  <h2 className="text-sm font-semibold text-navy-800 mb-4">Certificate Information</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Student Name" placeholder="Full name" value={form.studentName} onChange={(e) => updateForm('studentName', e.target.value)} error={errors.studentName} required />
                    <Input label="Register Number" placeholder="e.g. 71772211001" value={form.registerNumber} onChange={(e) => updateForm('registerNumber', e.target.value)} error={errors.registerNumber} required />
                    <Input label="Degree" placeholder="e.g. B.E. Computer Science" value={form.degree} onChange={(e) => updateForm('degree', e.target.value)} error={errors.degree} required />
                    <Input label="Department" placeholder="e.g. Computer Science and Engineering" value={form.department} onChange={(e) => updateForm('department', e.target.value)} error={errors.department} required />
                    <Input label="Institution" placeholder="e.g. Northstar Institute of Technology" value={form.institution} onChange={(e) => updateForm('institution', e.target.value)} error={errors.institution} required />
                    <Select
                      label="Certificate Type"
                      value={form.certificateType}
                      onChange={(e) => updateForm('certificateType', e.target.value as CertificateType)}
                      options={[
                        { value: 'Degree Certificate', label: 'Degree Certificate' },
                        { value: 'Provisional Certificate', label: 'Provisional Certificate' },
                        { value: 'Course Certificate', label: 'Course Certificate' },
                        { value: 'Academic Transcript', label: 'Academic Transcript' },
                      ]}
                    />
                    <Input label="Academic Year" placeholder="e.g. 2022-2026" value={form.academicYear} onChange={(e) => updateForm('academicYear', e.target.value)} error={errors.academicYear} required />
                    <Input label="Issue Date" type="date" value={form.issueDate} onChange={(e) => updateForm('issueDate', e.target.value)} error={errors.issueDate} required />
                  </div>
                </div>
              </div>

              {/* Right: Security Preview */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-navy-100 p-6 sticky top-20">
                  <h2 className="text-sm font-semibold text-navy-800 mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary-500" />
                    Security Preview
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-medium text-navy-500 mb-1">Certificate ID</p>
                      <p className="text-sm font-mono font-semibold text-primary-600">{previewCertId}</p>
                    </div>

                    <div>
                      {hashLoading ? (
                        <div>
                          <p className="text-xs font-medium text-navy-500 mb-1">SHA-256 Hash</p>
                          <div className="flex items-center gap-2 text-xs text-primary-600">
                            <div className="w-3.5 h-3.5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                            Generating secure fingerprint...
                          </div>
                        </div>
                      ) : fileHash ? (
                        <HashDisplay hash={fileHash} label="SHA-256 Hash" />
                      ) : (
                        <div>
                          <p className="text-xs font-medium text-navy-500 mb-1">SHA-256 Hash</p>
                          <p className="text-xs text-navy-400 italic">Upload a file to generate</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-navy-50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-navy-500 flex items-center gap-1.5">
                          <Cloud className="w-3.5 h-3.5" /> Storage Status
                        </span>
                        {file ? (
                          <Badge variant="green" dot>Cloud Ready</Badge>
                        ) : (
                          <Badge variant="gray">Awaiting Upload</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-navy-500 flex items-center gap-1.5">
                          <Blocks className="w-3.5 h-3.5" /> Blockchain
                        </span>
                        <Badge variant="yellow" dot>Pending Registration</Badge>
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full mt-6"
                    size="lg"
                    loading={uploading}
                    loadingText="Uploading & Registering..."
                    icon={<UploadCloud className="w-4 h-4" />}
                  >
                    Upload & Register Certificate
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
