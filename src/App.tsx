import { useEffect, useState } from "react";
import * as htmlparser2 from "htmlparser2";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App container w-180 mx-auto">
      <Header />
      <h3 className="mx-2 mt-16">Already subscribed:</h3>
      <FeedList />
    </div>
  );
}

function Header() {
  return (
    <header className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <img src={viteLogo} alt="Vite Logo" className="h-8" />
        <h1 className="text-2xl font-bold">Rss2Email</h1>
      </div>
      <AddFeed />
    </header>
  );
}

function FeedList() {
  const [feeds, setFeeds] = useState([]);
  useEffect(() => {
    fetch("https://rss2email.chaojie.workers.dev/api/feeds")
      .then((resp) => resp.json())
      .then((data) => setFeeds(data.feeds))
      .catch((err) => console.log(err));
  }, []);
  return (
    <div className="grid place-content-center space-y-2">
      {feeds.map((feed) => (
        <Feed feed={feed} key={feed.origin} />
      ))}
    </div>
  );
}

function AddFeed() {
  const [newFeed, setNewFeed] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    // event.preventDefault();
    console.log(`New feed: ${newFeed}`);

    await fetch("https://rss2email.chaojie.workers.dev/api/feeds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url: newFeed }),
    }).catch((error) => console.error(error));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="text-end text-gray-800 text-sm my-2">
        Subscribe new rss:
      </div>
      <span>
        <input
          type="text"
          name="url"
          value={newFeed}
          onChange={(e) => setNewFeed(e.target.value)}
          placeholder="Rss Address"
          className="border border-r-0 border-solid border-gray-500 rounded-l-sm py-1 w-48"
        />
        <input
          type="submit"
          value="Submit"
          className="border botder-l-0 border-solid border-green-500 rounded-r-sm py-1 px-4 bg-green-500 text-white"
        />
      </span>
    </form>
  );
}

function Feed(props: any) {
  const feed = props.feed;

  function handleClick(url: string) {
    return async () => {
      await fetch(
        `https://rss2email.chaojie.workers.dev/api/feeds?url=${url}`,
        {
          method: "DELETE",
        }
      ).catch((error) => console.error(error));
    };
  }

  return (
    <div className="md:w-180 sm:w-full m-2 bg-gray-100 hover:shadow rounded-sm">
      <div className="my-2 mx-10 py-2 flex justify-between items-center">
        <div>
          <div className="text-sm text-gray-500">{feed.updated}</div>
          <h4 className="my-2">
            <a href={feed.link} target="_blank">
              {feed.title}
            </a>
            : {feed.description}
          </h4>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="hover:text-red-500"
          onClick={handleClick(feed.origin)}
        >
          <path
            fill="currentColor"
            d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM8 9h8v10H8V9zm7.5-5l-1-1h-5l-1 1H5v2h14V4h-3.5z"
          />
        </svg>
      </div>
    </div>
  );
}

export default App;
