import { createContext, useState } from 'react';

export const IPCContext = createContext();

export function IPCProvider({ children }) {
  const workerSpecifier = '/workers/main.js'
  const [notice, setNotice] = useState('')

  function send(message) {
    window.bridge.writeWorkerIPC(workerSpecifier, JSON.stringify(message))
  }

  function request(message) {
    setNotice('')
    send(message)
  }

  return (
    <IPCContext.Provider value={{ workerSpecifier, send, request, notice, setNotice }}>
      {children}
    </IPCContext.Provider>
  );
}