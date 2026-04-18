import type { SignedForensicReport, ForensicValidation, DeviceFingerprint } from '../types.js';

interface StoredForensicData {
  signedReport: SignedForensicReport;
  validation: ForensicValidation;
  storedAt: number;
}

interface PhashEntry {
  taskId: string;
  workerAddress: string;
  phash: string;
  storedAt: number;
}

export class ForensicStore {
  private reports = new Map<string, StoredForensicData>();
  private phashes: PhashEntry[] = [];
  private deviceFingerprints = new Map<string, DeviceFingerprint[]>();

  saveReport(taskId: string, signedReport: SignedForensicReport, validation: ForensicValidation): void {
    this.reports.set(taskId, { signedReport, validation, storedAt: Date.now() });
    this.phashes.push({
      taskId,
      workerAddress: signedReport.report.workerAddress,
      phash: signedReport.report.phash,
      storedAt: Date.now(),
    });
  }

  getReport(taskId: string): { signedReport: SignedForensicReport; validation: ForensicValidation } | null {
    const data = this.reports.get(taskId);
    if (!data) return null;
    return { signedReport: data.signedReport, validation: data.validation };
  }

  findPhashMatches(phash: string, maxHammingDistance: number): { taskId: string; workerAddress: string; distance: number }[] {
    const matches: { taskId: string; workerAddress: string; distance: number }[] = [];
    for (const entry of this.phashes) {
      const distance = hammingDistance(phash, entry.phash);
      if (distance <= maxHammingDistance) {
        matches.push({ taskId: entry.taskId, workerAddress: entry.workerAddress, distance });
      }
    }
    return matches;
  }

  recordDeviceFingerprint(workerAddress: string, fingerprint: DeviceFingerprint): void {
    const existing = this.deviceFingerprints.get(workerAddress) || [];
    // Check if this exact fingerprint is already recorded
    const isDuplicate = existing.some(
      (fp) => fp.screenWidth === fingerprint.screenWidth &&
              fp.screenHeight === fingerprint.screenHeight &&
              fp.webglRenderer === fingerprint.webglRenderer &&
              fp.userAgent === fingerprint.userAgent
    );
    if (!isDuplicate) {
      existing.push(fingerprint);
      this.deviceFingerprints.set(workerAddress, existing);
    }
  }

  getDeviceCount(workerAddress: string): number {
    return (this.deviceFingerprints.get(workerAddress) || []).length;
  }
}

function hammingDistance(a: string, b: string): number {
  if (a.length !== b.length) return Infinity;
  let distance = 0;
  for (let i = 0; i < a.length; i += 2) {
    const byteA = parseInt(a.substring(i, i + 2), 16);
    const byteB = parseInt(b.substring(i, i + 2), 16);
    let xor = byteA ^ byteB;
    while (xor) {
      distance += xor & 1;
      xor >>= 1;
    }
  }
  return distance;
}

// Singleton
export const forensicStore = new ForensicStore();
