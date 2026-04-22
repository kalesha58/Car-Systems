import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { Tooltip } from '@components/Tooltip/Tooltip';
import { createCategory, deleteCategory, getCategories, type ICategory as ICategoryFromService, updateCategory } from '@services/categoryService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { 
  Lightbulb,
  Search, 
  Trash2, 
  UserPlus
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { ICategory, ICategoryFormData } from '../../types/category';

export const CategoriesPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [, setAllCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; category: ICategory | null }>({
    isOpen: false,
    category: null,
  });
  const [formData, setFormData] = useState<ICategoryFormData>({
    name: '',
    description: '',
    status: 'active',
  });
  const [errors, setErrors] = useState<Partial<ICategoryFormData>>({});
  const [submitting, setSubmitting] = useState(false);
  const [statusSummary, setStatusSummary] = useState({ 
    total: 0, 
    active: 0, 
    inactive: 0 
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchCategories = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const response = await getCategories({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });
      // Map API response to ICategory format
      const mappedCategories: ICategory[] = response.categories.map((cat: ICategoryFromService) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        status: cat.status,
        productCount: cat.products || 0,
        createdDate: cat.createdAt || new Date().toISOString(),
      }));
      setAllCategories(mappedCategories);

      // Calculate status summary
      const activeCount = mappedCategories.filter(c => c.status === 'active').length;
      const inactiveCount = mappedCategories.filter(c => c.status === 'inactive').length;
      setStatusSummary({
        total: mappedCategories.length,
        active: activeCount,
        inactive: inactiveCount,
      });

      // Client-side pagination
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedCategories = mappedCategories.slice(startIndex, endIndex);
      setCategories(paginatedCategories);
      setTotalItems(mappedCategories.length);
      setTotalPages(Math.ceil(mappedCategories.length / itemsPerPage));
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching categories:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load categories');
        showToast(errorMessage, 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [searchTerm, statusFilter, currentPage, itemsPerPage, showToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
      }, 300),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInputValue(value);
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`,
      });
    }
    return filters;
  }, [searchInputValue, statusFilter]);

  const handleClearFilter = useCallback((key: string) => {
    if (key === 'search') {
      setSearchInputValue('');
      setSearchTerm('');
      setCurrentPage(1);
    }
    if (key === 'status') {
      setStatusFilter('all');
      setCurrentPage(1);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchTerm('');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  const handleOpenModal = (category?: ICategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description,
        status: category.status,
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        status: 'active',
      });
    }
    setErrors({});
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      status: 'active',
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ICategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });
        showToast('Category updated successfully', 'success');
      } else {
        await createCategory({
          name: formData.name,
          description: formData.description,
          status: formData.status,
        });
        showToast('Category created successfully', 'success');
      }
      handleCloseModal();
      fetchCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      showToast(editingCategory ? 'Failed to update category' : 'Failed to create category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.category) return;

    try {
      setSubmitting(true);
      await deleteCategory(deleteModal.category.id);
      showToast('Category deleted successfully', 'success');
      setDeleteModal({ isOpen: false, category: null });
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      showToast('Failed to delete category', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isEmptyState = !loading && categories.length === 0;

  const columns = [
    { 
      key: 'name', 
      header: 'Name',
      sortable: true,
    },
    { 
      key: 'description', 
      header: 'Description',
      sortable: true,
      render: (category: ICategory) => (
        <span style={{ 
          maxWidth: '300px', 
          display: 'block', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap' 
        }}>
          {category.description || 'N/A'}
        </span>
      ),
    },
    {
      key: 'productCount',
      header: 'Products',
      sortable: true,
      render: (category: ICategory) => category.productCount || 0,
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (category: ICategory) => (
        <div className="users-action-buttons">

          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, category });
              }}
              icon={Trash2}
            />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="users-page"
    >
      {/* Hero Section with Title and Stats */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="users-page__hero"
      >
        <div>
          <h1 className="users-page__title">Categories</h1>
          <p className="users-page__subtitle">
            View and manage all product categories, organize inventory, and maintain catalog structure from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Categories</span>
            <strong>{statusSummary.total}</strong>
            <small>Categories This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Active Categories</span>
            <strong>{statusSummary.active}</strong>
            <small>In use</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Inactive Categories</span>
            <strong>{statusSummary.inactive}</strong>
            <small>Need attention</small>
          </motion.div>
        </div>
      </motion.div>

      <div className="users-page__breadcrumbs">
        <Breadcrumbs />
      </div>

      <Card className="users-card">
        {/* Action Bar */}
        <div className="users-toolbar">
          <div className="users-toolbar__row users-toolbar__row--main">
            <div className="users-toolbar__field users-toolbar__field--search">
              <div className="users-toolbar__input-wrapper">
                <Input
                  placeholder="Search categories"
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={statusFilter}
                  onChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Status"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'active', label: 'Active' },
                    { value: 'inactive', label: 'Inactive' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__button">
                <Button
                  onClick={() => handleOpenModal()}
                  icon={UserPlus}
                >
                  Add Category
                </Button>
              </div>
            </div>
          </div>
          <div className="users-toolbar__row users-toolbar__row--chips">
            <div className="users-toolbar__chips">
              {activeFilters.length ? (
                activeFilters.map((filter) => (
                  <button
                    key={filter.key}
                    className="users-filter-chip"
                    type="button"
                    onClick={() => handleClearFilter(filter.key)}
                  >
                    <span>{filter.label}</span>
                    <span aria-hidden="true">×</span>
                  </button>
                ))
              ) : (
                <span className="users-toolbar__chips-placeholder">
                  <Lightbulb size={14} style={{ marginRight: '6px', display: 'inline-block', verticalAlign: 'middle' }} />
                  Tip: Combine search + filters for precise segments.
                </span>
              )}
            </div>
            {activeFilters.length > 0 && (
              <div className="users-toolbar__chips-actions">
                <button type="button" onClick={handleClearAllFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="users-table-wrapper">
          {loading ? (
            <SkeletonTable rows={5} columns={columns.length} />
          ) : isEmptyState ? (
            <div className="users-empty-state">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="users-empty-state__illustration"
              >
                <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="20" width="140" height="80" rx="16" fill="#F2F4F7" />
                  <rect x="25" y="40" width="110" height="10" rx="5" fill="#E0E7FF" />
                  <rect x="25" y="60" width="78" height="10" rx="5" fill="#DBEAFE" />
                  <circle cx="120" cy="85" r="12" fill="#DBEAFE" />
                  <path d="M115 85l3 4 7-8" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </motion.div>
              <h3>No categories found</h3>
              <p>It looks a little quiet here. Adjust filters or add a new record to get things moving.</p>
              <div className="users-empty-state__tip">
                <Lightbulb size={16} />
                <span>Tip: Combine search + filters for precise segments.</span>
              </div>
              <div className="users-empty-state__actions">
                <div className="users-empty-state__cta users-empty-state__cta--ghost">
                  <Button
                    variant="outline"
                    onClick={handleClearAllFilters}
                  >
                    Reset filters
                  </Button>
                </div>
                <div className="users-empty-state__cta">
                  <Button
                    onClick={() => handleOpenModal()}
                    icon={UserPlus}
                  >
                    Add your first category
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table columns={columns} data={categories} />
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

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <div>
          <Input
            label="Category Name"
            value={formData.name}
            onChange={(value) => {
              setFormData({ ...formData, name: value });
              setErrors({ ...errors, name: undefined });
            }}
            placeholder="Enter category name"
            error={errors.name}
            required
          />

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Description <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: undefined });
              }}
              placeholder="Enter category description"
              rows={3}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${errors.description ? theme.colors.error : theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
            {errors.description && (
              <div
                style={{
                  marginTop: theme.spacing.xs,
                  color: theme.colors.error,
                  fontSize: '0.875rem',
                }}
              >
                {errors.description}
              </div>
            )}
          </div>

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Status
            </label>
            <Select
              value={formData.status}
              onChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as 'active' | 'inactive',
                })
              }
              placeholder="Select status"
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ]}
            />
          </div>

          <div
            style={{
              display: 'flex',
              gap: theme.spacing.md,
              justifyContent: 'flex-end',
            }}
          >
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !submitting && setDeleteModal({ isOpen: false, category: null })}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteModal.category?.name}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};
