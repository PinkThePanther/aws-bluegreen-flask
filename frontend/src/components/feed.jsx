

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
          <Feed></Feed>
        </div>
      </main>
    </div>
  )
}



export default Feed