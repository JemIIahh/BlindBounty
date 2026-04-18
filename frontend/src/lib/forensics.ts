import { sha256 } from './crypto';
import type {
  ExifData,
  PhotoSource,
  DeviceFingerprint,
  FreshnessResult,
  ForensicReport,
} from './forensicTypes';

// ── EXIF Parsing ──

const EXIF_TAGS: Record<number, keyof ExifData> = {
  0x010f: 'make',
  0x0110: 'model',
  0x0132: 'dateTime',
  0x0131: 'software',
};

const EXIF_SUB_TAGS: Record<number, keyof ExifData> = {
  0x9003: 'dateTimeOriginal',
  0xa002: 'imageWidth',
  0xa003: 'imageHeight',
};

function readString(view: DataView, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const ch = view.getUint8(offset + i);
    if (ch === 0) break;
    str += String.fromCharCode(ch);
  }
  return str;
}

function readRational(view: DataView, offset: number, le: boolean): number {
  const num = view.getUint32(offset, le);
  const den = view.getUint32(offset + 4, le);
  return den === 0 ? 0 : num / den;
}

function readGpsCoord(view: DataView, offset: number, le: boolean): number {
  const deg = readRational(view, offset, le);
  const min = readRational(view, offset + 8, le);
  const sec = readRational(view, offset + 16, le);
  return deg + min / 60 + sec / 3600;
}

function readTagValue(
  view: DataView,
  tiffStart: number,
  entryOffset: number,
  le: boolean,
): string | number | null {
  const type = view.getUint16(entryOffset + 2, le);
  const count = view.getUint32(entryOffset + 4, le);
  const valueOffset = entryOffset + 8;

  // Type 2 = ASCII string
  if (type === 2) {
    const strOffset =
      count > 4 ? tiffStart + view.getUint32(valueOffset, le) : valueOffset;
    return readString(view, strOffset, count);
  }
  // Type 3 = SHORT (uint16)
  if (type === 3) {
    return view.getUint16(valueOffset, le);
  }
  // Type 4 = LONG (uint32)
  if (type === 4) {
    return view.getUint32(valueOffset, le);
  }

  return null;
}

function parseIFD(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  le: boolean,
  tags: Record<number, string>,
): Record<string, string | number | null> {
  const result: Record<string, string | number | null> = {};
  const entryCount = view.getUint16(ifdOffset, le);

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, le);
    const fieldName = tags[tag];
    if (fieldName) {
      result[fieldName] = readTagValue(view, tiffStart, entryOffset, le);
    }
  }
  return result;
}

function findSubIFDOffset(
  view: DataView,
  tiffStart: number,
  ifdOffset: number,
  le: boolean,
  targetTag: number,
): number | null {
  const entryCount = view.getUint16(ifdOffset, le);
  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, le);
    if (tag === targetTag) {
      return tiffStart + view.getUint32(entryOffset + 8, le);
    }
  }
  return null;
}

function parseGpsIFD(
  view: DataView,
  tiffStart: number,
  gpsOffset: number,
  le: boolean,
): { gpsLat?: number; gpsLng?: number } {
  const entryCount = view.getUint16(gpsOffset, le);
  let latRef = 'N';
  let lngRef = 'E';
  let lat: number | null = null;
  let lng: number | null = null;

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = gpsOffset + 2 + i * 12;
    if (entryOffset + 12 > view.byteLength) break;
    const tag = view.getUint16(entryOffset, le);
    const dataOffset = tiffStart + view.getUint32(entryOffset + 8, le);

    if (tag === 0x0001) {
      // GPSLatitudeRef
      latRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0002 && dataOffset + 24 <= view.byteLength) {
      // GPSLatitude
      lat = readGpsCoord(view, dataOffset, le);
    } else if (tag === 0x0003) {
      // GPSLongitudeRef
      lngRef = String.fromCharCode(view.getUint8(entryOffset + 8));
    } else if (tag === 0x0004 && dataOffset + 24 <= view.byteLength) {
      // GPSLongitude
      lng = readGpsCoord(view, dataOffset, le);
    }
  }

  const result: { gpsLat?: number; gpsLng?: number } = {};
  if (lat !== null) result.gpsLat = latRef === 'S' ? -lat : lat;
  if (lng !== null) result.gpsLng = lngRef === 'W' ? -lng : lng;
  return result;
}

export async function extractExif(file: File): Promise<ExifData> {
  const buffer = await file.arrayBuffer();
  const view = new DataView(buffer);
  const exif: ExifData = {};

  // Find APP1 marker (0xFFE1)
  if (view.byteLength < 4) return exif;
  // JPEG must start with SOI (0xFFD8)
  if (view.getUint16(0) !== 0xffd8) return exif;

  let offset = 2;
  while (offset + 4 < view.byteLength) {
    const marker = view.getUint16(offset);
    if (marker === 0xffe1) {
      // Found APP1
      const length = view.getUint16(offset + 2);
      const exifHeader = offset + 4;

      // Check "Exif\0\0"
      if (
        exifHeader + 6 > view.byteLength ||
        readString(view, exifHeader, 4) !== 'Exif' ||
        view.getUint8(exifHeader + 4) !== 0 ||
        view.getUint8(exifHeader + 5) !== 0
      ) {
        offset += 2 + length;
        continue;
      }

      const tiffStart = exifHeader + 6;
      if (tiffStart + 8 > view.byteLength) return exif;

      // Byte order
      const byteOrder = view.getUint16(tiffStart);
      const le = byteOrder === 0x4949; // 'II' = little-endian

      // IFD0 offset
      const ifd0Offset = tiffStart + view.getUint32(tiffStart + 4, le);
      if (ifd0Offset + 2 > view.byteLength) return exif;

      // Parse IFD0 for main tags
      const ifd0 = parseIFD(view, tiffStart, ifd0Offset, le, EXIF_TAGS as Record<number, string>);
      if (ifd0.make) exif.make = ifd0.make as string;
      if (ifd0.model) exif.model = ifd0.model as string;
      if (ifd0.dateTime) exif.dateTime = ifd0.dateTime as string;
      if (ifd0.software) exif.software = ifd0.software as string;

      // Find Exif sub-IFD (tag 0x8769)
      const subIFDOffset = findSubIFDOffset(view, tiffStart, ifd0Offset, le, 0x8769);
      if (subIFDOffset !== null && subIFDOffset + 2 <= view.byteLength) {
        const subIFD = parseIFD(
          view,
          tiffStart,
          subIFDOffset,
          le,
          EXIF_SUB_TAGS as Record<number, string>,
        );
        if (subIFD.dateTimeOriginal)
          exif.dateTimeOriginal = subIFD.dateTimeOriginal as string;
        if (subIFD.imageWidth) exif.imageWidth = subIFD.imageWidth as number;
        if (subIFD.imageHeight) exif.imageHeight = subIFD.imageHeight as number;
      }

      // Find GPS IFD (tag 0x8825)
      const gpsIFDOffset = findSubIFDOffset(view, tiffStart, ifd0Offset, le, 0x8825);
      if (gpsIFDOffset !== null && gpsIFDOffset + 2 <= view.byteLength) {
        const gps = parseGpsIFD(view, tiffStart, gpsIFDOffset, le);
        if (gps.gpsLat !== undefined) exif.gpsLat = gps.gpsLat;
        if (gps.gpsLng !== undefined) exif.gpsLng = gps.gpsLng;
      }

      return exif;
    }

    // Not APP1 — skip this marker segment
    if ((marker & 0xff00) !== 0xff00) break;
    const segLength = view.getUint16(offset + 2);
    offset += 2 + segLength;
  }

  return exif;
}

// ── Photo Source Classification ──

const SCREENSHOT_DIMENSIONS = new Set([
  '1170x2532',
  '1284x2778',
  '1080x2400',
  '1440x3200',
  '1080x1920',
  '1125x2436',
  '1242x2688',
  '750x1334',
  '828x1792',
  '1290x2796',
  '1179x2556',
  // landscape variants
  '2532x1170',
  '2778x1284',
  '2400x1080',
  '3200x1440',
  '1920x1080',
  '2436x1125',
  '2688x1242',
  '1334x750',
  '1792x828',
  '2796x1290',
  '2556x1179',
]);

const EDITOR_PATTERNS = [
  'photoshop',
  'gimp',
  'snapseed',
  'lightroom',
  'vsco',
  'picsart',
  'canva',
];

export function classifyPhotoSource(exif: ExifData, _file: File): PhotoSource {
  // Check for editing software
  if (exif.software) {
    const sw = exif.software.toLowerCase();
    if (EDITOR_PATTERNS.some((p) => sw.includes(p))) {
      return 'edited';
    }
  }

  // Camera: has Make AND Model AND DateTimeOriginal
  if (exif.make && exif.model && exif.dateTimeOriginal) {
    return 'camera';
  }

  // Screenshot: dimensions match phone screens AND no Make
  if (exif.imageWidth && exif.imageHeight && !exif.make) {
    const key = `${exif.imageWidth}x${exif.imageHeight}`;
    if (SCREENSHOT_DIMENSIONS.has(key)) {
      return 'screenshot';
    }
  }

  // Gallery: has some EXIF but no DateTimeOriginal
  const hasAnyExif = exif.make || exif.model || exif.dateTime || exif.software;
  if (hasAnyExif && !exif.dateTimeOriginal) {
    return 'gallery';
  }

  return 'unknown';
}

// ── Perceptual Hash ──

export async function computePhash(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(8, 8);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0, 8, 8);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, 8, 8);
  const pixels = imageData.data;

  // Convert to grayscale
  const gray = new Float64Array(64);
  for (let i = 0; i < 64; i++) {
    const off = i * 4;
    gray[i] = 0.299 * pixels[off] + 0.587 * pixels[off + 1] + 0.114 * pixels[off + 2];
  }

  // Compute mean
  let sum = 0;
  for (let i = 0; i < 64; i++) sum += gray[i];
  const mean = sum / 64;

  // Build hash: each pixel > mean = bit 1
  const bytes = new Uint8Array(8);
  for (let i = 0; i < 64; i++) {
    if (gray[i] > mean) {
      bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
  }

  // Convert to 16-char hex string
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ── Device Fingerprint ──

export function getDeviceFingerprint(): DeviceFingerprint {
  let webglRenderer = 'unknown';
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const gl = canvas.getContext('webgl');
    if (gl) {
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      if (ext) {
        webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || 'unknown';
      }
    }
  } catch {
    // WebGL not available
  }

  return {
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: ((navigator as unknown as Record<string, unknown>).deviceMemory as number | undefined) ?? null,
    webglRenderer,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
  };
}

// ── Freshness Check ──

function parseExifDateTime(dt: string): Date | null {
  // Format: "YYYY:MM:DD HH:MM:SS"
  const match = dt.match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, year, month, day, hour, min, sec] = match;
  return new Date(
    parseInt(year),
    parseInt(month) - 1,
    parseInt(day),
    parseInt(hour),
    parseInt(min),
    parseInt(sec),
  );
}

export function checkFreshness(exif: ExifData, maxAgeMs: number): FreshnessResult {
  const submissionTimestamp = Date.now();
  let photoAgeMs: number | null = null;
  let isFresh = false;

  if (exif.dateTimeOriginal) {
    const parsed = parseExifDateTime(exif.dateTimeOriginal);
    if (parsed) {
      photoAgeMs = submissionTimestamp - parsed.getTime();
      isFresh = photoAgeMs <= maxAgeMs;
    }
  }

  return { photoAgeMs, submissionTimestamp, isFresh, maxAgeMs };
}

// ── Tampering Detection ──

export function detectTamperingSignals(exif: ExifData, _file: File): string[] {
  const signals: string[] = [];

  // Editing software detected
  if (exif.software) {
    const sw = exif.software.toLowerCase();
    if (EDITOR_PATTERNS.some((p) => sw.includes(p))) {
      signals.push('editing_software_detected');
    }
  }

  // Screenshot dimensions
  if (exif.imageWidth && exif.imageHeight) {
    const key = `${exif.imageWidth}x${exif.imageHeight}`;
    if (SCREENSHOT_DIMENSIONS.has(key)) {
      signals.push('screenshot_dimensions');
    }
  }

  // No camera metadata
  if (!exif.make && !exif.model) {
    signals.push('no_camera_metadata');
  }

  // EXIF stripped
  const hasAny =
    exif.make ||
    exif.model ||
    exif.dateTime ||
    exif.dateTimeOriginal ||
    exif.software ||
    exif.imageWidth ||
    exif.imageHeight ||
    exif.gpsLat !== undefined ||
    exif.gpsLng !== undefined;
  if (!hasAny) {
    signals.push('exif_stripped');
  }

  // Timestamp missing
  if (!exif.dateTimeOriginal && !exif.dateTime) {
    signals.push('timestamp_missing');
  }

  return signals;
}

// ── Build Full Report ──

const DEFAULT_MAX_AGE_MS = 30 * 60 * 1000; // 30 minutes

export async function buildForensicReport(
  file: File,
  taskId: string,
  workerAddress: string,
  maxAgeMs: number = DEFAULT_MAX_AGE_MS,
): Promise<ForensicReport> {
  const exif = await extractExif(file);
  const photoSource = classifyPhotoSource(exif, file);
  const phash = await computePhash(file);
  const deviceFingerprint = getDeviceFingerprint();
  const freshness = checkFreshness(exif, maxAgeMs);
  const tamperingSignals = detectTamperingSignals(exif, file);
  const timestamp = Date.now();

  // Build the payload for hashing (all fields except reportHash)
  const hashPayload = {
    version: 1 as const,
    taskId,
    workerAddress,
    timestamp,
    exif,
    photoSource,
    phash,
    deviceFingerprint,
    freshness,
    tamperingSignals,
  };

  const jsonBytes = new TextEncoder().encode(JSON.stringify(hashPayload));
  const reportHash = await sha256(jsonBytes);

  return {
    ...hashPayload,
    reportHash,
  };
}
