export {};

declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      on?: (event: string, callback: (...args: any[]) => void) => void;
      removeListener?: (
        event: string,
        callback: (...args: unknown[]) => void
      ) => void;
    };
  }
}
