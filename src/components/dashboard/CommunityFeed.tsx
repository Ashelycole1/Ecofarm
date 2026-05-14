/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/exhaustive-deps */
'use client'

import { useState, useEffect, useRef } from 'react'
import { useApp } from '@/context/AppContext'
import { getSupabase } from '@/lib/supabaseClient'
import {
  Send, Image as ImageIcon, X, Heart, MessageCircle,
  AlertTriangle, Leaf, User, MoreVertical, Bug, Sparkles,
  TrendingUp, Users, Pin
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CommunityPost {
  id: string
  userId: string
  authorName: string
  authorAvatar?: string
  authorRole: string
  content: string
  imageUrl?: string
  postType: 'general' | 'pest_alert' | 'tip' | 'market'
  pestSeverity?: 'low' | 'medium' | 'high'
  likes: number
  likedBy: string[]
  commentsCount: number
  createdAt: string
}

// ─── Severity Config ───────────────────────────────────────────────────────────

const postTypeConfig = {
  pest_alert: { label: 'Pest Alert', color: 'text-alert', bg: 'bg-alert-container', border: 'border-alert/30', Icon: Bug },
  tip: { label: 'Farming Tip', color: 'text-safe', bg: 'bg-safe/10', border: 'border-safe/30', Icon: Leaf },
  market: { label: 'Market Info', color: 'text-sienna', bg: 'bg-sienna-pale', border: 'border-sienna/30', Icon: TrendingUp },
  general: { label: 'Community', color: 'text-ink-muted', bg: 'bg-bone-low', border: 'border-border-soft', Icon: Users },
}

const severityBorder = { low: 'border-safe/40', medium: 'border-warn/40', high: 'border-alert/50' }
const severityLabel = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' }
const severityColor = { low: 'text-safe', medium: 'text-warn', high: 'text-alert' }

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ─── Post Card ─────────────────────────────────────────────────────────────────

// ─── Post Card ─────────────────────────────────────────────────────────────────

function PostCard({ 
  post, 
  currentUserId, 
  onDiscuss 
}: { 
  post: CommunityPost; 
  currentUserId?: string;
  onDiscuss: (post: CommunityPost) => void;
}) {
  const [liked, setLiked] = useState(currentUserId ? post.likedBy.includes(currentUserId) : false)
  const [likesCount, setLikesCount] = useState(post.likes)

  const cfg = postTypeConfig[post.postType]
  const Icon = cfg.Icon

  const handleLike = async () => {
    const supabase = getSupabase()
    if (!supabase || !currentUserId) return
    const newLiked = !liked
    const newLikedBy = newLiked
      ? [...post.likedBy, currentUserId]
      : post.likedBy.filter(id => id !== currentUserId)
    setLiked(newLiked)
    setLikesCount(prev => prev + (newLiked ? 1 : -1))
    await supabase.from('community_posts').update({
      likes: newLiked ? likesCount + 1 : likesCount - 1,
      liked_by: newLikedBy
    }).eq('id', post.id)
  }

  const isPestAlert = post.postType === 'pest_alert'
  const severity = post.pestSeverity

  return (
    <div
      className={`mh-card p-5 md:p-6 space-y-4 border transition-all duration-300 hover:translate-y-[-2px] ${
        isPestAlert && severity
          ? severityBorder[severity]
          : cfg.border
      } bg-white`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {post.authorAvatar ? (
            <img
              src={post.authorAvatar}
              alt={post.authorName}
              className="w-10 h-10 rounded-2xl object-cover border border-border-soft"
            />
          ) : (
            <div className="w-10 h-10 rounded-2xl bg-forest-medium/10 border border-forest-medium/20 flex items-center justify-center">
              <User size={18} className="text-forest" />
            </div>
          )}
          <div>
            <p className="font-display font-bold text-ink text-base leading-tight">{post.authorName}</p>
            <p className="font-body text-[10px] text-ink-muted uppercase tracking-wider font-semibold mt-0.5">
              {post.authorRole} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </div>

        {/* Post type badge */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${cfg.border} ${cfg.bg} shrink-0`}>
          <Icon size={12} className={cfg.color} />
          <span className={`font-body text-[9px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
          {isPestAlert && severity && (
            <span className={`font-body text-[9px] font-bold uppercase ${severityColor[severity]}`}>
              · {severityLabel[severity]}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="font-body text-ink text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>

      {/* Image */}
      {post.imageUrl && (
        <div className="rounded-xl overflow-hidden border border-border-soft bg-bone-low">
          <img
            src={post.imageUrl}
            alt="Post image"
            className="w-full max-h-80 object-cover"
          />
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center gap-6 pt-3 border-t border-bone-dim/40">
        <button
          onClick={handleLike}
          disabled={!currentUserId}
          className={`flex items-center gap-1.5 font-body text-xs font-bold uppercase tracking-wider transition-all ${
            liked ? 'text-alert' : 'text-ink-muted hover:text-ink'
          } disabled:cursor-default`}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
          <span>{likesCount > 0 ? likesCount : 'Like'}</span>
        </button>
        <button
          onClick={() => onDiscuss(post)}
          className="flex items-center gap-1.5 font-body text-xs font-bold uppercase tracking-wider text-ink-muted hover:text-forest transition-colors"
        >
          <MessageCircle size={16} />
          <span>{post.commentsCount > 0 ? `${post.commentsCount} Discuss` : 'Discuss'}</span>
        </button>
      </div>
    </div>
  )
}

// ─── Comments Modal ───────────────────────────────────────────────────────────

function DiscussionModal({ 
  post, 
  user, 
  onClose 
}: { 
  post: CommunityPost; 
  user: any; 
  onClose: () => void 
}) {
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = getSupabase()

  const fetchComments = async () => {
    if (!supabase) return
    const { data } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', post.id)
      .order('created_at', { ascending: true })
    if (data) setComments(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
    if (!supabase) return
    const channel = supabase
      .channel(`comments_${post.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_comments', filter: `post_id=eq.${post.id}` }, fetchComments)
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [post.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user || submitting || !supabase) return
    setSubmitting(true)
    try {
      const { error } = await supabase.from('community_comments').insert([{
        post_id: post.id,
        user_id: user.uid,
        author_name: user.displayName || 'Farmer',
        author_avatar: user.photoURL || null,
        content: newComment.trim()
      }])
      if (error) throw error
      setNewComment('')
      fetchComments()
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-ink/40 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white w-full max-w-xl max-h-[90vh] rounded-3xl shadow-modal overflow-hidden flex flex-col border border-border-soft animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-border-soft flex items-center justify-between bg-bone-low">
          <div className="flex items-center gap-3">
            <MessageCircle size={20} className="text-forest" />
            <h3 className="font-display font-bold text-lg text-ink">Discussion</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-ink-muted hover:bg-bone-dim/20 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Post Preview */}
        <div className="p-5 bg-bone-low/30 border-b border-border-soft">
          <p className="font-body text-xs text-ink-muted italic line-clamp-2">
            &quot;{post.content}&quot;
          </p>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white scrollbar-hide">
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map(i => <div key={i} className="h-16 rounded-xl bg-bone-low animate-pulse" />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center space-y-2 opacity-40">
              <MessageCircle size={32} className="mx-auto text-ink-faint" />
              <p className="font-body text-xs font-bold uppercase tracking-wider">No comments yet</p>
            </div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                {c.author_avatar ? (
                  <img src={c.author_avatar} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-forest/10 flex items-center justify-center text-forest shrink-0">
                    <User size={14} />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-display font-bold text-ink text-sm">{c.author_name}</span>
                    <span className="font-body text-[9px] text-ink-muted uppercase font-bold">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="font-body text-sm text-ink leading-relaxed">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-5 border-t border-border-soft bg-white">
          {user && !user.isGuest ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input 
                type="text"
                value={newComment}
                onChange={e => setNewComment(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 bg-bone-low border border-border-soft rounded-xl px-4 py-3 font-body text-sm outline-none focus:border-forest transition-all"
              />
              <button 
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="btn-primary p-3 rounded-xl shrink-0"
              >
                {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send size={16} />}
              </button>
            </form>
          ) : (
            <p className="text-center font-body text-[10px] font-bold text-ink-muted uppercase tracking-widest py-2">
              Sign in to join the discussion
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Composer ──────────────────────────────────────────────────────────────────

function PostComposer({ user, onPost }: { user: any; onPost: () => void }) {
  const [content, setContent] = useState('')
  const [postType, setPostType] = useState<CommunityPost['postType']>('general')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    setLoading(true)
    setError('')
    const supabase = getSupabase()
    if (!supabase) { setLoading(false); return }

    try {
      let imageUrl: string | null = null

      if (imageFile) {
        const ext = imageFile.name.split('.').pop()
        const path = `community/${user.uid}_${Date.now()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(path, imageFile, { upsert: true })
        if (!uploadError) {
          const { data: urlData } = supabase.storage.from('community-images').getPublicUrl(path)
          imageUrl = urlData.publicUrl
        }
      }

      const { error: insertError } = await supabase.from('community_posts').insert([{
        user_id: user.uid,
        author_name: user.displayName || 'Farmer',
        author_avatar: user.photoURL || null,
        author_role: user.role || 'farmer',
        content: content.trim(),
        image_url: imageUrl,
        post_type: postType,
        likes: 0,
        liked_by: [],
        comments_count: 0,
        created_at: new Date().toISOString()
      }])

      if (insertError) throw insertError

      setContent('')
      setImageFile(null)
      setImagePreview(null)
      setPostType('general')
      onPost()
    } catch (err: any) {
      setError(err.message || 'Failed to post. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const typeOptions: { id: CommunityPost['postType']; label: string; Icon: any }[] = [
    { id: 'general', label: 'General', Icon: Users },
    { id: 'tip', label: 'Tip', Icon: Leaf },
    { id: 'market', label: 'Market', Icon: TrendingUp },
    { id: 'pest_alert', label: 'Alert', Icon: Bug },
  ]

  return (
    <div className="mh-card p-5 md:p-6 border border-border-soft bg-white space-y-4">
      <div className="flex items-center gap-3">
        {user.photoURL ? (
          <img src={user.photoURL} alt={user.displayName} className="w-10 h-10 rounded-2xl object-cover border border-border-soft" />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-forest/10 border border-forest/20 flex items-center justify-center">
            <User size={18} className="text-forest" />
          </div>
        )}
        <p className="font-display font-bold text-ink text-base">{user.displayName || 'Farmer'}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Type selector */}
        <div className="flex gap-2 flex-wrap">
          {typeOptions.map(({ id, label, Icon }) => {
            const cfg = postTypeConfig[id]
            return (
              <button
                key={id}
                type="button"
                onClick={() => setPostType(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-[10px] md:text-xs font-bold transition-all ${
                  postType === id
                    ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
                    : 'border-border-soft text-ink-muted hover:text-ink bg-bone-low'
                }`}
              >
                <Icon size={12} />
                {label}
              </button>
            )
          })}
        </div>

        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={
            postType === 'pest_alert' ? 'Describe the pest sighting...' :
            postType === 'tip' ? 'Share a farming tip...' :
            postType === 'market' ? 'Share market prices...' :
            'Share something with the community...'
          }
          rows={3}
          className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 px-4 outline-none focus:border-forest transition-all placeholder:text-ink-faint font-body text-sm resize-none"
        />

        {imagePreview && (
          <div className="relative rounded-xl overflow-hidden border border-border-soft bg-bone-low">
            <img src={imagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
            <button
              type="button"
              onClick={() => { setImageFile(null); setImagePreview(null) }}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-ink/80 flex items-center justify-center text-white hover:bg-ink transition-all"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <p className="text-alert font-body text-xs font-bold text-center">{error}</p>
        )}

        <div className="flex items-center justify-between pt-1">
          <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImage} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-ink-muted hover:text-forest font-body text-xs font-bold transition-all"
          >
            <ImageIcon size={16} />
            <span className="hidden sm:inline">Add Photo</span>
          </button>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-primary py-2 px-5 text-xs"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={14} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Main Community Feed ───────────────────────────────────────────────────────

export default function CommunityFeed() {
  const { user, pestAlerts } = useApp()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | CommunityPost['postType']>('all')
  const [activeDiscussion, setActiveDiscussion] = useState<CommunityPost | null>(null)
  const supabase = getSupabase()

  const mapRow = (row: any): CommunityPost => ({
    id: row.id,
    userId: row.user_id,
    authorName: row.author_name || 'Farmer',
    authorAvatar: row.author_avatar || undefined,
    authorRole: row.author_role || 'farmer',
    content: row.content,
    imageUrl: row.image_url || undefined,
    postType: row.post_type || 'general',
    pestSeverity: row.pest_severity || undefined,
    likes: row.likes || 0,
    likedBy: row.liked_by || [],
    commentsCount: row.comments_count || 0,
    createdAt: row.created_at,
  })

  const fetchPosts = async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)
      
      if (error) throw error
      if (data) setPosts(data.map(mapRow))
    } catch (err) {
      console.error("[Community] Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
    if (!supabase) return
    const channel = supabase
      .channel('community_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'community_posts' }, fetchPosts)
      .subscribe()
    return () => { channel.unsubscribe() }
  }, [])

  const alertPosts: CommunityPost[] = pestAlerts.map(a => ({
    id: `alert-${a.id}`,
    userId: 'system',
    authorName: a.reporterName || 'EcoFarm Alert System',
    authorAvatar: undefined,
    authorRole: 'farmer',
    content: `${a.description} Affected crops: ${a.affectedCrops.join(', ')}. Recommended action: ${a.action}`,
    imageUrl: undefined,
    postType: 'pest_alert',
    pestSeverity: a.severity,
    likes: 0,
    likedBy: [],
    commentsCount: 0,
    createdAt: new Date(a.lastReported).toISOString(),
  }))

  const allPosts = [...alertPosts, ...posts]
  const filtered = filter === 'all' ? allPosts : allPosts.filter(p => p.postType === filter)

  const filterTabs: { id: 'all' | CommunityPost['postType']; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'pest_alert', label: 'Pest Alerts' },
    { id: 'tip', label: 'Tips' },
    { id: 'market', label: 'Market' },
    { id: 'general', label: 'General' },
  ]

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex items-end justify-between px-1 border-b border-border-soft pb-4">
        <div className="space-y-1">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-ink tracking-tight">
            Farmer Community
          </h2>
          <p className="font-body text-[10px] text-ink-muted font-bold tracking-wide uppercase">
            {allPosts.length} posts · Live updates
          </p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
          <span className="font-body text-[10px] font-bold text-safe uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Composer (auth required) */}
      {user && !user.isGuest ? (
        <PostComposer user={user} onPost={fetchPosts} />
      ) : (
        <div className="mh-card p-6 border border-border-soft bg-bone-low text-center space-y-2">
          <Sparkles size={24} className="text-ochre-light mx-auto" />
          <p className="font-body text-ink-muted text-xs font-bold uppercase tracking-wider">Sign in to join the conversation</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide no-scrollbar -mx-1 px-1">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full font-body text-[10px] md:text-xs font-bold transition-all border whitespace-nowrap uppercase tracking-wider ${
              filter === tab.id
                ? 'bg-forest text-white border-forest shadow-sm'
                : 'bg-white text-ink-muted hover:text-ink border-border-soft shadow-card-sm'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-48 rounded-xl bg-bone-card animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-border-soft space-y-3">
          <Users size={40} className="text-ink-faint mx-auto opacity-20" />
          <p className="font-body text-ink-muted text-xs font-bold uppercase tracking-widest">No posts yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {filtered.map(post => (
            <PostCard 
              key={post.id} 
              post={post} 
              currentUserId={user?.uid} 
              onDiscuss={(p) => setActiveDiscussion(p)}
            />
          ))}
        </div>
      )}

      {/* Discussion Modal */}
      {activeDiscussion && (
        <DiscussionModal 
          post={activeDiscussion} 
          user={user} 
          onClose={() => setActiveDiscussion(null)} 
        />
      )}
    </div>
  )
}
