import { getAdminAuth, getAdminDb } from './firebase-admin.mjs';

const SINGLE_ADMIN_EMAIL = 'admin@motorworldcorp.com';

const seedUsers = [
  {
    email: SINGLE_ADMIN_EMAIL,
    password: 'admin2026',
    displayName: 'Administrator',
    role: 'overseer',
  },
];

async function getOrCreateUser(auth, user) {
  try {
    return await auth.getUserByEmail(user.email);
  } catch (error) {
    if (error?.code !== 'auth/user-not-found') throw error;
    return auth.createUser({
      email: user.email,
      password: user.password,
      displayName: user.displayName,
    });
  }
}

async function main() {
  const auth = getAdminAuth();
  const db = getAdminDb();

  for (const user of seedUsers) {
    const record = await getOrCreateUser(auth, user);
    await auth.updateUser(record.uid, {
      displayName: user.displayName,
      password: user.password,
      email: user.email,
    });
    await auth.setCustomUserClaims(record.uid, {
      role: user.role,
      displayName: user.displayName,
      email: user.email,
    });
    await db.collection('users').doc(record.uid).set({
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      createdAt: new Date(record.metadata.creationTime || Date.now()).toISOString(),
    });
    console.log(`Seeded ${user.role}: ${user.email}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
