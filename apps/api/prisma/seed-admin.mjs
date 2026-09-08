/**
 * Seed or update a single admin user.
 *
 * Deliberately separate from seed.ts: that one is demo data (a sample project,
 * plots, amenities) and ships a hardcoded `ChangeMe@123` super admin, which
 * must never reach a public server. This script takes the credentials from the
 * environment, refuses obviously weak ones, and touches nothing else.
 *
 * Plain .mjs rather than TypeScript so it runs with bare `node` inside the
 * production image, with no transpiler in the loop.
 *
 * Usage (through the deploy menu):   bash deploy.sh -> 7) Seed admin user
 * Directly:
 *   docker compose -f docker-compose.prod.yml exec \
 *     -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='...' \
 *     api node prisma/seed-admin.mjs
 *
 * Env:
 *   ADMIN_EMAIL       required
 *   ADMIN_PASSWORD    required on create; omit to update an existing user
 *                     without changing their password
 *   ADMIN_FIRST_NAME  default "Site"
 *   ADMIN_LAST_NAME   default "Admin"
 *   ADMIN_ROLE        default SUPER_ADMIN
 *   ADMIN_LIST=1      list existing staff users and exit
 */
import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const STAFF_ROLES = ['SUPER_ADMIN', 'SALES_MANAGER', 'EXECUTIVE', 'EDITOR'];

/** Passwords that would make the account worthless. */
const FORBIDDEN = [
  'changeme@123', 'change-me', 'password', 'admin', 'admin123',
  'royalnest', 'spbuilders', '12345678', 'qwerty',
];

function fail(msg) {
  console.error(`\n  ERROR: ${msg}\n`);
  process.exitCode = 1;
  return null;
}

function validatePassword(pw) {
  if (pw.length < 12) return 'password must be at least 12 characters';
  if (FORBIDDEN.some((f) => pw.toLowerCase().includes(f)))
    return 'password contains a well-known default — pick something else';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/[0-9]/.test(pw))
    return 'password needs at least one lowercase, one uppercase and one digit';
  return null;
}

async function list() {
  const users = await prisma.user.findMany({
    where: { role: { in: STAFF_ROLES } },
    select: { email: true, role: true, status: true, firstName: true, lastName: true, lastLoginAt: true },
    orderBy: { email: 'asc' },
  });
  if (users.length === 0) {
    console.log('\n  No staff users exist yet.\n');
    return;
  }
  console.log(`\n  ${users.length} staff user(s):\n`);
  for (const u of users) {
    const seen = u.lastLoginAt ? u.lastLoginAt.toISOString().slice(0, 10) : 'never';
    console.log(`    ${u.email.padEnd(34)} ${u.role.padEnd(14)} ${u.status.padEnd(9)} last login: ${seen}`);
  }
  console.log('');
}

async function main() {
  if (process.env.ADMIN_LIST === '1') return list();

  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';
  const firstName = (process.env.ADMIN_FIRST_NAME ?? 'Site').trim();
  const lastName = (process.env.ADMIN_LAST_NAME ?? 'Admin').trim();
  const role = (process.env.ADMIN_ROLE ?? 'SUPER_ADMIN').trim().toUpperCase();

  if (!email) return fail('ADMIN_EMAIL is required.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fail(`"${email}" is not a valid email address.`);
  if (!STAFF_ROLES.includes(role))
    return fail(`ADMIN_ROLE must be one of: ${STAFF_ROLES.join(', ')} (got "${role}").`);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (!existing && !password) return fail('ADMIN_PASSWORD is required when creating a new user.');
  if (password) {
    const problem = validatePassword(password);
    if (problem) return fail(problem);
  }

  const data = { firstName, lastName, role: UserRole[role], status: UserStatus.ACTIVE };
  if (password) data.passwordHash = await argon2.hash(password);

  if (existing) {
    await prisma.user.update({ where: { email }, data });
    console.log(`\n  Updated ${email} (${role})${password ? ' — password changed' : ' — password unchanged'}.\n`);
  } else {
    await prisma.user.create({
      data: { email, ...data, emailVerifiedAt: new Date() },
    });
    console.log(`\n  Created ${email} (${role}).\n`);
  }
}

main()
  .catch((e) => {
    // A missing table is the common first-run case; say so plainly.
    if (e?.code === 'P2021' || /does not exist/i.test(e?.message ?? '')) {
      console.error('\n  ERROR: the database schema is not set up yet.');
      console.error('  Run the migrations first:  deploy.sh -> 7) b) Run migrations\n');
    } else {
      console.error(e);
    }
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
