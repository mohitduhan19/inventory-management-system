import { useCallback, useEffect, useState } from 'react';

export default function useToast(duration = 3000) {
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), duration);
    return () => clearTimeout(timer);
  }, [message, duration]);

  const showToast = useCallback((text) => setMessage(text), []);
  const clearToast = useCallback(() => setMessage(null), []);

  return { message, showToast, clearToast };
}
