import React, { useState, useEffect, useCallback } from 'react';
import '../styles/CommunitySupport.css';

interface Post {
  id: number;
  title: string;
  content: string;
  author: string;
  timestamp: string;
  reactions: number;
  comments: number;
  isAnonymous: boolean;
}

const CommunitySupport: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    isAnonymous: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState('latest');

  const fetchPosts = useCallback(async () => {
    try {
      const res = await fetch(`/api/community-posts?sort=${activeFilter}`);
      const data = await res.json();
      if (data.success) {
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchPosts();
  }, [activeFilter, fetchPosts]);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/community-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPost)
      });

      if (res.ok) {
        setNewPost({ title: '', content: '', isAnonymous: true });
        setShowNewPost(false);
        fetchPosts();
      }
    } catch (err) {
      console.error('Failed to submit post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (postId: number) => {
    try {
      await fetch(`/api/community-posts/${postId}/react`, { method: 'POST' });
      fetchPosts();
    } catch (err) {
      console.error('Failed to react:', err);
    }
  };

  return (
    <div className="community-support-container">
      <div className="community-header">
        <div className="header-content">
          <h1>🤝 Community Support Wall</h1>
          <p>A safe space where women share stories, support each other, and find strength in community.</p>
        </div>
        <button
          className="btn btn-primary btn-lg"
          onClick={() => setShowNewPost(!showNewPost)}
        >
          ✍️ Share Your Story
        </button>
      </div>

      {/* New Post Form */}
      {showNewPost && (
        <div className="new-post-container">
          <form onSubmit={handlePostSubmit} className="post-form">
            <h3>Share Your Story</h3>
            <input
              type="text"
              className="form-control"
              placeholder="Give your story a title (optional)"
              value={newPost.title}
              onChange={(e) =>
                setNewPost((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <textarea
              className="form-control"
              placeholder="Share your experience... (be as detailed as you'd like)"
              rows={6}
              value={newPost.content}
              onChange={(e) =>
                setNewPost((prev) => ({ ...prev, content: e.target.value }))
              }
              required
            />
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="anonymousCheck"
                checked={newPost.isAnonymous}
                onChange={(e) =>
                  setNewPost((prev) => ({
                    ...prev,
                    isAnonymous: e.target.checked
                  }))
                }
              />
              <label className="form-check-label" htmlFor="anonymousCheck">
                Share anonymously
              </label>
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowNewPost(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? 'Sharing...' : 'Share Story'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="filter-buttons">
        <button
          className={`filter-btn ${activeFilter === 'latest' ? 'active' : ''}`}
          onClick={() => setActiveFilter('latest')}
        >
          Latest
        </button>
        <button
          className={`filter-btn ${activeFilter === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveFilter('trending')}
        >
          Trending
        </button>
        <button
          className={`filter-btn ${activeFilter === 'supportive' ? 'active' : ''}`}
          onClick={() => setActiveFilter('supportive')}
        >
          Most Supportive
        </button>
      </div>

      {/* Posts List */}
      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="empty-posts">
            <p>📝 No stories yet. Be the first to share your experience!</p>
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-meta">
                    <h4 className="post-title">{post.title}</h4>
                    <p className="post-author">
                      By {post.isAnonymous ? 'Anonymous' : post.author}
                    </p>
                    <p className="post-date">{post.timestamp}</p>
                  </div>
                </div>

                <div className="post-content">
                  <p>{post.content.substring(0, 200)}...</p>
                </div>

                <div className="post-footer">
                  <div className="post-stats">
                    <button
                      className="stat-btn"
                      onClick={() => handleReaction(post.id)}
                    >
                      ❤️ {post.reactions}
                    </button>
                    <button className="stat-btn">
                      💬 {post.comments}
                    </button>
                  </div>
                  <button className="btn btn-sm btn-outline-primary">
                    Read More
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Support Resources */}
      <div className="support-resources">
        <h3>💙 Support Resources</h3>
        <div className="resources-grid">
          <div className="resource-card">
            <div className="resource-icon">🎧</div>
            <h4>Listening Ear</h4>
            <p>Talk to someone who listens and understands.</p>
            <a href="/support-chat" className="resource-link">
              Start Chat →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">📞</div>
            <h4>Crisis Helpline</h4>
            <p>24/7 support from trained counselors.</p>
            <a href="tel:181" className="resource-link">
              Call 181 →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">🏥</div>
            <h4>Medical Support</h4>
            <p>Emergency medical services nearby.</p>
            <a href="tel:108" className="resource-link">
              Call 108 →
            </a>
          </div>

          <div className="resource-card">
            <div className="resource-icon">⚖️</div>
            <h4>Legal Advice</h4>
            <p>Free legal consultation and support.</p>
            <a href="/" className="resource-link">
              Learn More →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunitySupport;
