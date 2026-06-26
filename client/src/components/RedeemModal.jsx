import { useEffect, useState } from 'react';
import { api } from '../api';
import { KEY_PREFIX } from '../constants';

// Access key redemption dialog. Accepts keys in the VEILED-XXXX-XXXX format
// and, on success, refreshes the session and opens the dashboard.
export default function RedeemModal({ open, onClose, onRedeemed, toast }) {
  const [value, setValue] = useState('');
  const [closing, setClosing] = useState(false);

  // Reset the closing flag whenever the dialog is reopened.
  useEffect(() => {
    if (open) setClosing(false);
  }, [open]);

  if (!open) return null;

  // Play the close animation before unmounting via the parent.
  const requestClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };

  const redeem = async () => {
    const key = value.trim().toUpperCase();
    if (!key || !key.startsWith(KEY_PREFIX)) {
      toast.error('Invalid key format. Must start with VEILED-');
      return;
    }
    try {
      const data = await api.post('/api/redeem', { key });
      if (data.success) {
        toast.success('Access granted. Welcome to Veiled Adv.');
        setValue('');
        requestClose();
        onRedeemed();
      } else {
        toast.error(data.error || 'Invalid key');
      }
    } catch (e) {
      toast.error(e.message || 'Error redeeming key');
    }
  };

  return (
    <div className={`modal-overlay${closing ? ' closing' : ''}`} onClick={requestClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal-title">Redeem Access Key</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16 }}>Enter your Veiled Adv access key</p>
        <input
          type="text"
          className="form-input"
          style={{ marginBottom: 16 }}
          placeholder="VEILED-XXXX-XXXX"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && redeem()}
        />
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn-ghost" style={{ flex: 1 }} onClick={requestClose}>Cancel</button>
          <button className="btn" style={{ flex: 1 }} onClick={redeem}>Redeem</button>
        </div>
      </div>
    </div>
  );
}
