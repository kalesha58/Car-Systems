import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Pagination } from '@components/Pagination/Pagination';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { Tooltip } from '@components/Tooltip/Tooltip';
import {
  bulkDeleteAdminPosts,
  deleteAdminPost,
  getAdminPostStats,
  getAdminPosts,
} from '@services/postService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { Eye, Heart, MessageCircle, Search, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IAdminPostListItem, IAdminPostStats } from '../../types/post';

const truncateText = (text: string, max = 80) =>
  text.length <= max ? text : `${text.slice(0, max).trim()}…`;

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

export const CommunityFeedListPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [posts, setPosts] = useState<IAdminPostListItem[]>([]);
  const [stats, setStats] = useState<IAdminPostStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; post: IAdminPostListItem | null }>({
    isOpen: false,
    post: null,
  });
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectedPostIds, setSelectedPostIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getAdminPostStats();
      setStats(data);
    } catch {
      // Stats are supplementary; list can still load
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPosts({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      setPosts(response.posts);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching posts:', error);
      showToast(extractErrorMessage(error, 'Failed to load feed posts'), 'error');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, showToast]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    setSelectedPostIds([]);
  }, [currentPage, searchTerm]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }, 300),
    [],
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch],
  );

  const handleDeletePost = async () => {
    if (!deleteModal.post) return;
    try {
      setSubmitting(true);
      await deleteAdminPost(deleteModal.post.id);
      showToast('Post deleted successfully', 'success');
      setDeleteModal({ isOpen: false, post: null });
      fetchPosts();
      fetchStats();
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to delete post'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPostIds.length === 0) return;
    try {
      setSubmitting(true);
      const { deleted, failed } = await bulkDeleteAdminPosts(selectedPostIds);
      setBulkDeleteModalOpen(false);
      setSelectedPostIds([]);

      if (failed === 0) {
        showToast(`${deleted} post${deleted === 1 ? '' : 's'} deleted successfully`, 'success');
      } else if (deleted === 0) {
        showToast('Failed to delete selected posts', 'error');
      } else {
        showToast(`${deleted} deleted, ${failed} failed`, 'warning');
      }

      fetchPosts();
      fetchStats();
    } catch (error) {
      showToast(extractErrorMessage(error, 'Failed to delete selected posts'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'thumbnail',
      header: '',
      sortable: false,
      render: (post: IAdminPostListItem) => {
        const thumb = post.images?.[0];
        return thumb ? (
          <img
            src={thumb}
            alt=""
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.border,
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: theme.borderRadius.md,
              backgroundColor: theme.colors.border,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              color: theme.colors.textSecondary,
            }}
          >
            No img
          </div>
        );
      },
    },
    {
      key: 'author',
      header: 'Author',
      render: (post: IAdminPostListItem) => (
        <div>
          <div style={{ fontWeight: 600 }}>{post.userName || 'Unknown'}</div>
          <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
            {post.userEmail || post.userId}
          </div>
        </div>
      ),
    },
    {
      key: 'text',
      header: 'Caption',
      render: (post: IAdminPostListItem) => (
        <span style={{ color: theme.colors.textSecondary }}>{truncateText(post.text)}</span>
      ),
    },
    {
      key: 'likes',
      header: 'Likes',
      sortable: true,
      sortValue: (post: IAdminPostListItem) => post.likes,
      render: (post: IAdminPostListItem) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Heart size={14} color={theme.colors.textSecondary} />
          {post.likes}
        </span>
      ),
    },
    {
      key: 'commentCount',
      header: 'Comments',
      sortable: true,
      sortValue: (post: IAdminPostListItem) => post.commentCount,
      render: (post: IAdminPostListItem) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <MessageCircle size={14} color={theme.colors.textSecondary} />
          {post.commentCount}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Posted',
      sortable: true,
      sortValue: (post: IAdminPostListItem) => new Date(post.createdAt),
      render: (post: IAdminPostListItem) => formatDate(post.createdAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (post: IAdminPostListItem) => (
        <div className="users-action-buttons">
          <Tooltip text="View">
            <Button
              size="sm"
              variant="outline"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                navigate(`/community/feed/${post.id}`);
              }}
              icon={Eye}
            />
          </Tooltip>
          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, post });
              }}
              icon={Trash2}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  const isEmptyState = !loading && posts.length === 0;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="users-page">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="users-page__hero"
      >
        <div>
          <h1 className="users-page__title">Community Feed</h1>
          <p className="users-page__subtitle">
            View and moderate user feed posts from the mobile app.
          </p>
        </div>
        {stats && (
          <div className="users-page__stats">
            <motion.div className="users-page__stat-card" whileHover={{ scale: 1.02, y: -2 }}>
              <span>Total Posts</span>
              <strong>{stats.totalPosts}</strong>
              <small>All time</small>
            </motion.div>
            <motion.div className="users-page__stat-card users-page__stat-card--active" whileHover={{ scale: 1.02, y: -2 }}>
              <span>Today</span>
              <strong>{stats.postsToday}</strong>
              <small>Posted today</small>
            </motion.div>
            <motion.div className="users-page__stat-card" whileHover={{ scale: 1.02, y: -2 }}>
              <span>This Week</span>
              <strong>{stats.postsThisWeek}</strong>
              <small>Last 7 days</small>
            </motion.div>
            <motion.div className="users-page__stat-card" whileHover={{ scale: 1.02, y: -2 }}>
              <span>Total Likes</span>
              <strong>{stats.totalLikes}</strong>
              <small>Across all posts</small>
            </motion.div>
            <motion.div className="users-page__stat-card" whileHover={{ scale: 1.02, y: -2 }}>
              <span>Total Comments</span>
              <strong>{stats.totalComments}</strong>
              <small>Across all posts</small>
            </motion.div>
          </div>
        )}
      </motion.div>

      <div className="users-page__breadcrumbs">
        <Breadcrumbs />
      </div>

      <Card className="users-card">
        <div className="users-toolbar">
          <div className="users-toolbar__row users-toolbar__row--main">
            <div className="users-toolbar__field users-toolbar__field--search">
              <div className="users-toolbar__input-wrapper">
                <Input
                  placeholder="Search by caption, author name, or email"
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              {selectedPostIds.length > 0 && (
                <div className="users-toolbar__button">
                  <Button
                    variant="danger"
                    onClick={() => setBulkDeleteModalOpen(true)}
                    icon={Trash2}
                  >
                    Delete Selected ({selectedPostIds.length})
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="users-table-wrapper">
          {loading ? (
            <SkeletonTable rows={5} columns={columns.length} />
          ) : isEmptyState ? (
            <div className="users-empty-state">
              <h3>No posts found</h3>
              <p>Try adjusting your search or check back when users start posting.</p>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={posts}
                  onRowClick={(post) => navigate(`/community/feed/${post.id}`)}
                  selectable
                  selectedIds={selectedPostIds}
                  onSelectedIdsChange={setSelectedPostIds}
                />
              </div>
              {totalItems > 0 && (
                <div className="users-pagination">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    onItemsPerPageChange={() => {}}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </Card>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !submitting && setDeleteModal({ isOpen: false, post: null })}
        onConfirm={handleDeletePost}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />

      <ConfirmModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => !submitting && setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Posts"
        message={`Are you sure you want to delete ${selectedPostIds.length} selected post${selectedPostIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete All'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};
