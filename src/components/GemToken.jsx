import React from 'react';

// Round token used everywhere a gem amount is shown: bank, player tray, card costs.
function GemToken({ gem, count, size = 'md', onClick, disabled, selected }) {
  const interactive = typeof onClick === 'function';

  return (
    <button
      type="button"
      className={`gem-token gem-${gem} token-${size} ${selected ? 'token-selected' : ''} ${interactive ? 'token-clickable' : ''}`}
      onClick={onClick}
      disabled={!interactive || disabled}
      tabIndex={interactive ? 0 : -1}
      title={gem}
    >
      <span className="token-count">{count}</span>
    </button>
  );
}

export default GemToken;
