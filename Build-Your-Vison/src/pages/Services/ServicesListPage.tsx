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
import {
  deleteAdminService,
  getAdminServices,
  type IAdminService,
  type IAdminServiceQueryParams,
} from '@services/serviceCategoryService';
import { useToastStore } from '@store/toastStore';
import { bulkDeleteByIds } from '@utils/bulkDelete';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';
import { motion } from 'framer-motion';
import { Lightbulb, Pencil, Search, Trash2, UserPlus, Wrench } from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  car_automobile: 'Car Service',
  bike_automobile: 'Bike Service',
  car_wash: 'Vehicle Wash',
  tire_service: 'Tyre Service',
  car_detailing: 'PPF & Detailing',
  battery_service: 'Battery Service',
  general: 'General',
};

const formatSubcategory = (value?: string) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '—';

export const ServicesListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [services, setServices] = useState<IAdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; service: IAdminService | null }>({
    isOpen: false,
    service: null,
  });
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusSummary, setStatusSummary] = useState({
    total: 0,
    active: 0,
    homeService: 0,
    inactive: 0,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchServices = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      const params: IAdminServiceQueryParams = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      };
      if (searchTerm.trim()) params.search = searchTerm.trim();
      if (sectionFilter !== 'all') params.serviceType = sectionFilter;

      const data = await getAdminServices(params);
      setServices(data.services);
      setTotalItems(data.pagination.total);
      setTotalPages(data.pagination.totalPages);

      const activeCount = data.services.filter((s) => s.isActive !== false).length;
      const homeCount = data.services.filter((s) => s.homeService).length;
      setStatusSummary({
        total: data.services.length,
        active: activeCount,
        homeService: homeCount,
        inactive: data.services.length - activeCount,
      });
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching services:', error);
        showToast(extractErrorMessage(error, 'Failed to load services'), 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, sectionFilter, showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    setSelectedServiceIds([]);
  }, [currentPage, searchTerm, sectionFilter]);

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

  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  const handleDelete = async () => {
    if (!deleteModal.service) return;

    try {
      setSubmitting(true);
      await deleteAdminService(deleteModal.service.id);
      showToast('Service deleted successfully', 'success');
      setDeleteModal({ isOpen: false, service: null });
      fetchServices();
    } catch (error: unknown) {
      console.error('Error deleting service:', error);
      showToast(extractErrorMessage(error, 'Failed to delete service'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedServiceIds.length === 0) return;

    try {
      setSubmitting(true);
      const { succeeded, failed } = await bulkDeleteByIds(selectedServiceIds, deleteAdminService);
      setBulkDeleteModalOpen(false);
      setSelectedServiceIds([]);

      if (failed === 0) {
        showToast(`${succeeded} service${succeeded === 1 ? '' : 's'} deleted successfully`, 'success');
      } else if (succeeded === 0) {
        showToast('Failed to delete selected services', 'error');
      } else {
        showToast(`${succeeded} deleted, ${failed} failed`, 'warning');
      }

      fetchServices();
    } catch (error: unknown) {
      console.error('Error bulk deleting services:', error);
      showToast(extractErrorMessage(error, 'Failed to delete selected services'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (sectionFilter !== 'all') {
      filters.push({
        key: 'section',
        label: `Section: ${SERVICE_TYPE_LABELS[sectionFilter] || sectionFilter}`,
      });
    }
    return filters;
  }, [searchInputValue, sectionFilter]);

  const handleClearFilter = useCallback((key: string) => {
    if (key === 'search') {
      setSearchInputValue('');
      setSearchTerm('');
      setCurrentPage(1);
    }
    if (key === 'section') {
      setSectionFilter('all');
      setCurrentPage(1);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchTerm('');
    setSectionFilter('all');
    setCurrentPage(1);
  }, []);

  const isEmptyState = !loading && services.length === 0;

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'section',
      header: 'Section',
      sortable: true,
      sortValue: (service: IAdminService) => service.serviceType || '',
      render: (service: IAdminService) => (
        <span className="users-status-badge users-status-badge--active">
          {service.serviceType ? SERVICE_TYPE_LABELS[service.serviceType] || service.serviceType : '—'}
        </span>
      ),
    },
    {
      key: 'serviceSubCategory',
      header: 'Subcategory',
      sortable: true,
      render: (service: IAdminService) => formatSubcategory(service.serviceSubCategory),
    },
    {
      key: 'servicePackage',
      header: 'Package',
      sortable: true,
      render: (service: IAdminService) =>
        service.servicePackage
          ? service.servicePackage.charAt(0).toUpperCase() + service.servicePackage.slice(1)
          : '—',
    },
    {
      key: 'vehicleType',
      header: 'Vehicle',
      sortable: true,
      render: (service: IAdminService) => service.vehicleType || '—',
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      sortValue: (service: IAdminService) => service.price,
      render: (service: IAdminService) => `₹${service.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'homeService',
      header: 'Home Svc',
      sortable: true,
      sortValue: (service: IAdminService) => (service.homeService ? 1 : 0),
      render: (service: IAdminService) => (
        <span
          className={`users-status-badge ${
            service.homeService ? 'users-status-badge--active' : 'users-status-badge--inactive'
          }`}
        >
          {service.homeService ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Active',
      sortable: true,
      sortValue: (service: IAdminService) => (service.isActive !== false ? 1 : 0),
      render: (service: IAdminService) => (
        <span
          className={`users-status-badge ${
            service.isActive !== false ? 'users-status-badge--active' : 'users-status-badge--inactive'
          }`}
        >
          {service.isActive !== false ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'dealer',
      header: 'Dealer',
      sortable: true,
      sortValue: (service: IAdminService) => service.dealer?.businessName || service.dealerId,
      render: (service: IAdminService) => service.dealer?.businessName || service.dealerId.slice(-6),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (service: IAdminService) => (
        <div className="users-action-buttons">
          <Tooltip text="Edit">
            <Button
              size="sm"
              variant="outline"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                navigate(`/services/${service.id}/edit`);
              }}
              icon={Pencil}
            />
          </Tooltip>
          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, service });
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
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="users-page__hero"
      >
        <div>
          <h1 className="users-page__title">Services</h1>
          <p className="users-page__subtitle">
            View and manage dealer service offerings, sections, and pricing from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Services</span>
            <strong>{totalItems}</strong>
            <small>All matching filters</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Active</span>
            <strong>{statusSummary.active}</strong>
            <small>On this page</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--warning"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Home Service</span>
            <strong>{statusSummary.homeService}</strong>
            <small>On this page</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Inactive</span>
            <strong>{statusSummary.inactive}</strong>
            <small>On this page</small>
          </motion.div>
        </div>
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
                  placeholder="Search services"
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={sectionFilter}
                  onChange={(value) => {
                    setSectionFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Sections"
                  options={[
                    { value: 'all', label: 'All Sections' },
                    ...Object.entries(SERVICE_TYPE_LABELS).map(([value, label]) => ({
                      value,
                      label,
                    })),
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              {selectedServiceIds.length > 0 && (
                <div className="users-toolbar__button">
                  <Button
                    variant="danger"
                    onClick={() => setBulkDeleteModalOpen(true)}
                    icon={Trash2}
                  >
                    Delete Selected ({selectedServiceIds.length})
                  </Button>
                </div>
              )}
              <div className="users-toolbar__button">
                <Button onClick={() => navigate('/services/new')} icon={UserPlus}>
                  Add Service
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
                  Tip: Combine search + section filters for precise segments.
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
                <Wrench size={48} strokeWidth={1.5} style={{ opacity: 0.35 }} />
              </motion.div>
              <h3>No services found</h3>
              <p>It looks a little quiet here. Adjust filters or add a new service to get things moving.</p>
              <div className="users-empty-state__tip">
                <Lightbulb size={16} />
                <span>Tip: Combine search + section filters for precise segments.</span>
              </div>
              <div className="users-empty-state__actions">
                <div className="users-empty-state__cta users-empty-state__cta--ghost">
                  <Button variant="outline" onClick={handleClearAllFilters}>
                    Reset filters
                  </Button>
                </div>
                <div className="users-empty-state__cta">
                  <Button onClick={() => navigate('/services/new')} icon={UserPlus}>
                    Add your first service
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={services}
                  onRowClick={(service) => navigate(`/services/${service.id}/edit`)}
                  selectable
                  selectedIds={selectedServiceIds}
                  onSelectedIdsChange={setSelectedServiceIds}
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
        onClose={() => !submitting && setDeleteModal({ isOpen: false, service: null })}
        onConfirm={handleDelete}
        title="Delete Service"
        message={`Are you sure you want to delete "${deleteModal.service?.name}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />

      <ConfirmModal
        isOpen={bulkDeleteModalOpen}
        onClose={() => !submitting && setBulkDeleteModalOpen(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Services"
        message={`Are you sure you want to delete ${selectedServiceIds.length} selected service${selectedServiceIds.length === 1 ? '' : 's'}? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete All'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};
