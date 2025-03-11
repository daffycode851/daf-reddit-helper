import React, { useState, useEffect } from 'react';
import { Loader2, ArrowUpRight, MessageSquare, ArrowUp, AlertCircle, Copy, Check } from 'lucide-react';

interface RedditPost {
  data: {
    title: string;
    author: string;
    ups: number;
    num_comments: number;
    permalink: string;
    url: string;
    id: string;
    selftext: string;
  };
}

function App() {
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [subreddit, setSubreddit] = useState('agency');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedFullId, setCopiedFullId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      if (!subreddit.trim()) {
        setError('Please enter a subreddit name');
        return;
      }

      setLoading(true);
      setError(null);
      setPosts([]);

      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/new.json`,
          {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'web:reddit-viewer:v1.0'
            }
          }
        );

        if (response.status === 403) {
          throw new Error('This subreddit is private or quarantined');
        }
        
        if (response.status === 404) {
          throw new Error('Subreddit not found. Please check the name and try again');
        }

        if (!response.ok) {
          throw new Error('Failed to fetch posts. Please try again later');
        }

        const data = await response.json();

        if (data.data.children.length === 0) {
          throw new Error('No posts found in this subreddit');
        }

        setPosts(data.data.children);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch posts');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchPosts, 300);
    return () => clearTimeout(timeoutId);
  }, [subreddit]);

  const handleCopy = async (text: string, id: string, type: 'title' | 'full') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'title') {
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
      } else {
        setCopiedFullId(id);
        setTimeout(() => setCopiedFullId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Reddit Posts</h1>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={subreddit}
                onChange={(e) => setSubreddit(e.target.value.trim())}
                placeholder="Enter subreddit name (e.g., 'agency')"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-500">
                Enter the subreddit name without "r/" prefix
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-red-800 font-medium">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.data.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <ArrowUp className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {post.data.ups}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <a
                        href={`https://reddit.com${post.data.permalink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-medium text-gray-900 hover:text-blue-600 flex items-center gap-2"
                      >
                        {post.data.title}
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleCopy(post.data.title, post.data.id, 'title')}
                          className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                          title="Copy title to clipboard"
                        >
                          {copiedId === post.data.id ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          <span>Copy title</span>
                        </button>
                        {post.data.selftext && (
                          <button
                            onClick={() => handleCopy(`${post.data.title}\n\n${post.data.selftext}`, post.data.id, 'full')}
                            className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                            title="Copy full post to clipboard"
                          >
                            {copiedFullId === post.data.id ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            <span>Full text</span>
                          </button>
                        )}
                      </div>
                    </div>
                    {post.data.selftext && (
                      <div className="mt-3 text-gray-700 whitespace-pre-wrap line-clamp-3">
                        {post.data.selftext}
                      </div>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      <span>Posted by u/{post.data.author}</span>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        {post.data.num_comments} comments
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;