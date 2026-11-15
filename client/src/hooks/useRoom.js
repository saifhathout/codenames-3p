import { useEffect, useState } from 'react';
import { socket } from '../socket';

export function useRoom() {
  const [state, setState] = useState(null);
  useEffect(() => {
    const handler = (s) => setState(s);
    socket.on('room:update', handler);
    return () => socket.off('room:update', handler);
  }, []);
  return [state, setState];
}