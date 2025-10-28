const redis = require('redis')

function createRedisClient() {
  const redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_HOST_PORT || 6379
    },
    password: process.env.REDIS_PASSWORD || undefined
  })

  redisClient.on('error', err => {
    console.error('Redis connection error:', err)
  })

  redisClient.on('connect', () => {
    console.log('Connected to Redis')
  })

  redisClient.on('ready', () => {
    console.log('Redis client ready')
  })

  return redisClient
}

async function connectRedisClient(redisClient) {
  try {
    await redisClient.connect()
    console.log('Connected to Redis')
  } catch (error) {
    console.error('Failed to connect to Redis:', error)
    process.exit(1)
  }
}

async function disconnectRedisClient(redisClient) {
  try {
    if (redisClient.isOpen) {
      await redisClient.quit()
    }
  } catch (error) {
    console.error('Failed to disconnect from Redis:', error)
  }
}

module.exports = {
  createRedisClient,
  connectRedisClient,
  disconnectRedisClient
}
