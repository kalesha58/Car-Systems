import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ImagePreviewModal } from '@components/ImagePreviewModal/ImagePreviewModal';
import { SkeletonCard } from '@components/Skeleton';
import { getUsers } from '@services/userService';
import { getVehicleById } from '@services/vehicleService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { Car, Edit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerListItem } from '../../types/dealer';
import { IVehicle } from '../../types/vehicle';

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
          {vehicle.dealerID && (
            <Button
              variant="outline"
              onClick={() => navigate(`/vehicles/${vehicle.dealerID}/${id}/edit`)}
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

