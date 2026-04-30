export function withTimeout(promise, ms = 60000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Upload timeout exceeded")), ms)
    ),
  ]);
}