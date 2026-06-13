import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ImagePreviewModal } from '@components/ImagePreviewModal/ImagePreviewModal';
import { SkeletonCard } from '@components/Skeleton';
import { getUsers } from '@services/userService';
import { getAdminTestDrives } from '@services/testDriveService';
import { getVehicleById, updateVehicleById } from '@services/vehicleService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { Car, Edit } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerListItem } from '../../types/dealer';
import type { IAdminTestDrive } from '../../types/testDrive';
import { IVehicle } from '../../types/vehicle';

const TEST_DRIVE_STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  approved: '#10b981',
  rejected: '#ef4444',
  completed: '#6b7280',
  cancelled: '#9ca3af',
};

export const VehicleDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [vehicle, setVehicle] = useState<IVehicle | null>(null);
  const [dealer, setDealer] = useState<IDealerListItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [failedThumbnails, setFailedThumbnails] = useState<Set<number>>(new Set());
  const [updatingTestDrive, setUpdatingTestDrive] = useState(false);
  const [testDrives, setTestDrives] = useState<IAdminTestDrive[]>([]);
  const [loadingTestDrives, setLoadingTestDrives] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchKey = id;
    if (isFetchingRef.current && lastFetchedIdRef.current === fetchKey) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchedIdRef.current = fetchKey;

    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const vehicleData = await getVehicleById(id);

        // Extract dealerId from vehicle response
        const vehicleDealerId = vehicleData.dealerID || (vehicleData as any).dealerId || '';

        // Fetch dealer information if dealerId exists
        if (vehicleDealerId) {
          try {
            const dealersResponse = await getUsers({ limit: 100, role: 'dealer', status: 'active' });
            const foundDealer = dealersResponse.users.find((user) => user.id === vehicleDealerId);
            if (foundDealer) {
              setDealer({
                id: foundDealer.id,
                name: foundDealer.name,
                businessName: foundDealer.name,
                phone: foundDealer.phone,
                email: foundDealer.email,
                status: 'approved' as const,
                location: '',
                rating: 0,
                totalOrders: foundDealer.ordersCount || 0,
                createdDate: foundDealer.createdDate,
              });
            }
          } catch (error) {
            console.error('Error fetching dealer:', error);
          }
        }

        setVehicle(vehicleData);
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error fetching vehicle:', error);
          showToast('Failed to load vehicle details', 'error');
          navigate('/vehicles');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchVehicle();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, navigate, showToast]);

  const fetchVehicleTestDrives = useCallback(async (vehicleId: string) => {
    try {
      setLoadingTestDrives(true);
      const result = await getAdminTestDrives({ vehicleId, limit: 20, page: 1 });
      setTestDrives(result.testDrives);
    } catch {
      setTestDrives([]);
    } finally {
      setLoadingTestDrives(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchVehicleTestDrives(id);
    }
  }, [id, fetchVehicleTestDrives]);

  const dealerUserId = vehicle?.dealerUserId || vehicle?.dealerID;

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available':
        return theme.colors.success;
      case 'sold':
        return theme.colors.error;
      case 'reserved':
        return theme.colors.warning;
      default:
        return theme.colors.secondary;
    }
  };

  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div>
        <Breadcrumbs />
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <p style={{ color: theme.colors.text, margin: 0 }}>Vehicle not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/vehicles')}
              style={{ marginTop: theme.spacing.md }}
            >
              Back to Vehicles
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const vehicleImages = vehicle.images && vehicle.images.length > 0 ? vehicle.images : [];

  const getImageSrc = (img: string) => {
    if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) {
      return img;
    }
    return `data:image/jpeg;base64,${img}`;
  };

  const handleThumbnailClick = () => {
    setIsImageModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsImageModalOpen(false);
  };

  const handleThumbnailError = (index: number) => {
    setFailedThumbnails((prev) => new Set(prev).add(index));
  };

  const handleTestDriveToggle = async (enabled: boolean) => {
    if (!id) return;

    setUpdatingTestDrive(true);
    try {
      const updated = await updateVehicleById(id, { allowTestDrive: enabled });
      setVehicle((prev) => (prev ? { ...prev, allowTestDrive: updated.allowTestDrive ?? enabled } : prev));
      showToast(
        enabled ? 'Test drive enabled for this vehicle' : 'Test drive disabled for this vehicle',
        'success',
      );
      if (id) {
        fetchVehicleTestDrives(id);
      }
    } catch (error) {
      console.error('Error updating test drive setting:', error);
      showToast('Failed to update test drive setting', 'error');
    } finally {
      setUpdatingTestDrive(false);
    }
  };

  return (
    <div>
      <Breadcrumbs />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: theme.spacing.xl,
          flexWrap: 'wrap',
          gap: theme.spacing.md,
        }}
        className="flex-col sm:flex-row"
      >
        <h1
          style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: theme.colors.text,
            margin: 0,
          }}
          className="text-xl sm:text-2xl"
        >
          Vehicle Details
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          {dealerUserId && (
            <Button
              variant="outline"
              onClick={() => navigate(`/vehicles/${dealerUserId}/${id}/edit`)}
              icon={Edit}
            >
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Vehicle Information */}
      <Card style={{ marginBottom: theme.spacing.xl }}>
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header with Icon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.md,
                paddingBottom: theme.spacing.md,
                borderBottom: `1px solid ${theme.colors.border}`,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  padding: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.secondary}20)`,
                }}
              >
                <Car size={24} style={{ color: theme.colors.primary }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.brand} {vehicle.vehicleModel}
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginTop: theme.spacing.xs,
                    fontSize: '0.875rem',
                    color: theme.colors.textSecondary,
                  }}
                >
                  Vehicle Information
                </p>
              </div>
              {/* Vehicle Images Thumbnails */}
              {vehicleImages.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    gap: theme.spacing.sm,
                    overflowX: 'auto',
                    overflowY: 'hidden',
                    maxWidth: '100%',
                    padding: theme.spacing.xs,
                  }}
                >
                  {vehicleImages.map((img, index) => (
                    <div
                      key={index}
                      onClick={handleThumbnailClick}
                      style={{
                        flexShrink: 0,
                        width: '80px',
                        height: '80px',
                        borderRadius: theme.borderRadius.md,
                        overflow: 'hidden',
                        border: `2px solid ${theme.colors.border}`,
                        cursor: 'pointer',
                        backgroundColor: theme.colors.surface,
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)';
                        e.currentTarget.style.borderColor = theme.colors.primary;
                        e.currentTarget.style.boxShadow = `0 4px 12px ${theme.colors.primary}30`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.borderColor = theme.colors.border;
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      {failedThumbnails.has(index) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            color: theme.colors.textSecondary,
                            fontSize: '0.75rem',
                          }}
                        >
                          Failed
                        </div>
                      ) : (
                        <img
                          src={getImageSrc(img)}
                          alt={`${vehicle.brand} ${vehicle.vehicleModel} thumbnail ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          onError={() => handleThumbnailError(index)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Details Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: theme.spacing.md,
              }}
            >
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Brand
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.brand}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Model
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.vehicleModel}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Vehicle Type
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.vehicleType}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Year
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.year}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Price
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  ₹{vehicle.price.toLocaleString()}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Availability
                </label>
                <p style={{ margin: 0 }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.xl,
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: getAvailabilityColor(vehicle.availability) + '20',
                      color: getAvailabilityColor(vehicle.availability),
                    }}
                  >
                    {vehicle.availability.charAt(0).toUpperCase() + vehicle.availability.slice(1)}
                  </span>
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Number Plate
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.numberPlate}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Mileage
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.mileage.toLocaleString()} km
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Color
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.color}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Fuel Type
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.fuelType}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Transmission
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {vehicle.transmission}
                </p>
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Condition
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                    textTransform: 'capitalize',
                  }}
                >
                  {vehicle.condition}
                </p>
              </div>

              {dealer && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Dealer
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: theme.colors.text,
                    }}
                  >
                    {dealer.name}
                  </p>
                </div>
              )}

              {vehicle.createdDate && (
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      color: theme.colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: theme.spacing.xs,
                    }}
                  >
                    Created Date
                  </label>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      color: theme.colors.text,
                    }}
                  >
                    {formatDate(vehicle.createdDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Description
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: theme.colors.text,
                    lineHeight: '1.6',
                  }}
                >
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Features */}
            {vehicle.features && vehicle.features.length > 0 && (
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: theme.spacing.xs,
                  }}
                >
                  Features
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {vehicle.features.map((feature) => (
                    <span
                      key={feature}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.primary + '20',
                        color: theme.colors.primary,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
        </motion.div>
      </Card>

      <Card style={{ marginBottom: theme.spacing.xl }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: theme.spacing.md,
            flexWrap: 'wrap',
            paddingBottom: theme.spacing.md,
            marginBottom: theme.spacing.md,
            borderBottom: `1px solid ${theme.colors.border}`,
          }}
        >
          <div>
            <h3 style={{ margin: 0, color: theme.colors.text, fontSize: '1.1rem', fontWeight: 700 }}>
              Test Drive
            </h3>
            <p style={{ margin: '4px 0 0', color: theme.colors.textSecondary, fontSize: '0.85rem' }}>
              Allow bookings and view requests for this vehicle
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.xl,
                fontSize: '0.75rem',
                fontWeight: 600,
                backgroundColor: vehicle.allowTestDrive
                  ? theme.colors.success + '20'
                  : theme.colors.textSecondary + '20',
                color: vehicle.allowTestDrive ? theme.colors.success : theme.colors.textSecondary,
              }}
            >
              {vehicle.allowTestDrive ? 'Enabled' : 'Disabled'}
            </span>
            <label
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: theme.spacing.xs,
                fontSize: '0.875rem',
                color: theme.colors.text,
                fontWeight: 500,
                cursor: updatingTestDrive ? 'not-allowed' : 'pointer',
                opacity: updatingTestDrive ? 0.6 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={vehicle.allowTestDrive ?? false}
                disabled={updatingTestDrive}
                onChange={(e) => handleTestDriveToggle(e.target.checked)}
              />
              Allow test drive
            </label>
          </div>
        </div>

        <h4 style={{ margin: '0 0 12px', color: theme.colors.text, fontSize: '0.95rem', fontWeight: 600 }}>
          Booking requests
        </h4>

        {loadingTestDrives ? (
          <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: '0.875rem' }}>Loading requests...</p>
        ) : testDrives.length === 0 ? (
          <div
            style={{
              padding: theme.spacing.lg,
              borderRadius: theme.borderRadius.md,
              background: theme.colors.surface,
              textAlign: 'center',
            }}
          >
            <p style={{ margin: '0 0 6px', color: theme.colors.text, fontWeight: 600 }}>
              No test drive requests yet
            </p>
            <p style={{ margin: 0, color: theme.colors.textSecondary, fontSize: '0.85rem', lineHeight: 1.5 }}>
              {vehicle.allowTestDrive
                ? 'This vehicle is open for test drives. Requests appear here after a customer books from the app.'
                : 'Enable "Allow test drive" above, then customers can book from the app.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                  {['Customer', 'Date / Time', 'Status', 'Notes'].map((heading) => (
                    <th
                      key={heading}
                      style={{
                        padding: '10px 12px',
                        textAlign: 'left',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: theme.colors.textSecondary,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {testDrives.map((td) => {
                  const statusColor = TEST_DRIVE_STATUS_COLORS[td.status] || '#6b7280';
                  return (
                    <tr key={td.id} style={{ borderBottom: `1px solid ${theme.colors.border}` }}>
                      <td style={{ padding: '10px 12px', color: theme.colors.text, verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{td.customerName || '—'}</div>
                        <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                          {td.customerPhone || td.customerEmail || td.userId}
                        </div>
                      </td>
                      <td style={{ padding: '10px 12px', color: theme.colors.text, verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        {formatDate(td.preferredDate)}
                        <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>{td.preferredTime}</div>
                      </td>
                      <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '4px 10px',
                            borderRadius: 20,
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            lineHeight: 1.2,
                            background: `${statusColor}20`,
                            color: statusColor,
                            textTransform: 'capitalize',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {td.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: theme.colors.textSecondary, fontSize: '0.85rem', verticalAlign: 'middle' }}>
                        {td.notes || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: theme.spacing.md }}>
          <Button variant="outline" onClick={() => navigate('/test-drives')}>
            View all test drives
          </Button>
        </div>
      </Card>

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={isImageModalOpen}
        onClose={handleCloseModal}
        images={vehicleImages}
        title={`${vehicle.brand} ${vehicle.vehicleModel} - Images`}
      />
    </div>
  );
};

