export {};

declare global {
  interface Window {
    __config: {
      baseUrl: string;
    };
  }
}