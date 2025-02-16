const WS_URL = process.env.NODE_ENV === 'production' 
  ? `wss://${window.location.host}/ws`
  : `ws://${window.location.host}/ws`;

export const createWebSocket = () => {
  const ws = new WebSocket(WS_URL);

  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  const connect = () => {
    ws.onopen = () => {
      console.log('WebSocket Connected');
      reconnectAttempts = 0;
      // Send initial ping
      ws.send(JSON.stringify({ type: 'ping' }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // Implement reconnection logic
      if (reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        console.log(`Reconnecting... Attempt ${reconnectAttempts}`);
        setTimeout(connect, 1000 * reconnectAttempts);
      }
    };
  };

  connect();
  return ws;
}; 