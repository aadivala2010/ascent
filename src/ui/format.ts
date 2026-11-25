export function formatNumber(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'N/A';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(value);
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return 'N/A';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `T+ ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${remainder.toFixed(1).padStart(4, '0')}`;
}

export function telemetryIndex(times: Float64Array, target: number): number {
  if (times.length === 0) return 0;
  let low = 0;
  let high = times.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2);
    if (times[middle] <= target) low = middle;
    else high = middle - 1;
  }
  return low;
}

export function downloadFile(filename: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
