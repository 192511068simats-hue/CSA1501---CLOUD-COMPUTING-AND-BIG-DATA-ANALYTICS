/**
 * QR Service — QR code generation utilities
 */

export function getVerificationUrl(certificateId: string): string {
  // Use VITE_PUBLIC_APP_URL if defined, otherwise fallback to window.location.origin
  const baseUrl = import.meta.env.VITE_PUBLIC_APP_URL || window.location.origin;
  return `${baseUrl}/verify/${encodeURIComponent(certificateId)}`;
}

export function getCertificateQRValue(certificateId: string): string {
  return getVerificationUrl(certificateId);
}

export function parseQRCodePayload(payload: string): string | null {
  if (!payload) return null;
  
  // Try to parse as URL
  try {
    const url = new URL(payload);
    const pathParts = url.pathname.split('/').filter(Boolean);
    // Check if it matches /verify/CERT-ID
    const verifyIndex = pathParts.indexOf('verify');
    if (verifyIndex !== -1 && pathParts.length > verifyIndex + 1) {
      return decodeURIComponent(pathParts[verifyIndex + 1]);
    }
    
    // Check if it's using the old ?id= format just in case
    const idParam = url.searchParams.get('id');
    if (idParam) return idParam;
  } catch (e) {
    // Not a valid URL, fall through to check for raw ID
  }
  
  // If not a URL, check if it matches typical certificate ID pattern (e.g. CERT-...)
  if (payload.startsWith('CERT-')) {
    return payload.trim();
  }
  
  return null; // Invalid QR code payload
}
