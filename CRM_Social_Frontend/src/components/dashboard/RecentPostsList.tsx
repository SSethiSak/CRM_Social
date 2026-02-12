import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { PlatformIcon } from '@/components/shared/PlatformIcon';
import { formatRelativeTime, truncateText } from '@/lib/formatters';
import { FileText, MessageSquare, ExternalLink, ChevronRight, ArrowLeft, Heart, Share2, Loader2 } from 'lucide-react';
import type { Post, Comment } from '@/types/social';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import api from '@/lib/api';

interface Reaction {
  id: string;
  name: string;
  type: string;
  avatar: string | null;
  platform: string;
}

interface ShareDetail {
  id: string;
  name: string;
  avatar: string | null;
  sharedAt: string;
  platform: string;
}

interface PostDetailViewProps {
  post: Post;
  comments: Comment[];
  onBack: () => void;
}

const reactionEmojis: Record<string, string> = {
  LIKE: '👍',
  LOVE: '❤️',
  HAHA: '😂',
  WOW: '😮',
  SAD: '😢',
  ANGRY: '😠',
};

function PostDetailView({ post, comments, onBack }: PostDetailViewProps) {
  const postComments = comments.filter(c => c.postId === post.id);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [shares, setShares] = useState<ShareDetail[]>([]);
  const [totalReactions, setTotalReactions] = useState(0);
  const [totalShares, setTotalShares] = useState(0);
  const [isLoadingEngagement, setIsLoadingEngagement] = useState(false);
  const [engagementLoaded, setEngagementLoaded] = useState(false);

  useEffect(() => {
    const loadEngagement = async () => {
      setIsLoadingEngagement(true);
      try {
        const response = await api.getPostEngagement(post.id);
        setReactions(response.engagement.reactions);
        setShares(response.engagement.shares);
        setTotalReactions(response.engagement.totalReactions);
        setTotalShares(response.engagement.totalShares);
        setEngagementLoaded(true);
      } catch (e) {
        console.log('Failed to load engagement details:', e);
      } finally {
        setIsLoadingEngagement(false);
      }
    };

    loadEngagement();
  }, [post.id]);

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-slate-400 hover:text-white hover:bg-slate-800/50"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Posts
      </Button>

      {/* Post Content */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardContent className="p-6 space-y-4">
          {post.imageUrl && (
            <img 
              src={post.imageUrl} 
              alt="Post image" 
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          <p className="text-white text-lg">{post.content}</p>
          
          <div className="flex items-center gap-4 pt-4 border-t border-slate-800/50">
            <div className="flex items-center gap-2">
              {post.platforms.map(platform => (
                <div key={platform} className="p-1.5 rounded bg-slate-800/50">
                  <PlatformIcon platform={platform} size={18} />
                </div>
              ))}
            </div>
            <span className="text-slate-500 text-sm">
              {formatRelativeTime(post.createdAt)}
            </span>
            <div className="flex items-center gap-1 text-pink-400 text-sm">
              <Heart className="w-4 h-4" />
              {engagementLoaded ? totalReactions : post.likesCount}
            </div>
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <MessageSquare className="w-4 h-4" />
              {postComments.length}
            </div>
            <div className="flex items-center gap-1 text-blue-400 text-sm">
              <Share2 className="w-4 h-4" />
              {engagementLoaded ? totalShares : post.sharesCount}
            </div>
          </div>

          {/* Post URLs */}
          {post.postUrls && Object.entries(post.postUrls).length > 0 && (
            <div className="flex gap-2 pt-2">
              {Object.entries(post.postUrls).map(([platform, url]) => (
                <Button
                  key={platform}
                  variant="outline"
                  size="sm"
                  className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700/50 hover:text-white"
                  onClick={() => window.open(url, '_blank')}
                >
                  <PlatformIcon platform={platform as any} size={14} />
                  <span className="ml-2">View on {platform}</span>
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reactions Section */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2">
            <Heart className="w-5 h-5 text-pink-400" />
            Reactions
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({engagementLoaded ? totalReactions : post.likesCount} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingEngagement ? (
            <div className="p-8 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading reactions...
            </div>
          ) : reactions.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No reactions on this post yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {reactions.map((reaction, index) => (
                <div
                  key={`${reaction.id}-${index}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-800/20 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={reaction.avatar || undefined} alt={reaction.name} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {reaction.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white">{reaction.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg" title={reaction.type}>
                      {reactionEmojis[reaction.type] || '👍'}
                    </span>
                    <span className="text-xs text-slate-500 capitalize">
                      {reaction.type.toLowerCase()}
                    </span>
                  </div>
                  <div className="p-1 rounded bg-slate-800/50">
                    <PlatformIcon platform={reaction.platform as any} size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shares Section */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-400" />
            Shares
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({engagementLoaded ? totalShares : post.sharesCount} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoadingEngagement ? (
            <div className="p-8 flex items-center justify-center text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading shares...
            </div>
          ) : shares.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No shares on this post yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {shares.map((share, index) => (
                <div
                  key={`${share.id}-${index}`}
                  className="flex items-center gap-3 p-4 hover:bg-slate-800/20 transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={share.avatar || undefined} alt={share.name} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {share.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-white">{share.name}</span>
                  </div>
                  {share.sharedAt && (
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(new Date(share.sharedAt))}
                    </span>
                  )}
                  <div className="p-1 rounded bg-slate-800/50">
                    <PlatformIcon platform={share.platform as any} size={14} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments Section */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            Comments ({postComments.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {postComments.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No comments on this post yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {postComments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-4 p-4">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={comment.commenterAvatar} alt={comment.commenterName} />
                    <AvatarFallback className="bg-slate-700 text-white">
                      {comment.commenterName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white">{comment.commenterName}</span>
                      <div className="p-1 rounded bg-slate-800/50">
                        <PlatformIcon platform={comment.platform} size={12} />
                      </div>
                      <span className="text-xs text-slate-500">
                        {formatRelativeTime(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-300 text-sm">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function RecentPostsList() {
  const { posts, comments } = useApp();
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const sortedPosts = [...posts].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

  if (selectedPost) {
    return (
      <PostDetailView 
        post={selectedPost} 
        comments={comments} 
        onBack={() => setSelectedPost(null)} 
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
          Recent Posts
        </h1>
        <p className="text-slate-400">
          View all published posts and their performance
        </p>
      </div>

      {/* Posts List */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-800/50">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            All Posts
            <span className="text-sm font-normal text-slate-500 ml-2">
              ({posts.length} total)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sortedPosts.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No posts yet. Create your first post to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {sortedPosts.map((post) => {
                const postCommentCount = comments.filter(c => c.postId === post.id).length;
                
                return (
                  <button
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="w-full flex items-start gap-4 p-4 hover:bg-slate-800/20 transition-colors text-left"
                  >
                    {/* Thumbnail */}
                    {post.imageUrl ? (
                      <img 
                        src={post.imageUrl} 
                        alt="" 
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-slate-800/50 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-8 h-8 text-slate-600" />
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-white font-medium line-clamp-2">
                        {truncateText(post.content, 100)}
                      </p>
                      
                      <div className="flex items-center gap-4">
                        {/* Platforms */}
                        <div className="flex items-center gap-1">
                          {post.platforms.map(platform => (
                            <div key={platform} className="p-1 rounded bg-slate-800/50">
                              <PlatformIcon platform={platform} size={14} />
                            </div>
                          ))}
                        </div>

                        {/* Status indicators */}
                        {Object.entries(post.status).map(([platform, status]) => (
                          <span 
                            key={platform}
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              status === 'success' && 'bg-green-500/20 text-green-400',
                              status === 'failed' && 'bg-red-500/20 text-red-400',
                              status === 'pending' && 'bg-yellow-500/20 text-yellow-400'
                            )}
                          >
                            {status}
                          </span>
                        ))}

                        {/* Likes count */}
                        <div className="flex items-center gap-1 text-pink-400 text-sm">
                          <Heart className="w-4 h-4" />
                          {post.likesCount}
                        </div>

                        {/* Comments count */}
                        <div className="flex items-center gap-1 text-slate-500 text-sm">
                          <MessageSquare className="w-4 h-4" />
                          {postCommentCount}
                        </div>

                        {/* Shares count */}
                        <div className="flex items-center gap-1 text-blue-400 text-sm">
                          <Share2 className="w-4 h-4" />
                          {post.sharesCount}
                        </div>

                        {/* Timestamp */}
                        <span className="text-slate-500 text-sm">
                          {formatRelativeTime(post.createdAt)}
                        </span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0 mt-2" />
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
