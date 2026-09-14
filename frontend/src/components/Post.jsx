function Post({ image, likes = 0, caption }) {
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
        <button type="button">♡ Like</button>
        <button type="button">○ Comment</button>
        <button type="button">↗ Share</button>
      </div>
    </article>
  );
}

export default Post;
