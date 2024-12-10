export const calculateMemoryUsage = (before: NodeJS.MemoryUsage, after: NodeJS.MemoryUsage) => ({
  rss: `${((after.rss - before.rss) / 1024 / 1024).toFixed(2)} MB`,
  heapTotal: `${((after.heapTotal - before.heapTotal) / 1024 / 1024).toFixed(2)} MB`,
  heapUsed: `${((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2)} MB`,
  external: `${((after.external - before.external) / 1024 / 1024).toFixed(2)} MB`,
});
