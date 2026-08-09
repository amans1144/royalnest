import { describe, expect, it } from 'vitest';
import { formatCurrency, slugify } from '../format';
import { polygonArea, polygonCentroid, pointInPolygon, resolvePlotColor } from '../geometry';
import { hasMinRole } from '../rbac';

describe('format', () => {
  it('renders Indian compact currency', () => {
    expect(formatCurrency(12_50_00_000)).toBe('₹12.5 Cr');
    expect(formatCurrency(45_00_000)).toBe('₹45 L');
    expect(formatCurrency(null)).toBe('—');
  });

  it('slugifies project names', () => {
    expect(slugify('Prestige Lakeside Habitat!')).toBe('prestige-lakeside-habitat');
  });
});

describe('geometry', () => {
  const square = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];

  it('computes polygon area', () => {
    expect(polygonArea(square)).toBe(100);
  });

  it('computes centroid', () => {
    const c = polygonCentroid(square);
    expect(c.x).toBeCloseTo(5);
    expect(c.y).toBeCloseTo(5);
  });

  it('detects point in polygon', () => {
    expect(pointInPolygon({ x: 5, y: 5 }, square)).toBe(true);
    expect(pointInPolygon({ x: 15, y: 5 }, square)).toBe(false);
  });

  it('resolves plot color with override precedence', () => {
    expect(resolvePlotColor('AVAILABLE')).toBe('#22c55e');
    expect(resolvePlotColor('SOLD', '#000000')).toBe('#000000');
  });
});

describe('rbac', () => {
  it('respects the staff role hierarchy', () => {
    expect(hasMinRole('SALES_MANAGER', 'EXECUTIVE')).toBe(true);
    expect(hasMinRole('VIEWER', 'EDITOR')).toBe(false);
    expect(hasMinRole('CUSTOMER', 'VIEWER')).toBe(false);
  });
});
