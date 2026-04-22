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
import { createUser, deleteUser, getUsers, updateUser } from '@services/userService';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

import { IUserListItem } from '../../types/user';

export const UsersListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [users, setUsers] = useState<IUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<IUserListItem | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; user: IUserListItem | null }>({
    isOpen: false,
    user: null,
  });
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: ['user'] as string[],
  });
  const [userFormErrors, setUserFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [isDealerContext, setIsDealerContext] = useState(false);
  const [statusSummary, setStatusSummary] = useState({ active: 0, inactive: 0, total: 0 });
  const [, setLastUpdatedAt] = useState<string>('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchUsers = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      // Map "blocked" to "inactive" for API (per Swagger: "blocked" maps to "inactive" on backend)
      const apiStatus = statusFilter !== 'all' 
        ? (statusFilter === 'blocked' ? 'inactive' : statusFilter)
        : undefined;
      
      const response = await getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        status: apiStatus,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      // Map API response (createdAt) to component type (createdDate)
      // Map "inactive" from API to "blocked" for display (per Swagger: "blocked" maps to "inactive" on backend)
      const mappedUsers: IUserListItem[] = response.users.map((user) => ({
        ...user,
        createdDate: (user as any).createdAt || user.createdDate,
        role: (user as any).role || (user as any).roles || ['user'],
        status: (user as any).status === 'inactive' ? 'blocked' : user.status,
      }));
      setUsers(mappedUsers);
      setTotalItems(response.pagination.total);
      setTotalPages(response.pagination.totalPages);
      
      // Calculate status summary
      const activeCount = mappedUsers.filter((u) => u.status === 'active').length;
      const inactiveCount = mappedUsers.filter((u) => u.status !== 'active').length;
      setStatusSummary({
        active: activeCount,
        inactive: inactiveCount,
        total: mappedUsers.length,
      });
      setLastUpdatedAt(new Date().toISOString());
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('Error fetching users:', error);
        const errorMessage = extractErrorMessage(error, 'Failed to load users');
        showToast(errorMessage, 'error');
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, statusFilter, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle URL params for adding dealer
  useEffect(() => {
    const addParam = searchParams.get('add');
    const typeParam = searchParams.get('type');
    
    if (addParam === 'true' && typeParam === 'dealer') {
      // Navigate to dealer form page
      navigate('/dealers/new?type=dealer', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
  }, [statusFilter]);

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);


  const handleCloseUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setIsDealerContext(false);
    setUserFormData({
      name: '',
      email: '',
      phone: '',
      role: ['user'],
    });
    setUserFormErrors({});
    // Clear URL params
    setSearchParams({});
  };

  const validateUserForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!userFormData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!userFormData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      // Enhanced email validation
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(userFormData.email.trim())) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!userFormData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else {
      // Remove any non-digit characters for validation
      const phoneDigits = userFormData.phone.replace(/\D/g, '');
      if (phoneDigits.length !== 10) {
        newErrors.phone = 'Phone number must be exactly 10 digits';
      }
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
      // Clean phone number - remove any non-digit characters
      const cleanPhone = userFormData.phone.replace(/\D/g, '');
      
      if (editingUser) {
        await updateUser(editingUser.id, {
          name: userFormData.name,
          email: userFormData.email,
          phone: cleanPhone,
          role: userFormData.role,
        });
        showToast('User updated successfully', 'success');
      } else {
        await createUser({
          name: userFormData.name,
          email: userFormData.email.trim(),
          phone: cleanPhone,
          password: '', // Password will be handled separately or auto-generated
          role: userFormData.role,
        });
        showToast('User created successfully', 'success');
      }
      handleCloseUserModal();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      const defaultMessage = editingUser ? 'Failed to update user' : 'Failed to create user';
      const errorMessage = extractErrorMessage(error, defaultMessage);
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModal.user) return;

    try {
      setSubmitting(true);
      await deleteUser(deleteModal.user.id);
      showToast('User deleted successfully', 'success');
      setDeleteModal({ isOpen: false, user: null });
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      const errorMessage = extractErrorMessage(error, 'Failed to delete user');
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
    },
    {
      key: 'email',
      header: 'Email',
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
      sortValue: (user: IUserListItem) => user.status,
      render: (user: IUserListItem) => {
        const isActive = user.status === 'active';
        const createdDate = user.createdDate ? new Date(user.createdDate) : null;
        const isRisky = !isActive && createdDate && 
          (Date.now() - createdDate.getTime()) > (30 * 24 * 60 * 60 * 1000); // 30 days
        
        return (
          <div className="users-status-container">
        <span
              className={`users-status-badge ${isActive ? 'users-status-badge--active' : 'users-status-badge--inactive'}`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
            {isRisky && (
              <span className="users-risky-badge">
                Risky
        </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdDate',
      header: 'Created Date',
      sortable: true,
      sortValue: (user: IUserListItem) => new Date(user.createdDate),
      render: (user: IUserListItem) =>
        new Date(user.createdDate).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (user: IUserListItem) => (
        <div className="users-action-buttons">

          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, user });
              }}
              icon={Trash2}
            />
          </Tooltip>
        </div>
      ),
    },
  ];



  const isEmptyState = !loading && users.length === 0;
  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (statusFilter !== 'all') {
      filters.push({
        key: 'status',
        label: statusFilter === 'blocked' ? 'Status: Inactive' : 'Status: Active',
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
          <h1 className="users-page__title">Users</h1>
          <p className="users-page__subtitle">
            View and manage all user accounts, roles, and permissions from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Users</span>
            <strong>{statusSummary.total}</strong>
            <small>Users This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Active Users</span>
            <strong>{statusSummary.active}</strong>
            <small>Healthy accounts</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Inactive Users</span>
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
              placeholder="Search by name, email, or phone"
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
                    { value: 'blocked', label: 'Inactive' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__button">
                <Button
                  onClick={() => navigate('/users/new')}
                  icon={UserPlus}
                >
                  Add User
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
              <h3>No users found</h3>
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
                    onClick={() => navigate('/users/new')}
                    icon={UserPlus}
                  >
                    Add your first user
                  </Button>
                </div>
              </div>
            </div>
        ) : (
          <>
              <div className="users-table">
            <Table
              columns={columns}
              data={users}
              onRowClick={(user) => navigate(`/users/${user.id}`)}
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

      {/* Create/Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={handleCloseUserModal}
        title={editingUser ? (isDealerContext ? 'Edit Dealer' : 'Edit User') : (isDealerContext ? 'Create New Dealer' : 'Create New User')}
      >
        <div>
          <Input
            label="Name"
            value={userFormData.name}
            onChange={(value) => {
              setUserFormData({ ...userFormData, name: value });
              setUserFormErrors({ ...userFormErrors, name: '' });
            }}
            placeholder="Enter user name"
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
              // Import getEmailError if not already imported
              const emailError = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(value.trim()) ? '' : (value.trim() ? 'Please enter a valid email address' : 'Email is required');
              setUserFormErrors({ ...userFormErrors, email: emailError });
            }}
            placeholder="Enter email"
            error={userFormErrors.email}
            required
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
                      id={`role-${role}`}
                      checked={isChecked}
                      disabled={isDealerRoleDisabled}
                      aria-label={`${role} role`}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => !submitting && setDeleteModal({ isOpen: false, user: null })}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteModal.user?.name}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};
