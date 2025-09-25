import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

const logger = pino({
  level,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'passwordHash'],
    remove: true,
  },
});

export default logger;
