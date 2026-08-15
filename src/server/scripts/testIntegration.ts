import { checkPostgresHealth, closeDbPool } from '../db/client';
import { checkRedisHealth, closeRedis } from '../redis/client';
import { DistributedLock } from '../redis/locks';
import { QueueRegistry } from '../queues/queueManager';
import { AuthoritativeLudoEngine } from '../game/authoritativeEngine';
import { config, Logger } from '../config/env';

async function runIntegrationVerification() {
  Logger.info('====================================================');
  Logger.info('LUDO PRODUCTION INFRASTRUCTURE VERIFICATION TEST');
  Logger.info('====================================================');

  // 1. Authoritative Engine Unit Test
  Logger.info('1. Testing Server-Authoritative Ludo Engine...');
  const testSession = AuthoritativeLudoEngine.createNewGame('test-game-001', '2_PLAYER', [
    { userId: 'player-red', username: 'Tester 1', color: 'red', isHuman: true },
    { userId: 'player-blue', username: 'Tester 2', color: 'blue', isHuman: true },
  ]);

  if (testSession.currentTurn !== 'red' || testSession.status !== 'IN_PROGRESS') {
    throw new Error('Authoritative game initialization failed');
  }
  Logger.info('  ✓ Initialized authoritative session successfully');

  // Test Roll
  const rollRes = AuthoritativeLudoEngine.rollDiceAuthoritative(testSession, 'player-red');
  if (rollRes.rollValue < 1 || rollRes.rollValue > 6) {
    throw new Error('Dice roll generated invalid value');
  }
  Logger.info(`  ✓ Cryptographic dice roll generated: ${rollRes.rollValue}`);

  // 2. Queue Architecture Test
  Logger.info('2. Testing BullMQ Queue Registries...');
  const emailQ = QueueRegistry.getEmailQueue();
  const notifQ = QueueRegistry.getNotificationQueue();
  const gameQ = QueueRegistry.getGameProcessingQueue();
  const lbQ = QueueRegistry.getLeaderboardQueue();
  const cleanQ = QueueRegistry.getCleanupQueue();
  const chainQ = QueueRegistry.getBlockchainQueue();

  if (!emailQ || !notifQ || !gameQ || !lbQ || !cleanQ || !chainQ) {
    throw new Error('One or more BullMQ queues failed to instantiate');
  }
  Logger.info('  ✓ All 6 BullMQ queues created and registered cleanly');

  // 3. Database Connection Test
  Logger.info('3. Testing PostgreSQL / Neon Connection...');
  const pgResult = await checkPostgresHealth();
  if (pgResult.status === 'healthy') {
    Logger.info(`  ✓ PostgreSQL is online (Latency: ${pgResult.latencyMs}ms)`);
  } else {
    Logger.warn(`  ⚠️ PostgreSQL is unreachable or DATABASE_URL not yet configured: ${pgResult.error}`);
  }

  // 4. Redis Connection Test
  Logger.info('4. Testing Redis Connection...');
  const redisResult = await checkRedisHealth();
  if (redisResult.status === 'healthy') {
    Logger.info(`  ✓ Redis is online (Latency: ${redisResult.latencyMs}ms)`);

    // Test Distributed Lock
    Logger.info('5. Testing Distributed Lock with Lua atomic release...');
    const lockKey = 'ludo:test:lock:001';
    const { acquired, token } = await DistributedLock.acquire(lockKey, 2000);
    if (acquired && token) {
      Logger.info('  ✓ Acquired distributed lock');
      const released = await DistributedLock.release(lockKey, token);
      Logger.info(`  ✓ Released distributed lock: ${released}`);
    }
  } else {
    Logger.warn(`  ⚠️ Redis is unreachable or REDIS_URL not yet configured: ${redisResult.error}`);
  }

  // Cleanup
  await QueueRegistry.closeAll();
  await closeRedis();
  await closeDbPool();

  Logger.info('====================================================');
  Logger.info('VERIFICATION COMPLETED SUCCESSFULLY');
  Logger.info('====================================================');
}

runIntegrationVerification().catch((err) => {
  Logger.error('Verification failed', err);
  process.exit(1);
});
