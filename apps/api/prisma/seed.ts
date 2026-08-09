/**
 * Seed: super-admin user, core amenities, one demo project with a layout and plots.
 * Idempotent — safe to run repeatedly (upserts by unique keys).
 * Run: pnpm db:seed
 */
import { PrismaClient, PlotStatus, ProjectType, ProjectStatus, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // ── Super admin ──
  const passwordHash = await argon2.hash('ChangeMe@123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@spbuilders.com' },
    update: {},
    create: {
      email: 'admin@spbuilders.com',
      firstName: 'Super',
      lastName: 'Admin',
      role: UserRole.SUPER_ADMIN,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  // ── Amenities ──
  const amenityNames = [
    'Clubhouse',
    'Swimming Pool',
    'Gymnasium',
    'Landscaped Gardens',
    '24x7 Security',
    'Power Backup',
    'Kids Play Area',
    'Jogging Track',
  ];
  const amenities = await Promise.all(
    amenityNames.map((name) =>
      prisma.amenity.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  // ── Demo project ──
  const project = await prisma.project.upsert({
    where: { slug: 'sp-emerald-greens' },
    update: {},
    create: {
      slug: 'sp-emerald-greens',
      name: 'SP Emerald Greens',
      tagline: 'Premium plotted development amid 40 acres of green',
      description: 'A gated plotted community with world-class amenities and clear titles.',
      type: ProjectType.PLOTTED,
      status: ProjectStatus.ONGOING,
      priceStartFrom: 4_500_000,
      priceEndAt: 12_000_000,
      city: 'Bengaluru',
      state: 'Karnataka',
      latitude: 12.9716,
      longitude: 77.5946,
      isFeatured: true,
      isInvestment: true,
      isPublished: true,
      createdById: admin.id,
      managerId: admin.id,
      amenities: {
        create: amenities.map((a, i) => ({ amenityId: a.id, highlight: i < 3 })),
      },
    },
  });

  // ── Layout ──
  const layout = await prisma.layout.upsert({
    where: { id: `${project.id}-master` },
    update: {},
    create: {
      id: `${project.id}-master`,
      projectId: project.id,
      name: 'Master Layout — Phase 1',
      canvasWidth: 1920,
      canvasHeight: 1080,
      isPublished: true,
    },
  });

  // ── A 5×4 grid of demo plots with mixed statuses ──
  const statuses: PlotStatus[] = [
    PlotStatus.AVAILABLE,
    PlotStatus.RESERVED,
    PlotStatus.BOOKED,
    PlotStatus.SOLD,
    PlotStatus.BLOCKED,
  ];
  const cellW = 200;
  const cellH = 220;
  let n = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      n += 1;
      const x = 120 + col * cellW;
      const y = 100 + row * cellH;
      const plotNumber = `A-${String(n).padStart(3, '0')}`;
      await prisma.plot.upsert({
        where: { projectId_plotNumber: { projectId: project.id, plotNumber } },
        update: {},
        create: {
          projectId: project.id,
          layoutId: layout.id,
          plotNumber,
          block: 'A',
          area: 1200 + (n % 4) * 200,
          dimensions: '30x40',
          isCorner: col === 0 || col === 4,
          basePrice: 4_500_000 + (n % 5) * 500_000,
          status: statuses[n % statuses.length]!,
          polygon: [
            { x, y },
            { x: x + cellW - 20, y },
            { x: x + cellW - 20, y: y + cellH - 20 },
            { x, y: y + cellH - 20 },
          ],
          centroidX: x + (cellW - 20) / 2,
          centroidY: y + (cellH - 20) / 2,
        },
      });
    }
  }

  // ── Refresh denormalized rollups ──
  const grouped = await prisma.plot.groupBy({
    by: ['status'],
    where: { projectId: project.id, deletedAt: null },
    _count: true,
  });
  const count = (s: PlotStatus) => grouped.find((g) => g.status === s)?._count ?? 0;
  await prisma.project.update({
    where: { id: project.id },
    data: {
      totalPlots: grouped.reduce((sum, g) => sum + g._count, 0),
      availablePlots: count(PlotStatus.AVAILABLE),
      reservedPlots: count(PlotStatus.RESERVED),
      bookedPlots: count(PlotStatus.BOOKED),
      soldPlots: count(PlotStatus.SOLD),
      blockedPlots: count(PlotStatus.BLOCKED),
    },
  });

  console.log(`✅ Seeded admin, ${amenities.length} amenities, project "${project.name}" with ${n} plots.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
