import { ethers } from 'ethers';
import type { SignedForensicReport, ForensicValidation, ForensicCheck, TaskForensicRequirement } from '../types.js';
import { forensicStore } from './forensicStore.js';
import { config } from '../config.js';

export async function validateForensicReport(
  signedReport: SignedForensicReport,
  taskRequirement?: TaskForensicRequirement
): Promise<ForensicValidation> {
  const { report, signature } = signedReport;
  const checks: ForensicCheck[] = [];
  const flags: string[] = [];

  // 1. Signature verification
  try {
    const recovered = ethers.verifyMessage(report.reportHash, signature);
    const match = recovered.toLowerCase() === report.workerAddress.toLowerCase();
    checks.push({
      name: 'signature',
      passed: match,
      severity: 'critical',
      detail: match ? 'Signature verified' : `Signature mismatch: expected ${report.workerAddress}, got ${recovered}`,
    });
    if (!match) flags.push('signature_mismatch');
  } catch {
    checks.push({ name: 'signature', passed: false, severity: 'critical', detail: 'Signature verification failed' });
    flags.push('signature_invalid');
  }

  // 2. Photo source
  const category = taskRequirement?.category || 'general';
  const isPhysical = category === 'physical_presence' || category === 'location_based';
  if (report.photoSource === 'screenshot') {
    checks.push({
      name: 'photo_source',
      passed: !isPhysical,
      severity: isPhysical ? 'critical' : 'warning',
      detail: 'Photo identified as screenshot',
    });
    if (isPhysical) flags.push('screenshot_for_physical_task');
  } else if (report.photoSource === 'edited') {
    checks.push({ name: 'photo_source', passed: true, severity: 'warning', detail: `Photo source: ${report.photoSource} (editing detected)` });
    flags.push('edited_photo');
  } else if (report.photoSource === 'camera') {
    checks.push({ name: 'photo_source', passed: true, severity: 'info', detail: 'Photo taken with camera' });
  } else {
    checks.push({ name: 'photo_source', passed: true, severity: 'warning', detail: `Photo source: ${report.photoSource}` });
  }

  // 3. Freshness
  const maxAge = taskRequirement?.maxPhotoAgeMs || config.forensicMaxPhotoAgeMs;
  if (report.freshness.photoAgeMs !== null) {
    const fresh = report.freshness.photoAgeMs <= maxAge;
    checks.push({
      name: 'freshness',
      passed: fresh,
      severity: isPhysical ? 'critical' : 'warning',
      detail: fresh
        ? `Photo taken ${Math.round(report.freshness.photoAgeMs / 60000)} min ago`
        : `Photo is ${Math.round(report.freshness.photoAgeMs / 3600000)} hours old (max: ${Math.round(maxAge / 60000)} min)`,
    });
    if (!fresh) flags.push('stale_photo');
  } else {
    checks.push({
      name: 'freshness',
      passed: false,
      severity: isPhysical ? 'critical' : 'warning',
      detail: 'No timestamp in photo metadata',
    });
    flags.push('no_timestamp');
  }

  // 4. EXIF consistency
  const hasCamera = !!report.exif.make && !!report.exif.model;
  const hasEditor = report.tamperingSignals.includes('editing_software_detected');
  checks.push({
    name: 'exif_consistency',
    passed: !hasEditor,
    severity: 'warning',
    detail: hasCamera
      ? `Camera: ${report.exif.make} ${report.exif.model}${hasEditor ? ' (editing software detected)' : ''}`
      : 'No camera metadata in EXIF',
  });
  if (hasEditor) flags.push('editing_software');

  // 5. GPS proximity
  if (taskRequirement?.requireGps && taskRequirement.gpsCenter && taskRequirement.gpsRadiusMeters) {
    if (report.exif.gpsLat != null && report.exif.gpsLng != null) {
      const dist = haversineDistance(
        report.exif.gpsLat, report.exif.gpsLng,
        taskRequirement.gpsCenter.lat, taskRequirement.gpsCenter.lng
      );
      const withinRadius = dist <= taskRequirement.gpsRadiusMeters;
      checks.push({
        name: 'gps_proximity',
        passed: withinRadius,
        severity: 'critical',
        detail: `${Math.round(dist)}m from task location (max: ${taskRequirement.gpsRadiusMeters}m)`,
      });
      if (!withinRadius) flags.push('gps_out_of_range');
    } else {
      checks.push({ name: 'gps_proximity', passed: false, severity: 'critical', detail: 'No GPS data in photo' });
      flags.push('gps_missing');
    }
  }

  // 6. Phash duplicate
  const dupes = forensicStore.findPhashMatches(report.phash, config.forensicPhashThreshold);
  // Exclude self (same taskId)
  const realDupes = dupes.filter((d) => d.taskId !== report.taskId);
  if (realDupes.length > 0) {
    checks.push({
      name: 'phash_duplicate',
      passed: false,
      severity: 'critical',
      detail: `Photo matches ${realDupes.length} previous submission(s) (closest distance: ${realDupes[0].distance} bits)`,
    });
    flags.push('duplicate_photo');
  } else {
    checks.push({ name: 'phash_duplicate', passed: true, severity: 'info', detail: 'No duplicate photos found' });
  }

  // 7. Device consistency
  forensicStore.recordDeviceFingerprint(report.workerAddress, report.deviceFingerprint);
  const deviceCount = forensicStore.getDeviceCount(report.workerAddress);
  checks.push({
    name: 'device_consistency',
    passed: deviceCount <= 3,
    severity: 'warning',
    detail: `Worker has used ${deviceCount} device(s)`,
  });
  if (deviceCount > 3) flags.push('too_many_devices');

  // 8. Tampering signals
  const signalCount = report.tamperingSignals.length;
  checks.push({
    name: 'tampering_signals',
    passed: signalCount === 0,
    severity: signalCount >= 3 ? 'warning' : 'info',
    detail: signalCount === 0
      ? 'No tampering signals detected'
      : `${signalCount} signal(s): ${report.tamperingSignals.join(', ')}`,
  });
  if (signalCount > 0) flags.push(...report.tamperingSignals);

  // Score calculation
  const overallScore = computeScore(checks);
  const hasCriticalFailure = checks.some((c) => c.severity === 'critical' && !c.passed);
  const passed = overallScore >= 50 && !hasCriticalFailure;

  return { overallScore, passed, checks, flags };
}

function computeScore(checks: ForensicCheck[]): number {
  let totalWeight = 0;
  let earnedWeight = 0;
  for (const check of checks) {
    const weight = check.severity === 'critical' ? 3 : check.severity === 'warning' ? 1 : 0.5;
    totalWeight += weight;
    if (check.passed) earnedWeight += weight;
  }
  if (totalWeight === 0) return 100;
  return Math.round((earnedWeight / totalWeight) * 100);
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
