/**
 * ThreatMarkers component
 *
 * Previously displayed hardcoded fake threat markers (e.g. "01-HAVA - BİLİNMEYEN").
 * Now renders nothing — threat markers should only come from real backend data
 * (AI analyses with CRITICAL/HIGH threat levels) when that integration is built.
 */

interface ThreatMarkersProps {
  center?: [number, number];
}

export function ThreatMarkers({ center: _center }: ThreatMarkersProps) {
  // No fake threats — only render real threats from backend when available
  return null;
}
