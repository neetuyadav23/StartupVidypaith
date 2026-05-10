// src/Pages/CommunityChat/CommunityChat.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../AuthContext';
import Header from '../../Components/Header/Header.jsx';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import './CommunityChat.css';

const CommunityChat = () => {
  const { user } = useAuth();
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [joiningId, setJoiningId] = useState(null);
  const [leavingId, setLeavingId] = useState(null);
  
  const currentCommunityIdRef = useRef(null);

  const fetchCommunities = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/community');
      setCommunities(res.data);
      setError('');
    } catch (err) {
      console.error('Failed to fetch communities', err);
      setError('Failed to load communities.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (communityId) => {
    if (!communityId) return;
    try {
      const res = await axios.get(`http://localhost:5000/api/community/${communityId}/messages`);
      if (currentCommunityIdRef.current === communityId) {
        setMessages(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
      if (err.response?.status === 403) {
        alert('You must join this community to view its messages.');
        setSelectedCommunity(null);
        setMessages([]);
      }
    }
  }, []);

  useEffect(() => {
    fetchCommunities();
  }, [fetchCommunities]);

  useEffect(() => {
    if (selectedCommunity && selectedCommunity.isMember) {
      currentCommunityIdRef.current = selectedCommunity._id;
      fetchMessages(selectedCommunity._id);
    } else {
      currentCommunityIdRef.current = null;
      setMessages([]);
    }
  }, [selectedCommunity, fetchMessages]);

  // 🔥 UPDATED: Allow creator to access without joining
  const handleCommunitySelect = (communityId) => {
    const community = communities.find(c => c._id === communityId);
    if (!community) return;

    const isCreator = user && (
      community.createdBy?._id === user._id || community.createdBy === user._id
    );
    if (community.isMember || isCreator) {
      setSelectedCommunity(community);
    } else {
      alert('Please join this community first to start chatting.');
    }
  };

  const handleSendMessage = async (text) => {
    if (!selectedCommunity || !text.trim() || !user) return;
    try {
      const res = await axios.post(`http://localhost:5000/api/message/${selectedCommunity._id}`, {
        senderId: user._id,
        text: text.trim(),
      });
      const newMessage = {
        _id: res.data._id,
        text: res.data.text,
        senderId: user._id,
        senderName: user.fullName || user.name || user.email,
        createdAt: new Date(),
      };
      if (currentCommunityIdRef.current === selectedCommunity._id) {
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleJoinCommunity = async (communityId) => {
    setJoiningId(communityId);
    try {
      await axios.post(`http://localhost:5000/api/community/${communityId}/join`);
      setCommunities(prev =>
        prev.map(c => (c._id === communityId ? { ...c, isMember: true } : c))
      );
      if (selectedCommunity?._id === communityId) {
        setSelectedCommunity(prev => ({ ...prev, isMember: true }));
        currentCommunityIdRef.current = communityId;
        fetchMessages(communityId);
      }
    } catch (err) {
      console.error('Failed to join community', err);
      alert('Failed to join community');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeaveCommunity = async (communityId) => {
    if (!window.confirm('Are you sure you want to leave this community?')) return;
    setLeavingId(communityId);
    try {
      await axios.post(`http://localhost:5000/api/community/${communityId}/leave`);
      setCommunities(prev =>
        prev.map(c => (c._id === communityId ? { ...c, isMember: false } : c))
      );
      if (selectedCommunity?._id === communityId) {
        setSelectedCommunity(null);
        setMessages([]);
        currentCommunityIdRef.current = null;
      }
    } catch (err) {
      console.error('Failed to leave community', err);
      alert('Failed to leave community');
    } finally {
      setLeavingId(null);
    }
  };

  const handleDeleteCommunity = async (communityId) => {
    if (!window.confirm('Are you sure you want to delete this community? All messages will be lost.')) return;
    try {
      await axios.delete(`http://localhost:5000/api/community/${communityId}`);
      await fetchCommunities();
      if (selectedCommunity?._id === communityId) {
        setSelectedCommunity(null);
        setMessages([]);
        currentCommunityIdRef.current = null;
      }
    } catch (err) {
      console.error('Failed to delete community', err);
      alert('Failed to delete community');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/message/${messageId}`);
      if (selectedCommunity) {
        fetchMessages(selectedCommunity._id);
      }
    } catch (err) {
      console.error('Failed to delete message', err);
      alert('Failed to delete message');
    }
  };

  if (loading) return <div className="loading">Loading communities...</div>;
  if (error) return <div className="error">{error}</div>;

  const canSend = user && (
    user.type === 'founder' || user.userType === 'founder' ||
    user.type === 'student' || user.userType === 'student' ||
    user.type === 'admin' || user.userType === 'admin'
  );

  return (
    <>
      <div className="community-fixed-header">
        <Header />
      </div>
      <div className="community-chat-container">
        <Sidebar
          communities={communities}
          selectedId={selectedCommunity?._id}
          onSelect={handleCommunitySelect}
          showCreateButton={user && (user.type === 'founder' || user.userType === 'founder')}
          user={user}
          onCommunityCreated={fetchCommunities}
          onDeleteCommunity={handleDeleteCommunity}
          onJoinCommunity={handleJoinCommunity}
          onLeaveCommunity={handleLeaveCommunity}
          joiningId={joiningId}
          leavingId={leavingId}
        />
        <div className="chat-area">
          {selectedCommunity ? (
            <ChatWindow
              community={{ ...selectedCommunity, messages }}
              onSend={handleSendMessage}
              canSend={canSend}
              user={user}
              onDeleteMessage={handleDeleteMessage}
            />
          ) : (
            <div className="no-community-selected">
              <p>Select a community from the sidebar to start chatting.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CommunityChat;