import { getDistanceMeters } from '../location';

describe('getDistanceMeters', () => {
  it('returns 0 for identical coordinates', () => {
    expect(getDistanceMeters(37.7749, -122.4194, 37.7749, -122.4194)).toBe(0);
  });

  it('returns approximately the correct distance between two known points', () => {
    // San Francisco (37.7749°N, 122.4194°W) to Los Angeles (34.0522°N, 118.2437°W)
    // Straight-line distance is approximately 559 km
    const distMeters = getDistanceMeters(37.7749, -122.4194, 34.0522, -118.2437);
    const distKm = distMeters / 1000;
    expect(distKm).toBeGreaterThan(540);
    expect(distKm).toBeLessThan(580);
  });

  it('returns approximately 111 km per degree of latitude', () => {
    // 1 degree of latitude ≈ 111,000 m
    const dist = getDistanceMeters(0, 0, 1, 0);
    expect(dist).toBeGreaterThan(110_000);
    expect(dist).toBeLessThan(112_000);
  });

  it('is symmetric — distance A→B equals distance B→A', () => {
    const d1 = getDistanceMeters(40.7128, -74.0060, 51.5074, -0.1278);
    const d2 = getDistanceMeters(51.5074, -0.1278, 40.7128, -74.0060);
    expect(d1).toBeCloseTo(d2, 0);
  });

  it('handles the North Pole to South Pole distance (~20,000 km)', () => {
    const dist = getDistanceMeters(90, 0, -90, 0);
    const distKm = dist / 1000;
    expect(distKm).toBeGreaterThan(19_900);
    expect(distKm).toBeLessThan(20_100);
  });

  it('handles very short distances (under 100 m)', () => {
    // About 0.001° latitude ≈ 111 m
    const dist = getDistanceMeters(37.7749, -122.4194, 37.7750, -122.4194);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(200);
  });

  it('handles coordinates that cross the prime meridian', () => {
    // Paris (48.8566°N, 2.3522°E) to Frankfurt (50.1109°N, 8.6821°E) ≈ 479 km
    const dist = getDistanceMeters(48.8566, 2.3522, 50.1109, 8.6821);
    const distKm = dist / 1000;
    expect(distKm).toBeGreaterThan(450);
    expect(distKm).toBeLessThan(510);
  });
});
