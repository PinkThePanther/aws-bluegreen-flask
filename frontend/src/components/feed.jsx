import Post from "./Post";
import WeatherWidget from "./WeatherWidget";
import DeploymentDemo from "./DeploymentDemo";
import { useEffect, useRef, useState } from "react";
import profilePhoto from "../assets/sandisk-WenbkhpNLCc-unsplash.jpg";
import { apiUrl } from "../api";

const Icon = ({ name }) => {
  const paths = {
    home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
    plus: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 1.1 1.5 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.13.37.34.72.6 1 .3.25.68.4 1.1.4h.1v4h-.1A1.7 1.7 0 0 0 19.4 15Z"/></>,
    sent: <><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></>,
    photo: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 20"/></>,
    video: <><rect x="3" y="5" width="14" height="14" rx="2"/><path d="m17 10 4-2v8l-4-2Z"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
};

function Feed({ account, isDemoSession, onLogout }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composerOpen, setComposerOpen] = useState(false);
  const [draftCaption, setDraftCaption] = useState("");
  const [draftImage, setDraftImage] = useState(null);
  const [composerError, setComposerError] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [pendingLikes, setPendingLikes] = useState([]);
  const [likeError, setLikeError] = useState("");
  const nextPreviewCommentId = useRef(0);
  const initialDeployment =
    (import.meta.env.VITE_DEPLOYMENT_COLOR || "blue").toLowerCase() === "green"
      ? "green"
      : "blue";
  const [deployment, setDeployment] = useState(initialDeployment);
  const isGreenDeployment = deployment === "green";

  useEffect(() => {
    fetch(apiUrl(`/posts?user_id=${account.id}`))
      .then((response) => response.json())
      .then((data) => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [account.id]);

  const closeComposer = () => {
    if (draftImage?.previewUrl) {
      URL.revokeObjectURL(draftImage.previewUrl);
    }
    setDraftCaption("");
    setDraftImage(null);
    setComposerError("");
    setComposerOpen(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setComposerError("");

    if (draftImage?.previewUrl) {
      URL.revokeObjectURL(draftImage.previewUrl);
    }

    setDraftImage({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const handleCreatePost = async (event) => {
    event.preventDefault();

    if (!draftCaption.trim() && !draftImage) return;

    if (isDemoSession) {
      setPosts((currentPosts) => [
        {
          id: `preview-${Date.now()}`,
          caption: draftCaption.trim(),
          image_url: draftImage?.previewUrl || null,
          likes: 0,
          comments: [],
        },
        ...currentPosts,
      ]);
      setDraftCaption("");
      setDraftImage(null);
      setComposerOpen(false);
      return;
    }

    const formData = new FormData();
    formData.append("user_id", account.id);
    formData.append("caption", draftCaption.trim());
    if (draftImage?.file) formData.append("image", draftImage.file);

    setSubmittingPost(true);
    setComposerError("");

    try {
      const response = await fetch(apiUrl("/posts"), {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create post");
      }

      setPosts((currentPosts) => [{ ...data.post, likes: 0, comments: [] }, ...currentPosts]);
      if (draftImage?.previewUrl) URL.revokeObjectURL(draftImage.previewUrl);
      setDraftCaption("");
      setDraftImage(null);
      setComposerOpen(false);
    } catch (error) {
      setComposerError(error.message || "Unable to create post");
    } finally {
      setSubmittingPost(false);
    }
  };

  const handleLike = async (postId) => {
    if (pendingLikes.includes(postId)) return;

    setLikeError("");

    if (isDemoSession || String(postId).startsWith("preview-")) {
      setPosts((currentPosts) => currentPosts.map((post) => {
        if (post.id !== postId) return post;
        const liked = !post.liked;
        return {
          ...post,
          liked,
          likes: Math.max(0, (post.likes || 0) + (liked ? 1 : -1)),
        };
      }));
      return;
    }

    setPendingLikes((current) => [...current, postId]);

    try {
      const response = await fetch(apiUrl(`/posts/${postId}/like`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: account.id }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || "Unable to update like");

      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? { ...post, liked: data.liked, likes: data.likes }
          : post
      )));
    } catch (error) {
      setLikeError(error.message || "Unable to update like");
    } finally {
      setPendingLikes((current) => current.filter((id) => id !== postId));
    }
  };

  const handleComment = async (postId, content) => {
    if (isDemoSession || String(postId).startsWith("preview-")) {
      nextPreviewCommentId.current += 1;
      const comment = {
        id: `preview-comment-${nextPreviewCommentId.current}`,
        post_id: postId,
        user_id: account.id,
        username: account.username,
        content,
        created_at: new Date().toISOString(),
      };
      setPosts((currentPosts) => currentPosts.map((post) => (
        post.id === postId
          ? { ...post, comments: [...(post.comments || []), comment] }
          : post
      )));
      return;
    }

    const response = await fetch(apiUrl(`/posts/${postId}/comments`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: account.id, content }),
    });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || "Unable to add comment");

    setPosts((currentPosts) => currentPosts.map((post) => (
      post.id === postId
        ? { ...post, comments: [...(post.comments || []), data.comment] }
        : post
    )));
  };

  return (
    <>
    <div
      className="social-shell"
      data-demo-session={isDemoSession || undefined}
    >
      <aside className="left-rail">
        <a className="brand" href="#feed" aria-label="BlueGreen home">
          <span className="brand-mark">BG</span>
          <span>BlueGreen</span>
        </a>

        <section className="profile-card" aria-label="Your profile">
          <div className="profile-greeting">
            <strong>Hello, {account.username}!</strong>
            <span>My URL: <button type="button">bluegreen.com/alex</button></span>
          </div>
          <div className="profile-photo-wrap">
            <img className="profile-photo" src={profilePhoto} alt="Your profile" />
            <span className="online-dot" title="Online" />
          </div>
          <div className="profile-copy">
            <span><b>Profile views:</b> 12,408</span>
            <button className="photo-link" type="button">Add / upload photos</button>
          </div>
        </section>

        <nav className="primary-nav" aria-label="Contact and navigation controls">
          <p className="control-heading">Updates</p>
          <button className="nav-item active" type="button"><span className="control-icon pink"><Icon name="mail" /></span><span className="control-label">New Messages!</span><b className="nav-badge">3</b></button>
          <button className="nav-item" type="button"><span className="control-icon green"><Icon name="users" /></span><span className="control-label">New Friend Requests!</span></button>
          <button className="nav-item" type="button"><span className="control-icon lilac"><Icon name="plus" /></span><span className="control-label">New Blog Posts!</span></button>
          <button className="nav-item" type="button"><span className="control-icon gold"><Icon name="plus" /></span><span className="control-label">New Photo Comments!</span></button>
        </nav>

        <nav className="control-panel" aria-label="Your controls">
          <p className="control-heading">Control Panel</p>
          <button className="control-row" type="button"><span className="control-icon pink"><Icon name="mail" /></span><span>Inbox</span><b className="nav-badge">3</b></button>
          <button className="control-row" type="button"><span className="control-icon blue"><Icon name="sent" /></span><span>Sent</span></button>
          <button className="control-row" type="button"><span className="control-icon green"><Icon name="users" /></span><span>Friend Requests</span></button>
          <button className="control-row" type="button"><span className="control-icon gold"><Icon name="photo" /></span><span>Photos</span></button>
          <button className="control-row" type="button"><span className="control-icon lilac"><Icon name="video" /></span><span>Videos</span></button>
        </nav>

        <div className="rail-footer">
          <button className="nav-item subdued" type="button"><Icon name="settings" />Settings</button>
          <button className="logout-link" type="button" onClick={onLogout}>Log out</button>
        </div>
      </aside>

      <main className="feed-main" id="feed">
        <header className="feed-header">
          <div>
            <p className="eyebrow">Thursday, September 11</p>
            <h1>Home</h1>
          </div>
          <button className="header-action" type="button" aria-label="Create a post" onClick={() => setComposerOpen(true)}><Icon name="plus" />New post</button>
        </header>

        {isGreenDeployment && <WeatherWidget />}

        <section className="composer" aria-label="Create a post">
          <img src={profilePhoto} alt="" />
          <button type="button" onClick={() => setComposerOpen(true)}>What’s going on, {account.username}?</button>
        </section>

        <div className="feed-list" aria-live="polite">
          {likeError && <div className="feed-error" role="alert">{likeError}</div>}
          {loading && <div className="feed-notice">Loading your feed…</div>}
          {!loading && posts.length === 0 && (
            <div className="empty-feed">
              <span className="empty-spark">✦</span>
              <h2>Your feed is ready for a first post.</h2>
              <p>Share a photo, a thought, or whatever is on repeat today.</p>
              <button type="button" onClick={() => setComposerOpen(true)}>Create a post</button>
            </div>
          )}
          {posts.map((post) => (
            <Post
              key={post.id}
              image={post.image_url}
              caption={post.caption}
              likes={post.likes}
              liked={post.liked}
              likePending={pendingLikes.includes(post.id)}
              onLike={() => handleLike(post.id)}
              comments={post.comments || []}
              onComment={(content) => handleComment(post.id, content)}
            />
          ))}
        </div>
      </main>

      <aside className="right-rail" aria-label="Social updates">
        <section className="side-module">
          <div className="module-heading"><h2>My corner</h2><button type="button">Edit</button></div>
          <p className="mood-label">CURRENT MOOD</p>
          <p className="mood">Restless, but optimistic ✦</p>
          <div className="now-playing">
            <span className="album-art">♪</span>
            <span><small>ON REPEAT</small><strong>Dreams</strong><em>Fleetwood Mac</em></span>
          </div>
        </section>
        <section className="side-module">
          <div className="module-heading"><h2>Online friends</h2><button type="button">See all</button></div>
          <div className="friends-strip">
            <button className="friend-tile" type="button"><span className="friend-avatar coral">JM</span><strong>Jamie</strong><small>Online</small></button>
            <button className="friend-tile" type="button"><span className="friend-avatar blue">RK</span><strong>Riley</strong><small>Listening</small></button>
            <button className="friend-tile" type="button"><span className="friend-avatar gold">TS</span><strong>Taylor</strong><small>8m ago</small></button>
          </div>
        </section>
      </aside>
    </div>
    {composerOpen && (
      <div className="composer-backdrop" role="presentation" onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeComposer();
      }}>
        <section className="post-composer-modal" role="dialog" aria-modal="true" aria-labelledby="post-composer-title">
          <header className="post-composer-header">
            <h2 id="post-composer-title">Create post</h2>
            <button type="button" aria-label="Close create post" onClick={closeComposer}>×</button>
          </header>

          <form className="post-composer-form" onSubmit={handleCreatePost}>
            <div className="composer-identity">
              <img src={profilePhoto} alt="" />
              <div>
                <strong>{account.username}</strong>
                <span>Friends</span>
              </div>
            </div>

            <textarea
              autoFocus
              value={draftCaption}
              onChange={(event) => {
                setDraftCaption(event.target.value);
                setComposerError("");
              }}
              placeholder={`What’s on your mind, ${account.username}?`}
              aria-label="Post text"
            />

            {draftImage && (
              <div className="composer-preview">
                <img src={draftImage.previewUrl} alt="Selected upload preview" />
                <button type="button" aria-label="Remove selected photo" onClick={() => {
                  URL.revokeObjectURL(draftImage.previewUrl);
                  setDraftImage(null);
                }}>×</button>
              </div>
            )}

            <div className="composer-attachments">
              <span>Add to your post</span>
              <label className="photo-upload-button">
                <Icon name="photo" />
                <span>Photo</span>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </label>
            </div>

            {isDemoSession && (
              <p className="composer-note">Demo post previews reset when this page refreshes.</p>
            )}
            {composerError && <p className="composer-error" role="alert">{composerError}</p>}

            <div className="composer-footer">
              <button className="composer-cancel" type="button" onClick={closeComposer} disabled={submittingPost}>Cancel</button>
              <button className="composer-submit" type="submit" disabled={submittingPost || (!draftCaption.trim() && !draftImage)}>{submittingPost ? "Posting…" : "Post"}</button>
            </div>
          </form>
        </section>
      </div>
    )}
    <DeploymentDemo deployment={deployment} onDeploymentChange={setDeployment} />
    </>
  );
}

export default Feed;
