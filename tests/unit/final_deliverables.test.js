import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

describe('Final Deliverables Unit Tests (S3.6)', () => {
  it('README.md exists and contains app title, deployment link, and feature checklist', () => {
    const readmePath = path.resolve(process.cwd(), 'README.md');
    expect(fs.existsSync(readmePath)).toBe(true);
    const content = fs.readFileSync(readmePath, 'utf8');

    expect(content).toContain('# Budget Bistro');
    expect(content).toContain('https://budget-bistro.onrender.com');
    expect(content).toContain('Completed Feature Checklist');
    expect(content).toContain('Express Backend & React Frontend');
    expect(content).toContain('RESTful Dish CRUD API');
  });

  it('milestone5.md exists and contains milestone 5 reflection and rubric summary', () => {
    const milestonePath = path.resolve(process.cwd(), 'milestone5.md');
    expect(fs.existsSync(milestonePath)).toBe(true);
    const content = fs.readFileSync(milestonePath, 'utf8');

    expect(content).toContain('# Milestone 5 Final Project Report');
    expect(content).toContain('Live Application URL');
    expect(content).toContain('Completed Rubric Requirements');
    expect(content).toContain('Team Reflection');
  });

  it('docs/evidence directory contains evidence for all completed slices', () => {
    const evidenceDir = path.resolve(process.cwd(), 'docs/evidence');
    expect(fs.existsSync(evidenceDir)).toBe(true);
    const slices = ['S0.1', 'S1.1', 'S1.2', 'S1.3', 'S2.1', 'S2.2', 'S2.3', 'S2.4', 'S2.5', 'S2.6', 'S2.7', 'S3.1', 'S3.2', 'S3.3', 'S3.5'];
    for (const slice of slices) {
      const sliceDir = path.join(evidenceDir, slice);
      expect(fs.existsSync(sliceDir)).toBe(true);
    }
  });
});
