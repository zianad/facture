// This is a simple worker example.
// It listens for messages and posts back a result.

self.onmessage = (event: MessageEvent) => {
  console.log('Worker received message:', event.data);
  const { task, payload } = event.data;

  if (task === 'solveSomething') {
    // Perform some heavy computation
    const result = `Result for ${payload}`;
    // Post the result back to the main thread
    self.postMessage({ task: 'solveResult', result });
  }
};

// To make TypeScript happy about 'self' and to allow module-based workers
export {};
