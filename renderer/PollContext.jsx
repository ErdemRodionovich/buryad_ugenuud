import { createContext, useState, useContext } from 'react';
import { IPCContext } from './IPCContext'
import { ActiveLanguageContext } from './ActiveLanguageContext'

export const PollContext = createContext();

export function PollProvider({ children }) {
  const [polls, setPolls] = useState([]);
  const [selectedPollId, setSelectedPollId] = useState(null)

  const { send } = useContext(IPCContext)
  const { activeLanguageId } = useContext(ActiveLanguageContext)

  function refresh() {
    send({ type: 'poll', data: { cmd: 'get-all', languageId: activeLanguageId } })
  }

  return (
    <PollContext.Provider value={{ polls, setPolls, selectedPollId, setSelectedPollId, refresh }}>
      {children}
    </PollContext.Provider>
  );
}