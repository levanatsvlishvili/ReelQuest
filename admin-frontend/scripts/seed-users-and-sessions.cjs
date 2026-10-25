const { DynamoDBClient, BatchWriteItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({ region: 'eu-central-1' });

const tables = ['reelquest-dev-data', 'reelquest-prod-data'];

const items = [
  // User Profile: lnats17
  {
    PK: { S: 'USER#43e44822-8091-70b3-99a7-da6d11a2adb7' },
    SK: { S: 'PROFILE' },
    Type: { S: 'USER_PROFILE' },
    userId: { S: '43e44822-8091-70b3-99a7-da6d11a2adb7' },
    email: { S: 'lnats17@freeuni.edu.ge' },
    username: { S: 'lnats17' },
    role: { S: 'PLAYER' },
    tier: { S: 'FREE' },
    status: { S: 'ACTIVE' },
    streak: { N: '3' },
    longestStreak: { N: '5' },
    gamesPlayed: { N: '6' },
    gamesWon: { N: '5' },
    duelsWon: { N: '2' },
    totalScore: { N: '14280' },
    lastCompletedDate: { S: '2026-10-25' },
    createdAt: { S: '2026-10-24T22:48:33.628Z' },
    updatedAt: { S: '2026-10-25T18:30:00.000Z' }
  },
  // User Profile: levani28100@gmail.com (wero)
  {
    PK: { S: 'USER#13645812-9091-70c8-df52-6ae5890c4c7a' },
    SK: { S: 'PROFILE' },
    Type: { S: 'USER_PROFILE' },
    userId: { S: '13645812-9091-70c8-df52-6ae5890c4c7a' },
    email: { S: 'levani28100@gmail.com' },
    username: { S: 'wero' },
    role: { S: 'ADMINISTRATOR' },
    tier: { S: 'PRO' },
    status: { S: 'ACTIVE' },
    streak: { N: '7' },
    longestStreak: { N: '12' },
    gamesPlayed: { N: '15' },
    gamesWon: { N: '14' },
    duelsWon: { N: '5' },
    totalScore: { N: '48920' },
    lastCompletedDate: { S: '2026-10-25' },
    createdAt: { S: '2026-10-14T01:24:28.635Z' },
    updatedAt: { S: '2026-10-25T19:00:00.000Z' }
  },
  // User Profile: cinephile_test@reelquest.io
  {
    PK: { S: 'USER#439448a2-c0a1-707b-dbba-72594677657c' },
    SK: { S: 'PROFILE' },
    Type: { S: 'USER_PROFILE' },
    userId: { S: '439448a2-c0a1-707b-dbba-72594677657c' },
    email: { S: 'cinephile_test@reelquest.io' },
    username: { S: 'cinephile_test' },
    role: { S: 'PLAYER' },
    tier: { S: 'FREE' },
    status: { S: 'ACTIVE' },
    streak: { N: '1' },
    longestStreak: { N: '2' },
    gamesPlayed: { N: '2' },
    gamesWon: { N: '1' },
    duelsWon: { N: '0' },
    totalScore: { N: '2850' },
    createdAt: { S: '2026-10-14T01:02:09.715Z' },
    updatedAt: { S: '2026-10-24T12:00:00.000Z' }
  },
  // Admin User Registry
  {
    PK: { S: 'ADMIN#USERS' },
    SK: { S: 'REGISTRY' },
    Type: { S: 'ADMIN_REGISTRY' },
    userIds: {
      SS: [
        '43e44822-8091-70b3-99a7-da6d11a2adb7',
        '13645812-9091-70c8-df52-6ae5890c4c7a',
        '439448a2-c0a1-707b-dbba-72594677657c'
      ]
    },
    updatedAt: { S: '2026-10-25T19:00:00.000Z' }
  },
  // Game Sessions - lnats17 Session 1
  {
    PK: { S: 'USER#43e44822-8091-70b3-99a7-da6d11a2adb7' },
    SK: { S: 'SESSION#2026-10-25#sess-lnats17-001' },
    GSI1PK: { S: 'GAME#2026-10-25' },
    GSI1SK: { S: 'SCORE#003150' },
    Type: { S: 'SESSION' },
    userId: { S: '43e44822-8091-70b3-99a7-da6d11a2adb7' },
    username: { S: 'lnats17' },
    gameMode: { S: 'six-degrees' },
    score: { N: '3150' },
    moves: { N: '3' },
    durationSeconds: { N: '42' },
    startActorId: { S: '6384' },
    startActorName: { S: 'Keanu Reeves' },
    targetActorId: { S: '1892' },
    targetActorName: { S: 'Matt Damon' },
    createdAt: { S: '2026-10-25T18:22:15.000Z' }
  },
  // Game Sessions - lnats17 Session 2
  {
    PK: { S: 'USER#43e44822-8091-70b3-99a7-da6d11a2adb7' },
    SK: { S: 'SESSION#2026-10-24#sess-lnats17-002' },
    GSI1PK: { S: 'GAME#2026-10-24' },
    GSI1SK: { S: 'SCORE#002980' },
    Type: { S: 'SESSION' },
    userId: { S: '43e44822-8091-70b3-99a7-da6d11a2adb7' },
    username: { S: 'lnats17' },
    gameMode: { S: 'six-degrees' },
    score: { N: '2980' },
    moves: { N: '4' },
    durationSeconds: { N: '58' },
    startActorId: { S: '31' },
    startActorName: { S: 'Tom Hanks' },
    targetActorId: { S: '1158' },
    targetActorName: { S: 'Al Pacino' },
    createdAt: { S: '2026-10-24T21:10:00.000Z' }
  },
  // Game Sessions - lnats17 Duel Match
  {
    PK: { S: 'USER#43e44822-8091-70b3-99a7-da6d11a2adb7' },
    SK: { S: 'SESSION#2026-10-25#duel-001-lnats17' },
    GSI1PK: { S: 'GAME#2026-10-25' },
    GSI1SK: { S: 'SCORE#003100' },
    Type: { S: 'SESSION' },
    userId: { S: '43e44822-8091-70b3-99a7-da6d11a2adb7' },
    username: { S: 'lnats17' },
    gameMode: { S: 'duel' },
    score: { N: '3100' },
    moves: { N: '4' },
    durationSeconds: { N: '38' },
    startActorId: { S: '31' },
    startActorName: { S: 'Tom Hanks' },
    targetActorId: { S: '287' },
    targetActorName: { S: 'Brad Pitt' },
    opponentUsername: { S: 'wero' },
    opponentScore: { N: '3600' },
    duelResult: { S: 'LOST' },
    createdAt: { S: '2026-10-25T19:40:00.000Z' }
  },
  // Game Sessions - wero Session 1
  {
    PK: { S: 'USER#13645812-9091-70c8-df52-6ae5890c4c7a' },
    SK: { S: 'SESSION#2026-10-25#sess-wero-001' },
    GSI1PK: { S: 'GAME#2026-10-25' },
    GSI1SK: { S: 'SCORE#003890' },
    Type: { S: 'SESSION' },
    userId: { S: '13645812-9091-70c8-df52-6ae5890c4c7a' },
    username: { S: 'wero' },
    gameMode: { S: 'six-degrees' },
    score: { N: '3890' },
    moves: { N: '2' },
    durationSeconds: { N: '18' },
    startActorId: { S: '6384' },
    startActorName: { S: 'Keanu Reeves' },
    targetActorId: { S: '1892' },
    targetActorName: { S: 'Matt Damon' },
    createdAt: { S: '2026-10-25T19:05:30.000Z' }
  },
  // Game Sessions - wero Session 2
  {
    PK: { S: 'USER#13645812-9091-70c8-df52-6ae5890c4c7a' },
    SK: { S: 'SESSION#2026-10-24#sess-wero-002' },
    GSI1PK: { S: 'GAME#2026-10-24' },
    GSI1SK: { S: 'SCORE#003450' },
    Type: { S: 'SESSION' },
    userId: { S: '13645812-9091-70c8-df52-6ae5890c4c7a' },
    username: { S: 'wero' },
    gameMode: { S: 'six-degrees' },
    score: { N: '3450' },
    moves: { N: '3' },
    durationSeconds: { N: '31' },
    startActorId: { S: '287' },
    startActorName: { S: 'Brad Pitt' },
    targetActorId: { S: '192' },
    targetActorName: { S: 'Morgan Freeman' },
    createdAt: { S: '2026-10-24T20:15:10.000Z' }
  },
  // Game Sessions - wero Duel Match
  {
    PK: { S: 'USER#13645812-9091-70c8-df52-6ae5890c4c7a' },
    SK: { S: 'SESSION#2026-10-25#duel-001-wero' },
    GSI1PK: { S: 'GAME#2026-10-25' },
    GSI1SK: { S: 'SCORE#003600' },
    Type: { S: 'SESSION' },
    userId: { S: '13645812-9091-70c8-df52-6ae5890c4c7a' },
    username: { S: 'wero' },
    gameMode: { S: 'duel' },
    score: { N: '3600' },
    moves: { N: '3' },
    durationSeconds: { N: '25' },
    startActorId: { S: '31' },
    startActorName: { S: 'Tom Hanks' },
    targetActorId: { S: '287' },
    targetActorName: { S: 'Brad Pitt' },
    opponentUsername: { S: 'lnats17' },
    opponentScore: { N: '3100' },
    duelResult: { S: 'WON' },
    createdAt: { S: '2026-10-25T19:40:00.000Z' }
  },
  // Real Leaderboard Entries for Today (2026-10-25)
  {
    PK: { S: 'LEADERBOARD#2026-10-25' },
    SK: { S: 'USER#13645812-9091-70c8-df52-6ae5890c4c7a' },
    GSI1PK: { S: 'LEADERBOARD#2026-10-25' },
    GSI1SK: { S: 'SCORE#99996110' },
    Type: { S: 'LEADERBOARD_ENTRY' },
    userId: { S: '13645812-9091-70c8-df52-6ae5890c4c7a' },
    username: { S: 'wero' },
    score: { N: '3890' },
    moves: { N: '2' },
    durationSeconds: { N: '18' },
    isPro: { BOOL: true },
    updatedAt: { S: '2026-10-25T19:05:30.000Z' }
  },
  {
    PK: { S: 'LEADERBOARD#2026-10-25' },
    SK: { S: 'USER#43e44822-8091-70b3-99a7-da6d11a2adb7' },
    GSI1PK: { S: 'LEADERBOARD#2026-10-25' },
    GSI1SK: { S: 'SCORE#99996850' },
    Type: { S: 'LEADERBOARD_ENTRY' },
    userId: { S: '43e44822-8091-70b3-99a7-da6d11a2adb7' },
    username: { S: 'lnats17' },
    score: { N: '3150' },
    moves: { N: '3' },
    durationSeconds: { N: '42' },
    isPro: { BOOL: false },
    updatedAt: { S: '2026-10-25T18:22:15.000Z' }
  }
];

async function seed() {
  for (const table of tables) {
    console.log(`Seeding real users and sessions into ${table}...`);
    for (const item of items) {
      try {
        await client.send(new PutItemCommand({
          TableName: table,
          Item: item
        }));
      } catch (e) {
        console.error(`Failed to put item into ${table}:`, e.message);
      }
    }
    console.log(`Successfully seeded ${items.length} items into ${table}`);
  }
}

seed().catch(err => console.error('Seed error:', err));
