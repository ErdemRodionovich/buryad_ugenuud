import { createContext, useState } from 'react';

export const IPCContext = createContext();

export function IPCProvider({ children }) {
  const workerSpecifier = '/workers/main.js'

  function send(message) {
    window.bridge.writeWorkerIPC(workerSpecifier, JSON.stringify(message))
  }

  return (
    <IPCContext.Provider value={{ workerSpecifier, send }}>
      {children}
    </IPCContext.Provider>
  );
}