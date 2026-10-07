/**
 * Format helper for currency, percentage, and plain Indonesian timeframes
 */

export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp0';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(Math.abs(rounded));
  return rounded < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

export function parseRupiah(input: string): number {
  if (!input) return 0;
  // Remove non-numeric except digits
  const clean = input.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
}

/**
 * Memformat desimal (misal 0.03 = 3%) atau nilai persentase ke string format Indonesia.
 * Jika r <= 1 dan r >= -1, dianggap desimal dan dikali 100.
 */
export function formatPersen(r: number, digit: number = 1): string {
  if (isNaN(r) || r === null || r === undefined) return '0%';
  const val = Math.abs(r) <= 1 && r !== 0 ? r * 100 : r;
  return `${val.toFixed(digit).replace('.', ',')}%`;
}

// Alias formatPercent for backward compatibility with existing code
export const formatPercent = formatPersen;

export function formatTenor(angka: number, satuan: 'hari' | 'minggu' | 'bulan'): string {
  const s = satuan.toLowerCase();
  if (angka <= 1) {
    return `1 ${s}`;
  }
  return `${angka} ${s}`;
}
