import { createContext, useState, useContext, useRef } from 'react';
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

export const PollContext = createContext();

export function PollProvider({ children }) {
  const [polls, setPolls] = useState([]);
  const [selectedPollId, setSelectedPollId] = useState(null)
  const refreshTimer = useRef(null)

  const { send, request } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)

  function refresh() {
    send({ type: 'poll', data: { cmd: 'get-all', languageId: activeLanguageId } })
  }

  function clearRefresherTimeout() {
    clearTimeout(refreshTimer.current)
  }

  function resetRefresher() {
    clearRefresherTimeout()
    refreshTimer.current = setTimeout(refresh, 250)
  }

  return (
    <PollContext.Provider value={{ polls, setPolls, selectedPollId, setSelectedPollId, refresh, resetRefresher, clearRefresherTimeout }}>
      {children}
    </PollContext.Provider>
  );
}