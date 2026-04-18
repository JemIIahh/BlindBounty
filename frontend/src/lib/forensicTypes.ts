// EXIF data extracted from JPEG
export interface ExifData {
  make?: string;
  model?: string;
  dateTime?: string;
  dateTimeOriginal?: string;
  gpsLat?: number;
  gpsLng?: number;
  software?: string;
  imageWidth?: number;
  imageHeight?: number;
}

export type PhotoSource = 'camera' | 'gallery' | 'screenshot' | 'edited' | 'unknown';

export interface DeviceFingerprint {
  screenWidth: number;
  screenHeight: number;
  hardwareConcurrency: number;
  deviceMemory: number | null; // navigator.deviceMemory may be undefined
  webglRenderer: string;
  userAgent: string;
  platform: string;
}

export interface FreshnessResult {
  photoAgeMs: number | null; // null if no EXIF timestamp
  submissionTimestamp: number;
  isFresh: boolean;
  maxAgeMs: number;
}

export interface ForensicReport {
  version: 1;
  taskId: string;
  workerAddress: string;
  timestamp: number;
  exif: ExifData;
  photoSource: PhotoSource;
  phash: string; // 16-char hex (64-bit average hash)
  deviceFingerprint: DeviceFingerprint;
  freshness: FreshnessResult;
  tamperingSignals: string[];
  reportHash: string; // SHA-256 of canonical JSON of above fields
}

export interface SignedForensicReport {
  report: ForensicReport;
  signature: string; // EIP-191 personal_sign of reportHash
}

export interface ForensicCheck {
  name: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
  detail: string;
}

export interface ForensicValidation {
  overallScore: number; // 0-100
  passed: boolean;
  checks: ForensicCheck[];
  flags: string[];
}

export type TaskForensicCategory = 'physical_presence' | 'location_based' | 'creative' | 'general';

export interface TaskForensicRequirement {
  requireFreshPhoto: boolean;
  maxPhotoAgeMs: number;
  requireGps: boolean;
  gpsCenter?: { lat: number; lng: number };
  gpsRadiusMeters?: number;
  requireCameraSource: boolean;
  category: TaskForensicCategory;
}
