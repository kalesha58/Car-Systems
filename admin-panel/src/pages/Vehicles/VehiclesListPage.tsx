import { motion } from 'framer-motion';
import { 
  Lightbulb,
  Search, 
  Trash2, 
  UserPlus
} from 'lucide-react';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
import { deleteVehicle, getVehicles } from '@services/vehicleService';
import { useToastStore } from '@store/toastStore';
import { debounce } from '@utils/debounce';
import { extractErrorMessage } from '@utils/errorHandler';

import { IVehicle } from '../../types/vehicle';

export const VehiclesListPage = () => {
  const navigate = useNavigate();
  const { showToast } = useToastStore();
  const [vehicles, setVehicles] = useState<IVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInputValue, setSearchInputValue] = useState('');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; vehicle: IVehicle | null; dealerId: string }>({
    isOpen: false,
    vehicle: null,
    dealerId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [statusSummary, setStatusSummary] = useState({ 
    total: 0, 
    available: 0, 
    sold: 0, 
    reserved: 0 
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);

  const fetchVehicles = useCallback(async () => {
    // Prevent duplicate calls
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      setLoading(true);
      const response = await getVehicles({
        page: currentPage,
        limit: itemsPerPage,
        search: searchTerm || undefined,
        vehicleType: vehicleTypeFilter !== 'all' ? vehicleTypeFilter : undefined,
        availability: availabilityFilter !== 'all' ? availabilityFilter : undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      
      // Handle empty results gracefully without showing toast
      // The table will display "No vehicles found" message
      const vehiclesList = response.vehicles || [];
      const mappedVehicles: IVehicle[] = vehiclesList.map((vehicle: any) => ({
        ...vehicle,
        dealerID: vehicle.dealerID || vehicle.dealerId, // Map dealerId to dealerID
        dealer: vehicle.dealer || (vehicle.dealerID ? {
          id: vehicle.dealerID,
          name: vehicle.dealerName || 'N/A',
          businessName: vehicle.dealerBusinessName,
          location: vehicle.dealerLocation || '',
          place: vehicle.dealerPlace || '',
          address: vehicle.dealerAddress,
          phone: vehicle.dealerPhone,
          email: vehicle.dealerEmail,
        } : undefined),
        createdDate: vehicle.createdAt || vehicle.createdDate,
      }));
      setVehicles(mappedVehicles);
      setTotalItems(response.pagination?.total || 0);
      setTotalPages(response.pagination?.totalPages || 0);

      // Calculate status summary
      const availableCount = mappedVehicles.filter(v => v.availability === 'available').length;
      const soldCount = mappedVehicles.filter(v => v.availability === 'sold').length;
      const reservedCount = mappedVehicles.filter(v => v.availability === 'reserved').length;
      setStatusSummary({
        total: mappedVehicles.length,
        available: availableCount,
        sold: soldCount,
        reserved: reservedCount,
      });
    } catch (error: unknown) {
      if ((error as { name?: string })?.name !== 'AbortError') {
        // Check if error is due to empty results (no vehicles found)
        const errorMessage = (error as { message?: string })?.message || '';
        const isEmptyResult = 
          errorMessage.toLowerCase().includes('not found') ||
          errorMessage.toLowerCase().includes('no vehicles') ||
          errorMessage.toLowerCase().includes('empty') ||
          errorMessage.toLowerCase().includes('no records');
        
        if (!isEmptyResult) {
          console.error('Error fetching vehicles:', error);
          const errorMsg = extractErrorMessage(error, 'Failed to load vehicles');
          showToast(errorMsg, 'error');
        } else {
          // Set empty state without showing toast
          setVehicles([]);
          setTotalItems(0);
          setTotalPages(0);
        }
      }
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm, vehicleTypeFilter, availabilityFilter, showToast]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
  }, [vehicleTypeFilter, availabilityFilter]);

  // Sync search input value with search term when search term changes externally
  useEffect(() => {
    setSearchInputValue(searchTerm);
  }, [searchTerm]);

  const activeFilters = useMemo(() => {
    const filters: Array<{ key: string; label: string }> = [];
    if (searchInputValue.trim()) {
      filters.push({ key: 'search', label: `Search: ${searchInputValue.trim()}` });
    }
    if (vehicleTypeFilter !== 'all') {
      filters.push({
        key: 'type',
        label: `Type: ${vehicleTypeFilter}`,
      });
    }
    if (availabilityFilter !== 'all') {
      filters.push({
        key: 'availability',
        label: `Status: ${availabilityFilter.charAt(0).toUpperCase() + availabilityFilter.slice(1)}`,
      });
    }
    return filters;
  }, [searchInputValue, vehicleTypeFilter, availabilityFilter]);

  const handleClearFilter = useCallback((key: string) => {
    if (key === 'search') {
      setSearchInputValue('');
      setSearchTerm('');
      setCurrentPage(1);
    }
    if (key === 'type') {
      setVehicleTypeFilter('all');
      setCurrentPage(1);
    }
    if (key === 'availability') {
      setAvailabilityFilter('all');
      setCurrentPage(1);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setSearchInputValue('');
    setSearchTerm('');
    setVehicleTypeFilter('all');
    setAvailabilityFilter('all');
    setCurrentPage(1);
  }, []);

  const isEmptyState = !loading && vehicles.length === 0;

  const handleDeleteVehicle = async () => {
    if (!deleteModal.vehicle) return;

    try {
      setSubmitting(true);
      const response = await deleteVehicle(deleteModal.vehicle.id);
      
      // Check if backend provided a message
      const backendMessage = response?.message;
      
      // Only show our generic success message if backend didn't provide one
      if (!backendMessage || !backendMessage.trim()) {
        showToast('Vehicle deleted successfully', 'success');
      }
      
      setDeleteModal({ isOpen: false, vehicle: null, dealerId: '' });
      fetchVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      // API interceptor already shows error toast for API errors
      // Only show generic error if interceptor didn't show one (unlikely)
    } finally {
      setSubmitting(false);
    }
  };


  const columns = [
    {
      key: 'image',
      header: 'Image',
      sortable: false,
      render: (vehicle: IVehicle) => {
        const imgUrl = vehicle.images && vehicle.images.length > 0 ? vehicle.images[0] : null;

        if (!imgUrl) {
          return (
            <div 
              style={{
                width: '48px', 
                height: '48px', 
                backgroundColor: '#f3f4f6', 
                borderRadius: '6px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '0.65rem',
                color: '#9ca3af',
                border: '1px solid #e5e7eb'
              }}
            >
              No Img
            </div>
          );
        }

        const src = imgUrl.startsWith('data:') || imgUrl.startsWith('http') ? imgUrl : `data:image/jpeg;base64,${imgUrl}`;

        return (
          <img 
            src={src} 
            alt={`${vehicle.brand} ${vehicle.vehicleModel}`}
            style={{ 
              width: '48px', 
              height: '48px', 
              objectFit: 'cover', 
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}
          />
        );
      }
    },
    {
      key: 'brand',
      header: 'Brand',
      sortable: true,
    },
    {
      key: 'vehicleModel',
      header: 'Model',
      sortable: true,
    },
    {
      key: 'vehicleType',
      header: 'Type',
      sortable: true,
    },
    {
      key: 'year',
      header: 'Year',
      sortable: true,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (vehicle: IVehicle) => `₹${vehicle.price.toLocaleString()}`,
    },
    {
      key: 'availability',
      header: 'Availability',
      sortable: true,
      render: (vehicle: IVehicle) => {
        let availabilityClass = 'users-status-badge';
        if (vehicle.availability === 'available') {
          availabilityClass = 'users-status-badge users-status-badge--active';
        } else if (vehicle.availability === 'sold') {
          availabilityClass = 'users-status-badge users-status-badge--inactive';
        } else if (vehicle.availability === 'reserved') {
          availabilityClass = 'users-status-badge users-status-badge--warning';
        }
        return (
          <span className={availabilityClass}>
            {vehicle.availability.charAt(0).toUpperCase() + vehicle.availability.slice(1)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      sortable: false,
      render: (vehicle: IVehicle) => (
        <div className="users-action-buttons">
          <Tooltip text="Delete">
            <Button
              size="sm"
              variant="danger"
              onClick={(e?: React.MouseEvent) => {
                e?.stopPropagation();
                setDeleteModal({ isOpen: true, vehicle, dealerId: vehicle.dealerID || '' });
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
          <h1 className="users-page__title">Vehicles</h1>
          <p className="users-page__subtitle">
            View and manage all vehicles, availability, and inventory from a centralized dashboard.
          </p>
        </div>
        <div className="users-page__stats">
          <motion.div
            className="users-page__stat-card"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Total Vehicles</span>
            <strong>{statusSummary.total}</strong>
            <small>Vehicles This View</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--active"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Available</span>
            <strong>{statusSummary.available}</strong>
            <small>Ready to sell</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--inactive"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Sold</span>
            <strong>{statusSummary.sold}</strong>
            <small>Completed sales</small>
          </motion.div>
          <motion.div
            className="users-page__stat-card users-page__stat-card--warning"
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            <span>Reserved</span>
            <strong>{statusSummary.reserved}</strong>
            <small>On hold</small>
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
                  placeholder="Search vehicles..."
                  value={searchInputValue}
                  onChange={handleSearchChange}
                  icon={Search}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={vehicleTypeFilter}
                  onChange={(value) => {
                    setVehicleTypeFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Types"
                  options={[
                    { value: 'all', label: 'All Types' },
                    { value: 'Car', label: 'Car' },
                    { value: 'Bike', label: 'Bike' },
                    { value: 'Truck', label: 'Truck' },
                    { value: 'SUV', label: 'SUV' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__field users-toolbar__field--filter">
              <div className="users-toolbar__select">
                <Select
                  value={availabilityFilter}
                  onChange={(value) => {
                    setAvailabilityFilter(value);
                    setCurrentPage(1);
                  }}
                  placeholder="All Status"
                  options={[
                    { value: 'all', label: 'All Status' },
                    { value: 'available', label: 'Available' },
                    { value: 'sold', label: 'Sold' },
                    { value: 'reserved', label: 'Reserved' },
                  ]}
                />
              </div>
            </div>
            <div className="users-toolbar__spacer" />
            <div className="users-toolbar__actions">
              <div className="users-toolbar__button">
                <Button
                  onClick={() => navigate('/vehicles/new')}
                  icon={UserPlus}
                >
                  Add Vehicle
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
              <h3>No vehicles found</h3>
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
                    onClick={() => navigate('/vehicles/new')}
                    icon={UserPlus}
                  >
                    Add your first vehicle
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="users-table">
                <Table
                  columns={columns}
                  data={vehicles}
                  onRowClick={(vehicle) => navigate(`/vehicles/${vehicle.id}`)}
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
        onClose={() => !submitting && setDeleteModal({ isOpen: false, vehicle: null, dealerId: '' })}
        onConfirm={handleDeleteVehicle}
        title="Delete Vehicle"
        message={`Are you sure you want to delete "${deleteModal.vehicle?.brand} ${deleteModal.vehicle?.vehicleModel}"? This action cannot be undone.`}
        confirmText={submitting ? 'Deleting...' : 'Delete'}
        type="danger"
        disabled={submitting}
      />
    </motion.div>
  );
};

