function Post({ image, likes,caption }) {
  return (
    <div>
      <img className="post-image" src={image} alt="" />
      <p>{likes} likes</p>
      <p>{caption}</p>
    </div>
  );
}

export default Post;

