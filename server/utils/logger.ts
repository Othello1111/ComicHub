import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOGGER_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: './logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({ filename: './logs/combined.log' }),
  ],
});

logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
    silent: process.env.NODE_ENV === 'test',
  })
);

export default logger;
