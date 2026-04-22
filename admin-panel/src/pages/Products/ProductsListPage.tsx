import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { Tooltip } from '@components/Tooltip/Tooltip';
import { deleteProduct, getProducts } from '@services/productService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { 
  Lightbulb,
  Package,
  Search, 
  Trash2, 
  UserPlus
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IProduct } from '../../types/product';

export const ProductsListPage = () => {
  const navigate = useNavigate();
  useTheme();
  const { showToast } = useToastStore();
  const [products, setProducts] = useState<IProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: IProduct | null }>({
    isOpen: false,
    product: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [statusSummary, setStatusSummary] = useState({ 
    total: 0, 
    active: 0, 
    lowStock: 0, 
    outOfStock: 0 
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchProducts = useCallback(async () => {
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
      const response = await getProducts(
        {
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm.trim() || undefined,
          category: categoryFilter !== 'all' ? categoryFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        abortControllerRef.current.signal
      );
      // Map API response to IProduct format
      const mappedProducts: IProduct[] = response.products.map((product) => ({
        ...product,
        category: (product as any).category || product.category,
        image: (product as any).images?.[0] || product.image || '',
        createdDate: (product as any).createdAt || product.createdDate,
      }));
      setProducts(mappedProducts);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);

      // Calculate status summary
      const activeCount = mappedProducts.filter(p => p.status === 'active').length;
      const lowStockCount = mappedProducts.filter(p => p.stock > 0 && p.stock < 50).length;
      const outOfStockCount = mappedProducts.filter(p => p.stock === 0 || p.status === 'out_of_stock').length;
      setStatusSummary({
        total: mappedProducts.length,
        active: activeCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      });

      // Extract unique categories from products response
      // Check if categories are in the response directly
      if ((response as any).categories && Array.isArray((response as any).categories)) {
        const uniqueCategories = (response as any).categories.map((cat: any) => ({
          id: cat.id || cat._id || cat.name,
          name: cat.name,
        }));
        setCategories(uniqueCategories);
      } else {
        // Extract unique categories from products
        const categoryMap = new Map<string, string>();
        mappedProducts.forEach((product) => {
          const categoryValue = product.category;
          if (categoryValue) {
            // If category is an object with id and name
            if (typeof categoryValue === 'object' && categoryValue !== null) {
              const catId = (categoryValue as any).id || (categoryValue as any)._id || '';
              const catName = (categoryValue as any).name || '';
              if (catId && catName) {
                categoryMap.set(catId, catName);
              }
            } else if (typeof categoryValue === 'string') {
              // If category is just a string (name or ID), use it as both
              if (!categoryMap.has(categoryValue)) {
                categoryMap.set(categoryValue, categoryValue);
              }
            }
          }
        });
        const uniqueCategories = Array.from(categoryMap.entries()).map(([id, name]) => ({
          id,
          name,
        }));
        setCategories(uniqueCategories);
      }
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching products:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load products');
        showToast(errorMessage, 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, categoryFilter, statusFilter, showToast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

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

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [categoryFilter, statusFilter]);

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteModal.product) return;

    try {
      setSubmitting(true);
      await deleteProduct(deleteModal.product.id);
      showToast('Product deleted successfully', 'success');
      setDeleteModal({ isOpen: false, product: null });
      fetchProducts();
    } catch (error: unknown) {
      console.error('Error deleting product:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to delete product');
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (categoryFilter !== 'all') {
      const category = categories.find(cat => cat.id === categoryFilter);
      filters.push({
        key: 'category',
        label: `Category: ${category?.name || categoryFilter}`,
      });
    }
    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')}`,
      });
    }
    return filters;
  }, [searchInputValue, categoryFilter, statusFilter, categories]);

  const handleClearFilter = useCallback((key: string) => {
    if (key === 'search') {
      setSearchInputValue('');
      setSearchTerm('');
      setCurrentPage(1);
    }
    if (key === 'category') {
      setCategoryFilter('all');
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
    setCategoryFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  const isEmptyState = !loading && products.length === 0;

  const columns = [
    {
      key: 'image',
      header: 'Image',
      sortable: false,
      render: (product: IProduct) => (
        <div className="users-product-image">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50"%3E%3Crect width="50" height="50" fill="%23E5E7EB"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239CA3AF" font-size="12"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="users-product-image-placeholder">
              <Package size={20} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (product: IProduct) => {
        // If category is an ID, try to find the category name
        if (typeof product.category === 'string' && product.category.length > 20) {
          // Likely an ID, find the category name
          const category = categories.find((cat) => cat.id === product.category);
          return category ? category.name : product.category;
        }
        // If it's already a name, display it
        return product.category || 'N/A';
      },
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      sortValue: (product: IProduct) => product.price,
      render: (product: IProduct) => `₹${product.price.toFixed(2)}`,
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      sortValue: (product: IProduct) => product.stock,
      render: (product: IProduct) => {
        const stockClass = product.stock === 0
          ? 'users-stock-badge--out'
          : product.stock < 50
          ? 'users-stock-badge--low'
          : 'users-stock-badge--ok';
        return (
          <span className={`users-stock-badge ${stockClass}`}>
            {product.stock}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (product: IProduct) => product.status,
      render: (product: IProduct) => {
        const statusClass = product.status === 'active'
          ? 'users-status-badge--active'
          : product.status === 'out_of_stock'
          ? 'users-status-badge--inactive'
          : 'users-status-badge--inactive';
        return (
          <span className={`users-status-badge ${statusClass}`}>
            {product.status === 'out_of_stock' ? 'Out of Stock' : product.status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (product: IProduct) => (
        <div className="users-action-buttons">

          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, product });
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
          <h1 className="users-page__title">Products</h1>
          <p className="users-page__subtitle">
            View and manage all products, inventory, and pricing from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Products</span>
            <strong>{statusSummary.total}</strong>
            <small>Products This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Active Products</span>
            <strong>{statusSummary.active}</strong>
            <small>In stock</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--warning"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Low Stock</span>
            <strong>{statusSummary.lowStock}</strong>
            <small>Need restock</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Out of Stock</span>
            <strong>{statusSummary.outOfStock}</strong>
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
                  placeholder="Search products"
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={categoryFilter}
                  onChange={(value) => {
                    setCategoryFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Types"
                  searchable={categories.length > 5}
                  options={[
                    { value: 'all', label: 'All Types' },
                    ...categories.map((cat) => ({
                      value: cat.id,
                      label: cat.name,
                    })),
                  ]}
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
                    { value: 'out_of_stock', label: 'Out of Stock' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__button">
                <Button
                  onClick={() => navigate('/products/new')}
                  icon={UserPlus}
                >
                  Add Product
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
              <h3>No products found</h3>
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
                    onClick={() => navigate('/products/new')}
                    icon={UserPlus}
                  >
                    Add your first product
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={products}
                  onRowClick={(product) => navigate(`/products/${product.id}`)}
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
        onClose={() => !submitting && setDeleteModal({ isOpen: false, product: null })}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteModal.product?.name}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};

