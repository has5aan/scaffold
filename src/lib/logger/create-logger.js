const pino = require('pino')

function createLogger(name, knexConfig) {
  const transportTargets = process.env.PINO_TRANSPORT_TARGETS.split('|')
  const consoleTransport = transportTargets.includes('console')
  const fileTransport = transportTargets.includes('file')
  const sqliteTransport = transportTargets.includes('sqlite')
  const targets = []

  if (consoleTransport) {
    targets.push({
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'yyyy-mm-dd HH:MM:ss.l',
        ignore: 'pid,hostname',
        customColors: {
          trace: 'gray',
          debug: 'blue',
          info: 'green',
          warn: 'yellow',
          error: 'red',
          fatal: 'bgRed'
        },
        levelFirst: true,
        minimumLevel: 'trace'
      },
      level: 'trace'
    })
  }

  if (fileTransport) {
    targets.push({
      target: 'pino/file',
      options: {
        destination: `logs/${name}-${process.env.NODE_ENV || 'development'}.json`,
        mkdir: true,
        // Add log rotation
        rotate: {
          size: '3M', // rotate every 3 MegaBytes written
          interval: '1d' // rotate daily
        }
      },
      level: 'trace'
    })
  }

  if (sqliteTransport) {
    targets.push({
      target: require.resolve('./transports/pino-sqlite.js'),
      options: {
        knexConfig
      },
      level: 'trace'
    })
  }

  const pinoLogger = pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
    transport: {
      targets
    },
    // Add timestamp in ISO format
    timestamp: pino.stdTimeFunctions.isoTime,
    // Add application name
    name
  })

  return Object.freeze({
    trace: pinoLogger.trace.bind(pinoLogger),
    debug: pinoLogger.debug.bind(pinoLogger),
    info: pinoLogger.info.bind(pinoLogger),
    warn: pinoLogger.warn.bind(pinoLogger),
    error: pinoLogger.error.bind(pinoLogger),
    fatal: pinoLogger.fatal.bind(pinoLogger)
  })
}

module.exports = { createLogger }
