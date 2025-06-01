import { Queue, Worker } from "bullmq"
import { getRedisClient } from "./redis"
import { logger } from "../utils/logger"
import { executeCommandJob } from "../workers/commandWorker"

export let commandQueue: Queue

export const setupQueues = async (): Promise<void> => {
  try {
    const connection = getRedisClient()

    // Command execution queue
    commandQueue = new Queue("command-execution", { connection })

    // Command worker
    new Worker("command-execution", executeCommandJob, {
      connection,
      concurrency: 5,
      removeOnComplete: 100,
      removeOnFail: 50,
    })

    logger.info("✅ Queues and workers initialized")
  } catch (error) {
    logger.error("Failed to setup queues:", error)
    throw error
  }
}
