function Post({ image, likes = 0, caption, liked = false, likePending = false, onLike }) {
  return (
    <article className="feed-post">
      <header className="post-header">
        <span className="post-avatar">BG</span>
        <div><strong>BlueGreen friend</strong><span>Just now · Friends</span></div>
        <button type="button" aria-label="More post options">•••</button>
      </header>
      {caption && <p className="post-caption">{caption}</p>}
      {image && <img className="post-image" src={image} alt="Shared post" />}
      <footer className="post-footer">
        <span>♥ {likes || 0}</span>
        <span>0 comments</span>
      </footer>
      <div className="post-actions">
        <button
          className={liked ? "liked" : ""}
          type="button"
          onClick={onLike}
          disabled={likePending}
          aria-pressed={liked}
        >{liked ? "♥ Liked" : "♡ Like"}</button>
        <button type="button">○ Comment</button>
        <button type="button">↗ Share</button>
      </div>
    </article>
  );
}

export default Post;
