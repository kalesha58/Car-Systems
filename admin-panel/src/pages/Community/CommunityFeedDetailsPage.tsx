import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { SkeletonCard } from '@components/Skeleton';
import { deleteAdminPost, getAdminPostById } from '@services/postService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { ArrowLeft, Heart, MapPin, MessageCircle, Trash2, User } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { IAdminPostDetail } from '../../types/post';

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const CommunityFeedDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [post, setPost] = useState<IAdminPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await getAdminPostById(id);
      setPost(data);
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to load post'), 'error');
      navigate('/community/feed');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, showToast]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleDelete = async () => {
    if (!post) return;
    try {
      setSubmitting(true);
      await deleteAdminPost(post.id);
      showToast('Post deleted successfully', 'success');
      navigate('/community/feed');
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to delete post'), 'error');
    } finally {
      setSubmitting(false);
      setDeleteModalOpen(false);
    }
  };

  const cardStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    boxShadow: theme.shadows.md,
    border: `1px solid ${theme.colors.border}`,
  };

  if (loading) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Breadcrumbs />
        <div style={{ display: 'grid', gap: theme.spacing.md, marginTop: theme.spacing.md }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: theme.spacing.lg }}>
        <Breadcrumbs />
        <Card style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
          <p>Post not found</p>
          <Button variant="outline" onClick={() => navigate('/community/feed')} style={{ marginTop: 12 }}>
            Back to Feed
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: theme.spacing.lg }}>
      <Breadcrumbs />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: theme.spacing.md,
          marginBottom: theme.spacing.lg,
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}
      >
        <Button variant="outline" onClick={() => navigate('/community/feed')} icon={ArrowLeft}>
          Back to Feed
        </Button>
        <Button variant="danger" onClick={() => setDeleteModalOpen(true)} icon={Trash2}>
          Delete Post
        </Button>
      </div>

      <div style={{ display: 'grid', gap: theme.spacing.lg }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, marginBottom: theme.spacing.md }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                backgroundColor: theme.colors.primary + '20',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <User size={24} color={theme.colors.primary} />
            </div>
            <div>
              <Link
                to={`/users/${post.userId}`}
                style={{ fontWeight: 600, color: theme.colors.primary, textDecoration: 'none' }}
              >
                {post.userName || 'Unknown user'}
              </Link>
              {post.userEmail && (
                <div style={{ fontSize: '0.875rem', color: theme.colors.textSecondary }}>{post.userEmail}</div>
              )}
            </div>
          </div>

          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, marginBottom: theme.spacing.md }}>{post.text}</p>

          {post.images.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: theme.spacing.sm,
                marginBottom: theme.spacing.md,
              }}
            >
              {post.images.map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setLightboxImage(url)}
                  style={{
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    borderRadius: theme.borderRadius.md,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }}
                  />
                </button>
              ))}
            </div>
          )}

          {post.video && (
            <video
              src={post.video}
              controls
              style={{ width: '100%', maxWidth: 480, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md }}
            />
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.lg, color: theme.colors.textSecondary, fontSize: '0.875rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Heart size={16} />
              {post.likes} likes
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <MessageCircle size={16} />
              {post.commentCount} comments
            </span>
            <span>Posted {formatDate(post.createdAt)}</span>
            {post.updatedAt && <span>Updated {formatDate(post.updatedAt)}</span>}
          </div>

          {post.location && (
            <div
              style={{
                marginTop: theme.spacing.md,
                padding: theme.spacing.md,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.background,
                display: 'flex',
                alignItems: 'flex-start',
                gap: theme.spacing.sm,
                fontSize: '0.875rem',
              }}
            >
              <MapPin size={16} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                {post.location.address || `${post.location.latitude}, ${post.location.longitude}`}
              </div>
            </div>
          )}
        </div>

        {post.comments.length > 0 && (
          <div style={cardStyle}>
            <h3 style={{ margin: 0, marginBottom: theme.spacing.md }}>Comments ({post.comments.length})</h3>
            <div style={{ display: 'grid', gap: theme.spacing.md }}>
              {post.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    padding: theme.spacing.md,
                    borderRadius: theme.borderRadius.md,
                    backgroundColor: theme.colors.background,
                    border: `1px solid ${theme.colors.border}`,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{comment.userName || comment.userId}</div>
                  <p style={{ margin: '0 0 8px', whiteSpace: 'pre-wrap' }}>{comment.text}</p>
                  <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary, display: 'flex', gap: 12 }}>
                    <span>{comment.likes} likes</span>
                    <span>{formatDate(comment.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxImage && (
        <div
          role="presentation"
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: theme.spacing.lg,
          }}
        >
          <img
            src={lightboxImage}
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => !submitting && setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};
