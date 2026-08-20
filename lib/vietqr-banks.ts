/**
 * Static list of major Vietnamese banks and their VietQR short codes (mục
 * 9.12 — plan allows "nhúng file JSON tĩnh" instead of calling
 * api.vietqr.io/v2/banks live). `code` is what `buildVietQrUrl()`
 * (lib/vietqr.ts) puts in the `img.vietqr.io/image/{code}-{account}-...`
 * URL.
 */
export interface VietQrBank {
  code: string;
  name: string;
}

export const VIETQR_BANKS: VietQrBank[] = [
  { code: "VCB", name: "Vietcombank" },
  { code: "ICB", name: "VietinBank" },
  { code: "BIDV", name: "BIDV" },
  { code: "VBA", name: "Agribank" },
  { code: "TCB", name: "Techcombank" },
  { code: "MB", name: "MB Bank" },
  { code: "ACB", name: "ACB" },
  { code: "VPB", name: "VPBank" },
  { code: "STB", name: "Sacombank" },
  { code: "TPB", name: "TPBank" },
  { code: "HDB", name: "HDBank" },
  { code: "SHB", name: "SHB" },
  { code: "VIB", name: "VIB" },
  { code: "MSB", name: "MSB" },
  { code: "OCB", name: "OCB" },
  { code: "SEAB", name: "SeABank" },
  { code: "EIB", name: "Eximbank" },
  { code: "NAB", name: "Nam A Bank" },
  { code: "BAB", name: "Bac A Bank" },
  { code: "PVCB", name: "PVcomBank" },
];
