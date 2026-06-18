function Toast({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div className="toast-success" role="status">
      <span>{message}</span>
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}

export default Toast;
