/** muc 8.7: sinh URL anh QR VietQR tu thong tin ngan hang trong setting. */
export function buildVietQrUrl({
  bankCode,
  accountNumber,
  accountName,
  amount,
  addInfo,
}: {
  bankCode: string;
  accountNumber: string;
  accountName: string;
  amount: number;
  addInfo: string;
}): string {
  const params = new URLSearchParams({
    amount: String(amount),
    addInfo,
    accountName,
  });
  return `https://img.vietqr.io/image/${bankCode}-${accountNumber}-compact2.png?${params.toString()}`;
}
