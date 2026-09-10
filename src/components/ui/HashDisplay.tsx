import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface HashDisplayProps {
  hash: string;
  label?: string;
  truncated?: boolean;
}

export function HashDisplay({ hash, label, truncated = true }: HashDisplayProps) {
  const [copied, setCopied] = useState(false);

  const displayHash = truncated && hash.length > 16
    ? `${hash.slice(0, 8)}...${hash.slice(-4)}`
    : hash;

  const copyHash = async () => {
    await navigator.clipboard.writeText(hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-navy-500 mb-1">{label}</p>
      )}
      <div className="flex items-center gap-2">
        <code className="text-xs font-mono bg-navy-50 text-navy-700 px-2.5 py-1.5 rounded-md border border-navy-100">
          {displayHash}
        </code>
        <button
          onClick={copyHash}
          className="p-1.5 rounded-md text-navy-400 hover:text-navy-600 hover:bg-navy-100 transition-colors"
          title="Copy full hash"
          aria-label="Copy hash to clipboard"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
