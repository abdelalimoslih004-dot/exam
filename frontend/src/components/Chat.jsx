import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const Chat = ({ isOpen, onClose, username }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [connected, setConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (isOpen && !socketRef.current) {
      // Connect to SocketIO server
      socketRef.current = io(import.meta.env.VITE_BACKEND_URL, {
        transports: ['websocket', 'polling']
      });

      socketRef.current.on('connect', () => {
        console.log('Connected to chat server');
        setConnected(true);
        // Join the trading chat room
        socketRef.current.emit('join_chat', { username });
      });

      socketRef.current.on('disconnect', () => {
        console.log('Disconnected from chat server');
        setConnected(false);
      });

      socketRef.current.on('message', (data) => {
        setMessages(prev => [...prev, data]);
      });
    }

    return () => {
      if (socketRef.current && !isOpen) {
        socketRef.current.emit('leave_chat', { username });
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isOpen, username]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim() || !socketRef.current) return;

    socketRef.current.emit('send_message', {
      username,
      message: inputMessage
    });

    setInputMessage('');
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-gray-800 rounded-xl shadow-2xl border border-gray-700 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-xl p-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`}></div>
          <div>
            <h3 className="font-bold text-white">💬 Trading Chat</h3>
            <p className="text-xs text-blue-100">
              {connected ? 'Online' : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-gray-300 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-900">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'system' ? (
                <div className="text-center text-xs text-gray-500 italic">
                  {msg.content}
                </div>
              ) : (
                <div className={`flex ${msg.username === username ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.username === username
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    {msg.username !== username && (
                      <div className="text-xs font-semibold mb-1 text-blue-300">
                        {msg.username}
                      </div>
                    )}
                    <div className="text-sm break-words">{msg.content}</div>
                    <div className={`text-xs mt-1 ${
                      msg.username === username ? 'text-blue-200' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} className="p-4 bg-gray-800 border-t border-gray-700 rounded-b-xl">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={!connected}
            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!connected || !inputMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Connected as <span className="text-blue-400 font-semibold">{username}</span>
        </div>
      </form>
    </div>
  );
};

export default Chat;
