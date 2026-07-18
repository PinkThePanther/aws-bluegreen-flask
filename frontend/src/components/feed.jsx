import posts from "../data/posts";
import Post from "./Post";



function Feed() {
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>BlueGreen</h2>
        <button>Home</button>
        <button>Messages</button>
        <button>Create Post</button>
        <button>Settings</button>
      </aside>

      <main className="main">
        <h1>Home Feed</h1>

        <div>
          {posts.map((post) => (
            <Post
              key={post.id}
              image={post.image}
              likes={post.likes}
            />
          ))}
        </div>

      </main>
    </div>
  );
}

export default Feed;


