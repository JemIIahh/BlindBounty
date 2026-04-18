import { useState, useEffect } from 'react';
import type { ForensicReport } from '../lib/forensicTypes';
import { buildForensicReport } from '../lib/forensics';
import { Badge } from './ui';

interface ForensicExtractorProps {
  file: File;
  taskId: string;
  workerAddress: string;
  onReportReady: (report: ForensicReport) => void;
}

export function ForensicExtractor({ file, taskId, workerAddress, onReportReady }: ForensicExtractorProps) {
  const [report, setReport] = useState<ForensicReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    buildForensicReport(file, taskId, workerAddress)
      .then((r) => {
        if (cancelled) return;
        setReport(r);
        onReportReady(r);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || 'Forensic extraction failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [file, taskId, workerAddress]);

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 animate-pulse">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Analyzing photo metadata...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-sm text-red-400">
        Forensic analysis error: {error}
      </div>
    );
  }

  if (!report) return null;

  const sourceBadge = {
    camera: { variant: 'success' as const, label: 'Camera' },
    gallery: { variant: 'warning' as const, label: 'Gallery' },
    screenshot: { variant: 'danger' as const, label: 'Screenshot' },
    edited: { variant: 'warning' as const, label: 'Edited' },
    unknown: { variant: 'default' as const, label: 'Unknown' },
  }[report.photoSource];

  const freshnessLabel = report.freshness.photoAgeMs !== null
    ? report.freshness.isFresh
      ? `Taken ${Math.round(report.freshness.photoAgeMs / 60000)} min ago`
      : `Photo is ${Math.round(report.freshness.photoAgeMs / 3600000)}h old`
    : 'No timestamp';

  return (
    <div className="p-4 rounded-xl bg-neutral-900/50 border border-neutral-800 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Forensic Analysis</span>
        <Badge variant={sourceBadge.variant} size="sm">{sourceBadge.label}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-neutral-500 text-xs">Freshness</span>
          <p className={`mt-0.5 ${report.freshness.isFresh ? 'text-emerald-400' : 'text-amber-400'}`}>
            {freshnessLabel}
          </p>
        </div>
        <div>
          <span className="text-neutral-500 text-xs">GPS</span>
          <p className="mt-0.5 text-neutral-300">
            {report.exif.gpsLat != null ? `${report.exif.gpsLat.toFixed(4)}, ${report.exif.gpsLng?.toFixed(4)}` : 'Not available'}
          </p>
        </div>
        {report.exif.make && (
          <div>
            <span className="text-neutral-500 text-xs">Camera</span>
            <p className="mt-0.5 text-neutral-300">{report.exif.make} {report.exif.model || ''}</p>
          </div>
        )}
        <div>
          <span className="text-neutral-500 text-xs">Hash</span>
          <p className="mt-0.5 text-neutral-500 font-mono text-xs">{report.phash}</p>
        </div>
      </div>

      {report.tamperingSignals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {report.tamperingSignals.map((signal) => (
            <Badge key={signal} variant="warning" size="sm">{signal.replace(/_/g, ' ')}</Badge>
          ))}
        </div>
      )}

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        This metadata will be shared with the verifier. Your photo stays encrypted and private.
      </p>
    </div>
  );
}
