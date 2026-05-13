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

function PostCard({ post, currentUserId }: { post: CommunityPost; currentUserId?: string }) {
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
      className={`mh-card p-6 space-y-4 border transition-all duration-300 hover:translate-y-[-2px] ${
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
      <p className="font-body text-ink text-sm leading-relaxed">{post.content}</p>

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
        <div className="flex items-center gap-1.5 font-body text-xs font-bold uppercase tracking-wider text-ink-muted">
          <MessageCircle size={16} />
          <span>{post.commentsCount > 0 ? post.commentsCount : 'Discuss'}</span>
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
    <div className="mh-card p-6 border border-border-soft bg-white space-y-4">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border font-body text-xs font-bold transition-all ${
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
            postType === 'pest_alert' ? 'Describe the pest sighting, crop affected, and location...' :
            postType === 'tip' ? 'Share a farming tip or technique with the community...' :
            postType === 'market' ? 'Share market prices, demand info, or buyer contacts...' :
            'Share something with the EcoFarm community...'
          }
          rows={3}
          className="w-full bg-bone-low border border-border-soft text-ink rounded-xl py-3 px-4 outline-none focus:border-forest-tint focus:bg-white transition-all placeholder:text-ink-faint font-body text-sm resize-none shadow-inner"
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
            <span>Add Photo</span>
          </button>

          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="btn-primary py-2 px-5 text-xs"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={14} />
            )}
            <span>Post</span>
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
    if (!supabase) return
    const { data } = await supabase
      .from('community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (data) setPosts(data.map(mapRow))
    setLoading(false)
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
          <h2 className="font-display font-bold text-4xl text-ink tracking-tight">
            Farmer Community
          </h2>
          <p className="font-body text-xs text-ink-muted font-bold tracking-wide">
            {allPosts.length} posts · Live updates
          </p>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2.5 h-2.5 rounded-full bg-safe animate-pulse" />
          <span className="font-body text-xs font-bold text-safe uppercase tracking-wider">Live</span>
        </div>
      </div>

      {/* Composer (auth required) */}
      {user && !user.isGuest ? (
        <PostComposer user={user} onPost={fetchPosts} />
      ) : (
        <div className="mh-card p-6 border border-border-soft bg-bone-low text-center space-y-2">
          <Sparkles size={24} className="text-ochre-light mx-auto" />
          <p className="font-body text-ink-muted text-sm font-bold">Sign in to post, share images, and join the conversation.</p>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-full font-body text-xs font-bold transition-all border ${
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
        <div className="text-center py-16 bg-white rounded-xl border border-border-soft space-y-3">
          <Users size={40} className="text-ink-faint mx-auto" />
          <p className="font-body text-ink-muted text-sm font-bold">No posts yet. Be the first to share!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(post => (
            <PostCard key={post.id} post={post} currentUserId={user?.uid} />
          ))}
        </div>
      )}
    </div>
  )
}
