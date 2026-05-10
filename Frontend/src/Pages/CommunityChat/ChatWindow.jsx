// src/Pages/CommunityChat/ChatWindow.jsx
import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import './ChatWindow.css';

const ChatWindow = ({ community, onSend, canSend, user, onDeleteMessage }) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [community.messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text);
    setText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canDeleteMessages = () => {
    if (!user) return false;
    if (user.type === 'admin' || user.userType === 'admin') return true;
    if (community && community.createdBy) {
      const creatorId = community.createdBy._id || community.createdBy;
      return creatorId === user._id;
    }
    return false;
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{community.name}</h3>
        <p className="chat-description">{community.description}</p>
        {/* 🔥 Show community creator */}
        {community.createdBy && (
          <p className="chat-creator">
            👑 Created by: {community.createdBy.fullName || community.createdBy.name || 'Unknown'}
          </p>
        )}
      </div>

      <div className="messages-container">
        {community.messages && community.messages.length > 0 ? (
          community.messages.map((msg, idx) => (
            <div key={idx} className="message">
              <div className="message-sender">{msg.senderName || 'Anonymous'}</div>
              <div className="message-text">
                {msg.text.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                  <img src={msg.text} alt="Uploaded" style={{ maxWidth: '200px', maxHeight: '200px' }} />
                ) : (
                  msg.text
                )}
              </div>
              <div className="message-time">
                {msg.createdAt && new Date(msg.createdAt).toLocaleTimeString()}
              </div>
              {canDeleteMessages() && (
                <button
                  className="delete-message-btn"
                  onClick={() => onDeleteMessage(msg._id)}
                  title="Delete message"
                >
                  🗑️
                </button>
              )}
            </div>
          ))
        ) : (
          <p className="empty-messages">No messages yet. Be the first to say something!</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {canSend && (
        <div className="message-input-area">
          <button className="emoji-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😀</button>
          {showEmojiPicker && (
            <EmojiPicker
              onEmojiClick={(emojiObject) => {
                setText(text + emojiObject.emoji);
                setShowEmojiPicker(false);
              }}
              pickerStyle={{ position: 'absolute', bottom: '50px', left: '10px' }}
            />
          )}
          <textarea
            rows="2"
            placeholder="Type your message..."
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSend} disabled={!text.trim()}>
            Send
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;