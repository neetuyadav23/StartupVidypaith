// src/Pages/CommunityChat/Sidebar.jsx
import React, { useState } from 'react';
import axios from 'axios';
import './Sidebar.css';

const Sidebar = ({
  communities,
  selectedId,
  onSelect,
  showCreateButton,
  user,
  onCommunityCreated,
  onDeleteCommunity,
  onJoinCommunity,
  onLeaveCommunity,
  joiningId,
  leavingId
}) => {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [createError, setCreateError] = useState('');

  const filteredCommunities = communities.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      setCreateError('Community name is required');
      return;
    }
    try {
      await axios.post('http://localhost:5000/api/community/create', {
        name: name.trim(),
        description: description.trim(),
        createdBy: user._id,
      });
      setName('');
      setDescription('');
      setCreating(false);
      setCreateError('');
      onCommunityCreated();
    } catch (err) {
      console.error('Failed to create community', err);
      setCreateError('Failed to create community. Please try again.');
    }
  };

  const handleDelete = (communityId, communityName) => {
    if (window.confirm(`Are you sure you want to delete community "${communityName}"? This will delete all messages.`)) {
      onDeleteCommunity(communityId);
    }
  };

  const canDeleteCommunity = (community) => {
    if (!user) return false;
    if (user.type === 'admin' || user.userType === 'admin') return true;
    const creatorId = community.createdBy?._id || community.createdBy;
    return creatorId === user._id;
  };

  return (
    <aside className="sidebar">
      <h2 className="logo">Vidyapith</h2>

      <input
        type="text"
        className="search"
        placeholder="Search communities..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {showCreateButton && (
        <div className="create-section">
          {!creating ? (
            <button className="create-btn" onClick={() => setCreating(true)}>
              + Create Community
            </button>
          ) : (
            <div className="create-form">
              <input
                placeholder="Community Name"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <input
                placeholder="Description (optional)"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              {createError && <p className="error-msg">{createError}</p>}
              <div className="create-actions">
                <button onClick={handleCreate}>Create</button>
                <button onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="community-list">
        {filteredCommunities.length === 0 && (
          <p className="empty">No communities found</p>
        )}
        {filteredCommunities.map(community => {
          // 🔥 Determine if user is the creator
          const isCreator = user && (
            community.createdBy?._id === user._id || community.createdBy === user._id
          );
          const isActuallyMember = community.isMember || isCreator;

          return (
            <div
              key={community._id}
              className={`community-item ${selectedId === community._id ? 'active' : ''}`}
            >
              <div className="avatar" onClick={() => onSelect(community._id)}>
                {community.name[0].toUpperCase()}
              </div>
              <div className="info" onClick={() => onSelect(community._id)}>
                <h4>{community.name}</h4>
                <p>{community.description?.slice(0, 40)}...</p>
                <span className="member-count">
                  👥 {community.members?.length || 0} member{community.members?.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="community-actions">
                {user && (
                  isActuallyMember ? (
                    <button
                      className="leave-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLeaveCommunity(community._id);
                      }}
                      disabled={leavingId === community._id}
                      title="Leave community"
                    >
                      {leavingId === community._id ? '⌛' : '➖'}
                    </button>
                  ) : (
                    <button
                      className="join-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJoinCommunity(community._id);
                      }}
                      disabled={joiningId === community._id}
                      title="Join community"
                    >
                      {joiningId === community._id ? '⌛' : '➕'}
                    </button>
                  )
                )}
                {canDeleteCommunity(community) && (
                  <button
                    className="delete-community-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(community._id, community.name);
                    }}
                    title="Delete community"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default Sidebar;