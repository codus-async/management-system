import { auth } from "../src/lib/auth.js";
import { DEFAULT_USER_ROLE, type UserRole } from "../src/lib/constants.js";
import { prisma } from "../src/lib/prisma.js";

const paEmail = process.env["SEED_PA_EMAIL"] ?? "pa@example.com";
const ceoEmail = process.env["SEED_CEO_EMAIL"] ?? "ceo@example.com";
const password = process.env["SEED_PASSWORD"] ?? "local-dev-password";

const people: { role: UserRole; email: string; name: string }[] = [
  { role: "PA", email: paEmail, name: "Personal Assistant" },
  { role: "CEO", email: ceoEmail, name: "Chief Executive" },
];

async function ensureUser(person: (typeof people)[number]) {
  const byRole = await prisma.user.findFirst({ where: { role: person.role } });
  if (byRole) {
    console.log(`exists  ${person.role} ${byRole.email}`);
    return;
  }

  const byEmail = await prisma.user.findUnique({
    where: { email: person.email },
  });
  if (byEmail) {
    if (byEmail.role !== person.role) {
      await prisma.user.update({
        where: { id: byEmail.id },
        data: { role: person.role },
      });
      console.log(`repaired ${byEmail.email} role -> ${person.role}`);
    } else {
      console.log(`exists  ${person.role} ${byEmail.email}`);
    }
    return;
  }

  const created = await auth.api.signUpEmail({
    body: { email: person.email, name: person.name, password },
  });
  if (person.role !== DEFAULT_USER_ROLE) {
    await prisma.user.update({
      where: { id: created.user.id },
      data: { role: person.role },
    });
  }
  console.log(`created ${person.role} ${person.email}`);
}

async function seed() {
  for (const person of people) {
    await ensureUser(person);
  }

  console.log(`\nSign in as ${paEmail} or ${ceoEmail}`);
  console.log(`Password (SEED_PASSWORD): ${password}`);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
