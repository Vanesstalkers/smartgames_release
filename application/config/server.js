({
  host: '0.0.0.0',
  balancer: 8880, // TO_CHANGE
  protocol: 'http',
  ports: [8881, 8882, 8883, 8884], // TO_CHANGE
  nagle: false,
  timeouts: {
    bind: 2000,
    start: 30000,
    stop: 5000,
    request: 5000,
    watch: 1000,
  },
  queue: {
    concurrency: 1000,
    size: 2000,
    timeout: 3000,
  },
  scheduler: {
    concurrency: 10,
    size: 2000,
    timeout: 3000,
  },
  workers: {
    pool: 2,
    wait: 2000,
    timeout: 5000,
  },
  cors: {
    origin: '*',
  },
});
