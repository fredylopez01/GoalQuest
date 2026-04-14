db = db.getSiblingDB('challenge_db');

db.createUser({
  user: 'challenge_user',
  pwd: 'challenge_pass',
  roles: [
    {
      role: 'readWrite',
      db: 'challenge_db',
    },
  ],
});

// Crear colecciones
db.createCollection('challenges');
db.createCollection('challenge_progress');

// Índices para challenges
db.challenges.createIndex({ challengerId: 1, state: 1 });
db.challenges.createIndex({ opponentId: 1, state: 1 });
db.challenges.createIndex({ state: 1, endDate: 1 });
db.challenges.createIndex(
  { challengerId: 1, opponentId: 1, state: 1 },
  { name: 'active_challenge_pair' },
);

// Índices para challenge_progress
db.challenge_progress.createIndex(
  { challengeId: 1, userId: 1 },
  { unique: true },
);
db.challenge_progress.createIndex({ userId: 1 });

print('=== Challenge DB initialized successfully ===');
