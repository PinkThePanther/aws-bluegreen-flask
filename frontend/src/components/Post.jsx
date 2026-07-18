function Post({ image, likes }) {
  return (
    <div>
      <img className="post-image" src={image} alt="" />
      <p>{likes} likes</p>
    </div>
  );
}

export default Post;

