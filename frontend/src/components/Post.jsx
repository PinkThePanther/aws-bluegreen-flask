import { useState } from "react";

function Post({
  image,
  likes = 0,
  caption,
  liked = false,
  likePending = false,
  onLike,
  comments = [],
  onComment,
}) {
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState("");
  const [commentPending, setCommentPending] = useState(false);

  const submitComment = async (event) => {
    event.preventDefault();
    const content = commentText.trim();

    if (!content || commentPending) return;

    setCommentPending(true);
    setCommentError("");

    try {
      await onComment(content);
      setCommentText("");
    } catch (error) {
      setCommentError(error.message || "Unable to add comment");
    } finally {
      setCommentPending(false);
    }
  };

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
        <span>{comments.length} {comments.length === 1 ? "comment" : "comments"}</span>
      </footer>
      <div className="post-actions">
        <button
          className={liked ? "liked" : ""}
          type="button"
          onClick={onLike}
          disabled={likePending}
          aria-pressed={liked}
        >{liked ? "♥ Liked" : "♡ Like"}</button>
        <button type="button" onClick={() => setCommentOpen((open) => !open)}>○ Comment</button>
        <button type="button">↗ Share</button>
      </div>
      {(comments.length > 0 || commentOpen) && (
        <section className="post-comments" aria-label="Post comments">
          {comments.map((comment) => (
            <div className="comment-row" key={comment.id}>
              <span className="comment-avatar">{comment.username.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{comment.username}</strong>
                <p>{comment.content}</p>
              </div>
            </div>
          ))}
          {commentOpen && (
            <form className="comment-form" onSubmit={submitComment}>
              <input
                value={commentText}
                onChange={(event) => {
                  setCommentText(event.target.value);
                  setCommentError("");
                }}
                maxLength="500"
                placeholder="Write a comment…"
                aria-label="Write a comment"
              />
              <button type="submit" disabled={!commentText.trim() || commentPending}>
                {commentPending ? "Posting…" : "Post"}
              </button>
              {commentError && <p className="comment-error" role="alert">{commentError}</p>}
            </form>
          )}
        </section>
      )}
    </article>
  );
}

export default Post;
