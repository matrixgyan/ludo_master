import { Worker, Job } from 'bullmq';
import { NotificationJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { config, Logger } from '../../config/env';

export function createNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    'notificationQueue',
    async (job: Job<NotificationJobData>) => {
      Logger.info(`Processing notification job ${job.id} for user ${job.data.recipientUserId}`);
      // Real notification dispatcher stub (push/web notification)
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: 5,
    }
  );

  return worker;
}
