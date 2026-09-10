import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Cloud,
  Blocks,
  QrCode,
  ArrowRight,
  FileCheck,
  Hash,
  CheckCircle2,
  UploadCloud,
  Zap,
  Lock,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-navy-900 tracking-tight">AcademicVerify</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#home" className="text-sm font-medium text-navy-600 hover:text-primary-600 transition-colors">Home</a>
            <a href="#how-it-works" className="text-sm font-medium text-navy-600 hover:text-primary-600 transition-colors">How It Works</a>
            <a href="#about" className="text-sm font-medium text-navy-600 hover:text-primary-600 transition-colors">About</a>
            <button
              onClick={() => navigate('/verify')}
              className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
            >
              Verify Certificate
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
              Login
            </Button>
            <Button size="sm" onClick={() => navigate('/login')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white to-blue-50/30" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                <Lock className="w-3.5 h-3.5" />
                Blockchain-Secured Verification
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 leading-tight tracking-tight">
                Verify Academic Certificates{' '}
                <span className="text-primary-600">With Confidence</span>
              </h1>
              <p className="mt-6 text-lg text-navy-600 leading-relaxed max-w-xl">
                AcademicVerify combines cloud technology, cryptographic hashing, and blockchain
                verification to make academic credentials secure, traceable, and easy to verify.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Button size="lg" onClick={() => navigate('/verify')} icon={<ShieldCheck className="w-5 h-5" />}>
                  Verify a Certificate
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/login')} icon={<ArrowRight className="w-5 h-5" />}>
                  Get Started
                </Button>
              </div>
              <p className="mt-6 text-sm text-navy-400 italic">
                "Upload once. Secure on blockchain. Verify instantly."
              </p>
            </div>

            {/* Visual Flow */}
            <div className="hidden lg:flex justify-center animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="relative bg-white rounded-2xl shadow-xl border border-navy-100 p-8 w-full max-w-md">
                <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-6">Verification Workflow</p>
                <div className="space-y-4">
                  {[
                    { icon: FileCheck, label: 'Certificate', sub: 'Upload document', color: 'bg-blue-50 text-blue-600' },
                    { icon: Hash, label: 'SHA-256 Hash', sub: 'Generate fingerprint', color: 'bg-amber-50 text-amber-600' },
                    { icon: Blocks, label: 'Blockchain', sub: 'Record on ledger', color: 'bg-purple-50 text-purple-600' },
                    { icon: CheckCircle2, label: 'Verified', sub: 'Authenticity confirmed', color: 'bg-emerald-50 text-emerald-600' },
                  ].map((step, i) => (
                    <React.Fragment key={step.label}>
                      <div className="flex items-center gap-4">
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${step.color}`}>
                          <step.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-navy-800">{step.label}</p>
                          <p className="text-xs text-navy-500">{step.sub}</p>
                        </div>
                      </div>
                      {i < 3 && (
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-navy-200" />
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-navy-50/50 border-y border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Cloud, label: 'Secure Cloud Storage', desc: 'Enterprise-grade cloud infrastructure' },
              { icon: Blocks, label: 'Blockchain Integrity', desc: 'Tamper-resistant verification records' },
              { icon: Zap, label: 'Instant Verification', desc: 'Verify credentials in seconds' },
              { icon: QrCode, label: 'QR Verification', desc: 'Scan and verify on any device' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-4">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-800">{item.label}</p>
                  <p className="text-xs text-navy-500 mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-navy-900">How It Works</h2>
          <p className="text-navy-500 mt-3 max-w-lg mx-auto">
            Four simple steps from certificate issuance to instant verification.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              step: '01',
              title: 'Certificate Upload',
              desc: 'Institution uploads the certificate securely to the platform.',
              icon: UploadCloud,
              color: 'text-blue-600 bg-blue-50',
            },
            {
              step: '02',
              title: 'Blockchain Storage',
              desc: 'Certificate hash is recorded on blockchain for tamper-proof verification.',
              icon: Blocks,
              color: 'text-purple-600 bg-purple-50',
            },
            {
              step: '03',
              title: 'QR / ID Verification',
              desc: 'Verifier scans QR code or enters Certificate ID to check authenticity.',
              icon: QrCode,
              color: 'text-amber-600 bg-amber-50',
            },
            {
              step: '04',
              title: 'Instant Result',
              desc: 'System confirms whether the certificate is valid, tampered, or revoked.',
              icon: ShieldCheck,
              color: 'text-emerald-600 bg-emerald-50',
            },
          ].map((item) => (
            <div
              key={item.step}
              className="relative bg-white rounded-xl border border-navy-100 p-6 hover:shadow-lg transition-all duration-300 group"
            >
              <span className="text-4xl font-extrabold text-navy-100 group-hover:text-primary-100 transition-colors">
                {item.step}
              </span>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center mt-4 ${item.color}`}>
                <item.icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-navy-800 mt-4">{item.title}</h3>
              <p className="text-sm text-navy-500 mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-navy-50/50 border-t border-navy-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-navy-900">About AcademicVerify</h2>
            <p className="text-navy-600 mt-4 leading-relaxed">
              AcademicVerify is a Cloud-Based Blockchain Framework for Secure Academic Certificate
              Verification and Management. Developed as a capstone project, it demonstrates how
              cloud computing, cryptographic hashing (SHA-256), and blockchain technology can work
              together to create a secure, transparent, and efficient certificate verification system.
            </p>
            <p className="text-sm text-navy-400 mt-4">
              Trusted academic credentials, verified in seconds.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Verify a certificate in seconds.
          </h2>
          <p className="text-primary-100 mt-3 max-w-md mx-auto">
            Enter a Certificate ID or scan a QR code to instantly verify the authenticity of any registered academic certificate.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-8 bg-white text-primary-700 hover:bg-primary-50"
            onClick={() => navigate('/verify')}
            icon={<ShieldCheck className="w-5 h-5" />}
          >
            Start Verification
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-900 text-navy-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white">AcademicVerify</span>
              </div>
              <p className="text-xs text-navy-400 leading-relaxed">
                Cloud-Based Blockchain Framework for Secure Academic Certificate Verification and Management.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-200 uppercase tracking-wider mb-3">Platform</p>
              <div className="space-y-2">
                <button onClick={() => navigate('/verify')} className="block text-sm text-navy-400 hover:text-white transition-colors">Verify Certificate</button>
                <button onClick={() => navigate('/login')} className="block text-sm text-navy-400 hover:text-white transition-colors">Login</button>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-200 uppercase tracking-wider mb-3">Technology</p>
              <div className="space-y-2 text-sm text-navy-400">
                <p>Cloud Computing</p>
                <p>SHA-256 Hashing</p>
                <p>Blockchain</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-navy-200 uppercase tracking-wider mb-3">Legal</p>
              <div className="space-y-2">
                <p className="text-sm text-navy-400">Privacy Policy</p>
                <p className="text-sm text-navy-400">Terms of Service</p>
              </div>
            </div>
          </div>
          <div className="border-t border-navy-800 mt-10 pt-6 text-center">
            <p className="text-xs text-navy-500">
              © {new Date().getFullYear()} AcademicVerify. Capstone Project — Prototype Environment.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
