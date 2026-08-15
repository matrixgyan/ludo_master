import { Worker, Job } from 'bullmq';
import { EmailJobData } from '../queueManager';
import { getRedisConfig } from '../../redis/client';
import { config, Logger } from '../../config/env';

export function createEmailWorker(): Worker<EmailJobData> {
  const worker = new Worker<EmailJobData>(
    'emailQueue',
    async (job: Job<EmailJobData>) => {
      Logger.info(`Processing email job ${job.id} to ${job.data.to} [${job.data.subject}]`);
      // Ready for SendGrid / AWS SES / Postmark
    },
    {
      connection: getRedisConfig(),
      prefix: config.BULLMQ_PREFIX,
      concurrency: 3,
    }
  );

  return worker;
}
