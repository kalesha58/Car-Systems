import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Lightbulb,
  Search, 
  Trash2, 
  UserPlus
} from 'lucide-react';

import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { LoadingSpinner } from '@components/LoadingSpinner/LoadingSpinner';
import { Modal } from '@components/Modal/Modal';
import { Pagination } from '@components/Pagination/Pagination';
import { Select } from '@components/Select';
import { SkeletonTable } from '@components/Skeleton';
import { deleteUser } from '@services/userService';
import { getDealers } from '@services/dealerService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';

import { IDealerListItem } from '../../types/dealer';
import { IUserListItem } from '../../types/user';

export const DealersListPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [dealers, setDealers] = useState<IDealerListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dealerTypeFilter, setDealerTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [statusSummary, setStatusSummary] = useState({ approved: 0, pending: 0, suspended: 0, total: 0 });
  // For display, we'll combine pending + suspended as "inactive"
  const displaySummary = useMemo(() => ({
    total: statusSummary.total,
    active: statusSummary.approved,
    inactive: statusSummary.pending + statusSummary.suspended,
  }), [statusSummary]);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dealer: IDealerListItem | null }>({
    isOpen: false,
    dealer: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserListItem | null>(null);
  const [loadingUser] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: ['user', 'dealer'] as string[],
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [isDealerContext] = useState(true); // Always true for dealers page

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchDealers = useCallback(async () => {
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
      
      const response = await getDealers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        dealerType: dealerTypeFilter !== 'all' ? dealerTypeFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      }, abortControllerRef.current.signal);

      const mappedDealers: IDealerListItem[] = response.dealers.map((dealer) => ({
        id: dealer.id,
        name: dealer.name,
        businessName: dealer.businessName,
        phone: dealer.phone,
        email: dealer.email,
        status: dealer.status,
        location: dealer.location || '',
        rating: dealer.rating || 0,
        totalOrders: dealer.totalOrders || 0,
        isBusinessRegistration: true,
        createdDate: dealer.createdAt || new Date().toISOString(),
        dealerType: dealer.dealerType,
        suspensionReason: dealer.suspensionReason,
        registrationDate: dealer.registrationDate,
        approvalDate: dealer.approvalDate,
      }));
      
      setDealers(mappedDealers);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);

      // Status summary - we'll need to fetch all or use a dedicated endpoint if needed for accuracy, 
      // but for now we'll update based on the current page's totals as a fallback
      // Ideally the backend should return these counts in the pagination object.
      // Since we refactored getDealers to be the source of truth, we can calculate these accurately on the server.
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        console.error('Error fetching dealers:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load dealers');
        showToast(errorMessage, 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, dealerTypeFilter, showToast]);

  useEffect(() => {
    fetchDealers();
  }, [fetchDealers]);

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
  }, [statusFilter, dealerTypeFilter]);

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);


  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role: ['user', 'dealer'],
    });
    setUserFormErrors({});
  };

  const validateUserForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userFormData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!userFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      const phoneDigits = userFormData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
    }

    if (!editingUser && !userFormData.password) {
      newErrors.password = 'Password is required';
    } else if (userFormData.password && userFormData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!userFormData.role || userFormData.role.length === 0) {
      newErrors.role = 'At least one role must be selected';
    }

    setUserFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUserSubmit = async () => {
    if (!validateUserForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const cleanPhone = userFormData.phone.replace(/\D/g, '');
      
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          role: userFormData.role,
        });
        showToast('Dealer updated successfully', 'success');
      } else {
        await createUser({
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          password: userFormData.password,
          role: userFormData.role,
        });
        showToast('Dealer created successfully', 'success');
      }
      handleCloseUserModal();
      fetchDealers();
    } catch (error) {
      console.error('Error saving dealer:', error);
      showToast(editingUser ? 'Failed to update dealer' : 'Failed to create dealer', 'error');
    } finally {
      setSubmitting(false);
    }
  };



  const handleDeleteDealer = async () => {
    if (!deleteModal.dealer) return;

    try {
      setSubmitting(true);
      await deleteUser(deleteModal.dealer.id);
      showToast('Dealer deleted successfully', 'success');
      setDeleteModal({ isOpen: false, dealer: null });
      fetchDealers();
    } catch (error) {
      console.error('Error deleting dealer:', error);
      showToast('Failed to delete dealer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  /*
  const getBusinessRegistrationStatus = (dealer: IDealerListItem) => {
    if (dealer.isBusinessRegistration) {
      return { text: 'Registered', color: theme.colors.success };
    }
    return { text: 'Not Registered', color: theme.colors.warning };
  };
  */


  // Get unique dealer types from current dealers for filter dropdown
  const uniqueDealerTypes = useMemo(() => {
    const typeSet = new Set<string>();
    dealers.forEach((dealer) => {
      if (dealer.dealerType) {
        typeSet.add(dealer.dealerType);
      }
    });
    return Array.from(typeSet).sort();
  }, [dealers]);

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
    if (dealerTypeFilter !== 'all') {
      const typeLabel = dealerTypeFilter
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      filters.push({
        key: 'dealerType',
        label: `Type: ${typeLabel}`,
      });
    }
    return filters;
  }, [searchInputValue, statusFilter, dealerTypeFilter]);

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
    if (key === 'dealerType') {
      setDealerTypeFilter('all');
      setCurrentPage(1);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchTerm('');
    setStatusFilter('all');
    setDealerTypeFilter('all');
    setCurrentPage(1);
  }, []);

  const isEmptyState = !loading && dealers.length === 0;

  const columns = [
    {
      key: 'name',
      header: 'Dealer Name',
      sortable: true,
    },
    {
      key: 'businessName',
      header: 'Business Name',
      sortable: true,
    },

    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      sortValue: (dealer: IDealerListItem) => dealer.status,
      render: (dealer: IDealerListItem) => {
        const statusClass = `users-status-badge users-status-badge--${dealer.status === 'approved' ? 'active' : dealer.status === 'suspended' ? 'inactive' : dealer.status}`;
        if (dealer.status === 'suspended' && dealer.suspensionReason) {
          return (
            <Tooltip text={`Suspension Reason: ${dealer.suspensionReason}`}>
              <span className={statusClass}>
                {dealer.status}
              </span>
            </Tooltip>
          );
        }
        return (
          <span className={statusClass}>
            {dealer.status}
          </span>
        );
      },
    },


    /*
    {
      key: 'businessRegistration',
      header: 'Business Registration',
      sortable: true,
      sortValue: (dealer: IDealerListItem) => dealer.isBusinessRegistration ? 1 : 0,
      render: (dealer: IDealerListItem) => {
        const status = getBusinessRegistrationStatus(dealer);
        return (
          <span
            className={`users-status-badge users-status-badge--business ${
              dealer.isBusinessRegistration ? 'users-status-badge--registered' : 'users-status-badge--not-registered'
            }`}
          >
            {status.text}
          </span>
        );
      },
    },
    */
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (dealer: IDealerListItem) => (
        <div className="users-action-buttons">

          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, dealer });
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
          <h1 className="users-page__title">Dealers</h1>
          <p className="users-page__subtitle">
            View and manage all dealer accounts, business registrations, and status from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Dealers</span>
            <strong>{displaySummary.total}</strong>
            <small>Dealers This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Active Dealers</span>
            <strong>{displaySummary.active}</strong>
            <small>Healthy accounts</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Inactive Dealers</span>
            <strong>{displaySummary.inactive}</strong>
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
                  placeholder="Search by dealer name or business"
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
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'suspended', label: 'Suspended' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={dealerTypeFilter}
                  onChange={(value) => {
                    setDealerTypeFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Types"
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'showroom', label: 'Showroom' },
                    { value: 'car_wash', label: 'Car Wash' },
                    { value: 'detailing', label: 'Detailing' },
                    { value: 'automobile', label: 'Automobile' },
                    ...uniqueDealerTypes
                      .filter((type) => !['showroom', 'car_wash', 'detailing', 'automobile'].includes(type))
                      .map((type) => ({
                        value: type,
                        label: type
                          .split('_')
                          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' '),
                      })),
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__button">
                <Button
                  onClick={() => navigate('/dealers/new?type=dealer')}
                  icon={UserPlus}
                >
                  Add Dealer
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
                  Tip: Combine search + status filters for precise segments.
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
              <h3>No dealers found</h3>
              <p>It looks a little quiet here. Adjust filters or add a new record to get things moving.</p>
              <div className="users-empty-state__tip">
                <Lightbulb size={16} />
                <span>Tip: Combine search + status filters for precise segments.</span>
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
                    onClick={() => navigate('/dealers/new?type=dealer')}
                    icon={UserPlus}
                  >
                    Add your first dealer
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={dealers}
                  onRowClick={(dealer) => navigate(`/dealers/${dealer.id}`)}
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

      {/* Edit Dealer Modal */}
      {loadingUser ? (
        <Modal isOpen={showUserModal} onClose={handleCloseUserModal} title="Loading...">
          <LoadingSpinner />
        </Modal>
      ) : (
        <Modal
          isOpen={showUserModal}
          onClose={handleCloseUserModal}
          title={editingUser ? 'Edit Dealer' : 'Create New Dealer'}
        >
          <div>
            <Input
              label="Name"
              value={userFormData.name}
              onChange={(value) => {
                setUserFormData({ ...userFormData, name: value });
                setUserFormErrors({ ...userFormErrors, name: '' });
              }}
              placeholder="Enter dealer name"
              error={userFormErrors.name}
              required
              disabled={!!editingUser}
            />

            <Input
              label="Email"
              type="email"
              value={userFormData.email}
              onChange={(value) => {
                setUserFormData({ ...userFormData, email: value });
                setUserFormErrors({ ...userFormErrors, email: '' });
              }}
              placeholder="Enter email"
              error={userFormErrors.email}
              required
              disabled={!!editingUser}
            />

            <Input
              label="Phone"
              type="tel"
              value={userFormData.phone}
              onChange={(value) => {
                // Only allow digits
                const digitsOnly = value.replace(/\D/g, '');
                // Limit to 10 digits
                const limitedDigits = digitsOnly.slice(0, 10);
                setUserFormData({ ...userFormData, phone: limitedDigits });
                setUserFormErrors({ ...userFormErrors, phone: '' });
              }}
              placeholder="Enter 10-digit phone number"
              error={userFormErrors.phone}
              required
              disabled={!!editingUser}
            />

            {!editingUser && (
              <Input
                label="Password"
                type="password"
                value={userFormData.password}
                onChange={(value) => {
                  setUserFormData({ ...userFormData, password: value });
                  setUserFormErrors({ ...userFormErrors, password: '' });
                }}
                placeholder="Enter password"
                error={userFormErrors.password}
                required
              />
            )}

            <div style={{ marginBottom: theme.spacing.md }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: theme.spacing.xs,
                  color: theme.colors.text,
                  fontWeight: '500',
                }}
              >
                Roles
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: theme.spacing.sm,
                  padding: theme.spacing.sm,
                }}
              >
                {['user', 'dealer', 'admin'].map((role) => {
                  // Dealer role cannot be unchecked when in dealer context
                  const isDealerRoleDisabled = role === 'dealer' && isDealerContext;
                  const isChecked = userFormData.role.includes(role);
                  
                  // Role-specific colors
                  const roleColors: Record<string, { bg: string; border: string; text: string }> = {
                    user: {
                      bg: isChecked ? '#E3F2FD' : theme.colors.surface,
                      border: isChecked ? '#2196F3' : theme.colors.border,
                      text: isChecked ? '#1976D2' : theme.colors.text,
                    },
                    dealer: {
                      bg: isChecked ? '#FFF3E0' : theme.colors.surface,
                      border: isChecked ? '#FF9800' : theme.colors.border,
                      text: isChecked ? '#F57C00' : theme.colors.text,
                    },
                    admin: {
                      bg: isChecked ? '#F3E5F5' : theme.colors.surface,
                      border: isChecked ? '#9C27B0' : theme.colors.border,
                      text: isChecked ? '#7B1FA2' : theme.colors.text,
                    },
                  };
                  
                  const roleColor = roleColors[role] || roleColors.user;
                  
                  return (
                    <motion.label
                      key={role}
                      whileHover={!isDealerRoleDisabled ? { scale: 1.02 } : {}}
                      whileTap={!isDealerRoleDisabled ? { scale: 0.98 } : {}}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: `${theme.spacing.sm} ${theme.spacing.xs}`,
                        borderRadius: theme.borderRadius.md,
                        border: `2px solid ${roleColor.border}`,
                        backgroundColor: roleColor.bg,
                        cursor: isDealerRoleDisabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        opacity: isDealerRoleDisabled ? 0.6 : 1,
                        position: 'relative',
                        minHeight: '70px',
                        boxShadow: isChecked 
                          ? `0 2px 8px ${roleColor.border}40` 
                          : '0 1px 3px rgba(0,0,0,0.1)',
                      }}
                      onMouseEnter={(e) => {
                        if (!isDealerRoleDisabled && !isChecked) {
                          e.currentTarget.style.borderColor = roleColor.border;
                          e.currentTarget.style.backgroundColor = `${roleColor.bg}80`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isChecked) {
                          e.currentTarget.style.borderColor = theme.colors.border;
                          e.currentTarget.style.backgroundColor = theme.colors.surface;
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        disabled={isDealerRoleDisabled}
                        aria-label={`Select ${role} role`}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setUserFormData({
                              ...userFormData,
                              role: [...userFormData.role, role],
                            });
                          } else {
                            // Prevent removing dealer role when in dealer context
                            if (role === 'dealer' && isDealerContext) {
                              return;
                            }
                            // Prevent removing the last role, at least one role must be selected
                            if (userFormData.role.length > 1) {
                              setUserFormData({
                                ...userFormData,
                                role: userFormData.role.filter((r) => r !== role),
                              });
                            }
                          }
                        }}
                        style={{
                          position: 'absolute',
                          opacity: 0,
                          width: 0,
                          height: 0,
                          pointerEvents: 'none',
                        }}
                      />
                      {/* Custom Toggle Switch */}
                      <div
                        style={{
                          width: '44px',
                          height: '24px',
                          borderRadius: '12px',
                          backgroundColor: isChecked ? roleColor.border : '#E0E0E0',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          boxShadow: isChecked 
                            ? `0 2px 6px ${roleColor.border}60` 
                            : 'inset 0 1px 3px rgba(0,0,0,0.1)',
                        }}
                      >
                        <motion.div
                          animate={{
                            x: isChecked ? 18 : 2,
                          }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 30,
                          }}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            backgroundColor: '#FFFFFF',
                            position: 'absolute',
                            top: '2px',
                            left: '2px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {isChecked && (
                            <motion.svg
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.1 }}
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke={roleColor.border}
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </motion.svg>
                          )}
                        </motion.div>
                      </div>
                      {/* Role Label */}
                      <span
                        style={{
                          color: roleColor.text,
                          textTransform: 'capitalize',
                          fontSize: '0.875rem',
                          fontWeight: isChecked ? '600' : '500',
                          letterSpacing: '0.3px',
                          textAlign: 'center',
                        }}
                      >
                        {role}
                      </span>
                      {/* Badge for disabled state */}
                      {isDealerRoleDisabled && (
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: theme.colors.text,
                            opacity: 0.7,
                            fontStyle: 'italic',
                            marginTop: '-2px',
                          }}
                        >
                          Required
                        </span>
                      )}
                    </motion.label>
                  );
                })}
              </div>
              {userFormErrors.role && (
                <div style={{ marginTop: theme.spacing.xs, color: theme.colors.error, fontSize: '0.875rem' }}>
                  {userFormErrors.role}
                </div>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: theme.spacing.md,
                justifyContent: 'flex-end',
                marginTop: theme.spacing.lg,
              }}
            >
              <Button variant="outline" onClick={handleCloseUserModal} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleUserSubmit} loading={submitting}>
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !submitting && setDeleteModal({ isOpen: false, dealer: null })}
        onConfirm={handleDeleteDealer}
        title="Delete Dealer"
        message={`Are you sure you want to delete "${deleteModal.dealer?.name}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />

    </motion.div>
  );
};

