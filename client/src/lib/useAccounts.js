import { useCallback, useState } from 'react';

function blankConfig() {
  return {
    token: '',
    channels: '',
    message: '',
    delay: '800',
    autoReplyText: '',
    autoReplyEnabled: false,
    sendAllAtOnce: true,
    imageBase64: null,
  };
}

// Holds the per-account working copies for the dashboard tabs. Lifted out of
// the Dashboard component so unsaved edits survive switching between views.
export function useAccounts() {
  const [tabs, setTabs] = useState([{ id: 'default', num: 1 }]);
  const [activeId, setActiveId] = useState('default');
  const [data, setData] = useState({ default: blankConfig() });

  const current = data[activeId] || blankConfig();

  const setField = useCallback(
    (field, value) => {
      setData((prev) => ({
        ...prev,
        [activeId]: { ...(prev[activeId] || blankConfig()), [field]: value },
      }));
    },
    [activeId]
  );

  const switchTo = useCallback((id) => {
    setActiveId(id);
    setData((prev) => (prev[id] ? prev : { ...prev, [id]: blankConfig() }));
  }, []);

  const addTab = useCallback(() => {
    const id = `account_${Date.now()}`;
    setTabs((prev) => [...prev, { id, num: prev.length + 1 }]);
    setData((prev) => ({ ...prev, [id]: blankConfig() }));
    setActiveId(id);
    return id;
  }, []);

  const removeTab = useCallback(
    (id) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.id !== id).map((t, i) => ({ ...t, num: i + 1 }));
        if (activeId === id && next.length > 0) {
          setActiveId(next[0].id);
        }
        return next;
      });
      setData((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    },
    [activeId]
  );

  const reset = useCallback(() => {
    setTabs([{ id: 'default', num: 1 }]);
    setActiveId('default');
    setData({ default: blankConfig() });
  }, []);

  return { tabs, activeId, current, setField, switchTo, addTab, removeTab, reset };
}
