import React, { useState } from 'react';
import Header from '../../Components/Header/Header.jsx';
import './Explore.css';

const Explore = () => {
  const [query, setQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [similarStartups, setSimilarStartups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [blockHit, setBlockHit] = useState(false);

  const handleRecommend = async () => {
    if (!query.trim()) {
      setError('Hit the ? block after typing your wish!');
      return;
    }
    setLoading(true);
    setError('');
    setSimilarStartups([]);
    setBlockHit(true);
    setTimeout(() => setBlockHit(false), 200);

    try {
      const response = await fetch('http://localhost:8000/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query, top_k: 5 }),
      });
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      const filtered = (data.recommendations || []).filter(rec => rec.score > 0.05);
      setRecommendations(filtered);

      if (filtered.length > 0) {
        const topId = filtered[0].id;
        const similarRes = await fetch('http://localhost:8000/similar_startups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startup_id: topId }),
        });
        if (similarRes.ok) {
          const similarData = await similarRes.json();
          setSimilarStartups(similarData.similar_startups || []);
        }
      }

      if (filtered.length === 0) {
        setError('No power‑ups found. Try different words!');
      }
    } catch (err) {
      console.error(err);
      setError('ML API error. Is it running on port 8000?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleRecommend();
  };

  return (
    <div className="mario-explore">
      <Header />
      <div className="game-container">
        <div className="clouds">
          <div className="cloud"></div>
          <div className="cloud"></div>
          <div className="cloud"></div>
        </div>
        <div className="ground"></div>

        <div className="question-block-area">
          <div className={`question-block ${blockHit ? 'hit' : ''}`} onClick={handleRecommend}>
            <span className="question-mark">❓</span>
          </div>
          <div className="query-input-wrapper">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Describe your dream startup... (e.g., 'I need a React developer for an EdTech platform')"
              rows={2}
              className="mario-input"
            />
            <button className="mario-button" onClick={handleRecommend} disabled={loading}>
              {loading ? '⭐ Loading...' : 'Hit the Block!'}
            </button>
          </div>
        </div>

        {error && <div className="error-message mario-error">⚠️ {error}</div>}

        {/* Power‑ups (main recommendations) */}
        {recommendations.length > 0 && (
          <div className="powerups">
            <h2 className="powerup-title">🌟 POWER-UPS FOUND! 🌟</h2>
            <div className="powerup-grid">
              {recommendations.map((startup) => (
                <div key={startup.id} className="powerup-card">
                  <div className="powerup-icon">
                    {startup.score > 0.6 ? '🍄' : startup.score > 0.4 ? '⭐' : '🌸'}
                  </div>
                  <div className="powerup-content">
                    <h3>{startup.name}</h3>
                    <p className="coins">{Math.round(startup.score * 100)} 🪙</p>
                    <p className="industry">🏭 {startup.industry || 'Various'}</p>
                    <p className="description small">
                      {startup.description?.length > 100
                        ? startup.description.substring(0, 100) + '...'
                        : startup.description}
                    </p>
                    <div className="badges">
                      {startup.hiring && <span className="badge hiring">🚀 Hiring</span>}
                      {startup.looking_for && (
                        <span className="badge looking">🔍 {startup.looking_for}</span>
                      )}
                    </div>
                    <a href={`/founder/${startup.id}`} className="mario-link">▶ ENTER PIPE</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* EXTRA LIVES (similar startups) – now with full profile */}
        {similarStartups.length > 0 && (
          <div className="extra-lives">
            <h3>🍄 EXTRA LIVES (similar startups) 🍄</h3>
            <div className="extra-grid">
              {similarStartups.map((startup) => (
                <div key={startup.id} className="extra-card">
                  <div className="extra-icon">❤️</div>
                  <div className="extra-content">
                    <h4>{startup.name}</h4>
                    <p className="extra-industry">{startup.industry || 'Various'}</p>
                    <div className="extra-badges">
                      {startup.hiring && <span className="badge hiring">🚀 Hiring</span>}
                      {startup.looking_for && (
                        <span className="badge looking">🔍 {startup.looking_for}</span>
                      )}
                    </div>
                    <a href={`/founder/${startup.id}`} className="extra-link">View Profile →</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;