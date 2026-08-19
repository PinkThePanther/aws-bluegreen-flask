import Post from "./Post";
import { useEffect, useState } from "react";





function Feed({onLogout}) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch("http://127.0.0.1:8080/posts")
        .then(response => response.json())
        .then(data => setPosts(data));
}, []);
  return (
    <div className="app">
      <aside className="sidebar">
        <h2>BlueGreen</h2>
        <button>Home</button>
        <button>Messages</button>
        <button>Create Post</button>
        <button>Settings</button>
        <button onClick={onLogout}>Log out</button>
      </aside>

      <main className="main">
        <h1>Home Feed</h1>

        <div>
          {posts.map((post) => (
            <Post
              key={post.id}
              image={post.image_url}
              caption={post.caption}
              likes={post.likes}
            />
          ))}
        </div>

      </main>
    </div>
  );
}

export default Feed;


