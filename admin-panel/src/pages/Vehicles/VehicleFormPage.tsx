import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Select } from '@components/Select';
import { SkeletonCard } from '@components/Skeleton';
import { getUsers } from '@services/userService';
import { createVehicle, getVehicleById, type ICreateVehiclePayload,updateVehicle } from '@services/vehicleService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerListItem } from '../../types/dealer';
import { IVehicleFormData } from '../../types/vehicle';

export const VehicleFormPage = () => {
  const { dealerId, id } = useParams<{ dealerId?: string; id?: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState<IVehicleFormData>({
    vehicleType: '',
    brand: '',
    vehicleModel: '',
    year: new Date().getFullYear(),
    price: 0,
    availability: 'available',
    numberPlate: '',
    mileage: 0,
    color: '',
    fuelType: 'Petrol',
    transmission: 'Manual',
    description: '',
    features: [],
    condition: 'New',
    dealerID: dealerId || '',
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [featureInput, setFeatureInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [dealers, setDealers] = useState<IDealerListItem[]>([]);
  const [dealerSearchTerm, setDealerSearchTerm] = useState('');
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dealerDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchKey = `${id || 'new'}-${isEdit}`;
    
    if (isFetchingRef.current && lastFetchKeyRef.current === fetchKey) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchKeyRef.current = fetchKey;

    const fetchData = async () => {
      try {
        // Fetch dealers using users API with role=dealer
        const dealersResponse = await getUsers({ limit: 100, role: 'dealer', status: 'active' });
        // Map users to dealer format
        const mappedDealers: IDealerListItem[] = dealersResponse.users.map((user) => ({
          id: user.id,
          name: user.name,
          businessName: user.name,
          phone: user.phone,
          email: user.email,
          status: 'approved' as const,
          location: '',
          rating: 0,
          totalOrders: user.ordersCount || 0,
          createdDate: user.createdDate,
        }));
        setDealers(mappedDealers);

        // Fetch vehicle if editing
        if (isEdit && id) {
          setLoading(true);
          const vehicle = await getVehicleById(id);
          
          // Use dealerID from vehicle response, which should match one of the dealers in the list
          const vehicleDealerId = vehicle.dealerID || dealerId || '';
          
          setFormData({
            vehicleType: vehicle.vehicleType || '',
            brand: vehicle.brand || '',
            vehicleModel: vehicle.vehicleModel || '',
            year: vehicle.year || new Date().getFullYear(),
            price: vehicle.price || 0,
            availability: vehicle.availability || 'available',
            numberPlate: vehicle.numberPlate || '',
            mileage: vehicle.mileage || 0,
            color: vehicle.color || '',
            fuelType: vehicle.fuelType || 'Petrol',
            transmission: vehicle.transmission || 'Manual',
            description: vehicle.description || '',
            features: vehicle.features || [],
            condition: vehicle.condition || 'New',
            dealerID: vehicleDealerId,
            images: vehicle.images || [],
          });
          // Existing images are already set in formData.images above
          // We'll display them separately from new image previews
        } else if (dealerId) {
          setFormData((prev) => ({ ...prev, dealerID: dealerId }));
        }
      } catch (error) {
        if ((error as any)?.name !== 'AbortError') {
          console.error('Error fetching data:', error);
          showToast('Failed to load data', 'error');
          if (isEdit) {
            navigate('/vehicles');
          }
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, dealerId, isEdit, navigate, showToast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.vehicleModel.trim()) {
      newErrors.vehicleModel = 'Model is required';
    }

    if (!formData.vehicleType.trim()) {
      newErrors.vehicleType = 'Vehicle type is required';
    }

    if (formData.year < 1900 || formData.year > new Date().getFullYear() + 1) {
      newErrors.year = 'Please enter a valid year';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (!formData.numberPlate.trim()) {
      newErrors.numberPlate = 'Number plate is required';
    }

    if (formData.mileage < 0) {
      newErrors.mileage = 'Mileage cannot be negative';
    }

    if (!formData.color.trim()) {
      newErrors.color = 'Color is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!formData.dealerID) {
      newErrors.dealerID = 'Dealer is required';
    }

    // Validate images for new vehicles
    if (!isEdit && selectedImages.length === 0) {
      setImageError('At least one vehicle image is required');
      setErrors(newErrors);
      return false;
    }

    setErrors(newErrors);
    setImageError('');
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageError('');

    if (files.length === 0) return;

    // Validate file types - only images
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const invalidFiles = files.filter((file) => !validImageTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setImageError('Please select valid image files (JPG, PNG, WebP, or GIF)');
      return;
    }

    // Validate file sizes (max 10MB each)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setImageError('Image size must be less than 10MB per file');
      return;
    }

    setSelectedImages((prev) => [...prev, ...files]);
    
    // Create previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setImageError('');
  };

  const handleRemoveExistingImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);

      if (!formData.dealerID) {
        showToast('Please select a dealer', 'error');
        return;
      }

      // Convert images to data URI format (data:image/jpeg;base64,...)
      const imagesArray: string[] = [];
      if (selectedImages.length > 0) {
        try {
          const dataURIPromises = selectedImages.map(
            (file) =>
              new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  if (typeof reader.result === 'string') {
                    // Send full data URI (data:image/jpeg;base64,...)
                    resolve(reader.result);
                  } else {
                    reject(new Error('Failed to convert image to data URI'));
                  }
                };
                reader.onerror = () => reject(new Error('Error reading file'));
                reader.readAsDataURL(file);
              })
          );
          const dataURIs = await Promise.all(dataURIPromises);
          imagesArray.push(...dataURIs);
        } catch (error) {
          console.error('Error converting images to data URI:', error);
          showToast('Failed to process images', 'error');
          return;
        }
      } else if (formData.images && formData.images.length > 0) {
        // Use existing images - if they're not data URIs, convert them
        const processedImages = formData.images.map((img) => {
          if (img.startsWith('data:')) {
            // Already a data URI, use as-is
            return img;
          }
          // If it's base64 without prefix, add the data URI prefix
          // Otherwise assume it's a URL and use as-is
          return img;
        });
        imagesArray.push(...processedImages);
      }

      // Prepare payload according to API structure
      const payload: ICreateVehiclePayload = {
        vehicleType: formData.vehicleType,
        brand: formData.brand,
        vehicleModel: formData.vehicleModel,
        year: formData.year,
        price: formData.price,
        availability: formData.availability,
        numberPlate: formData.numberPlate,
        mileage: formData.mileage,
        color: formData.color,
        fuelType: formData.fuelType,
        transmission: formData.transmission,
        description: formData.description,
        features: formData.features || [],
        condition: formData.condition,
        ...(imagesArray.length > 0 && { images: imagesArray }),
      };

      if (isEdit && id) {
        await updateVehicle(formData.dealerID, id, payload);
        showToast('Vehicle updated successfully', 'success');
      } else {
        await createVehicle(formData.dealerID, payload);
        showToast('Vehicle created successfully', 'success');
      }
      navigate('/vehicles');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      showToast(isEdit ? 'Failed to update vehicle' : 'Failed to create vehicle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeature = () => {
    if (featureInput.trim() && !formData.features?.includes(featureInput.trim())) {
      setFormData({
        ...formData,
        features: [...(formData.features || []), featureInput.trim()],
      });
      setFeatureInput('');
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFormData({
      ...formData,
      features: formData.features?.filter((f) => f !== feature) || [],
    });
  };

  // Filter dealers based on search term
  const filteredDealers = useMemo(() => {
    if (!dealerSearchTerm.trim()) {
      return dealers;
    }
    const searchLower = dealerSearchTerm.toLowerCase();
    return dealers.filter(
      (dealer) =>
        dealer.name.toLowerCase().includes(searchLower) ||
        dealer.businessName.toLowerCase().includes(searchLower) ||
        dealer.email.toLowerCase().includes(searchLower)
    );
  }, [dealers, dealerSearchTerm]);

  // Handle dealer selection
  const handleDealerSelect = useCallback((dealerId: string) => {
    setFormData((prev) => ({ ...prev, dealerID: dealerId }));
    setShowDealerDropdown(false);
    setDealerSearchTerm('');
    setErrors((prev) => ({ ...prev, dealerID: undefined }));
  }, []);

  // Close dealer dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dealerDropdownRef.current && !dealerDropdownRef.current.contains(event.target as Node)) {
        setShowDealerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (loading) {
    return (
      <div>
        <Breadcrumbs />
        <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div>
      <Breadcrumbs />
      <h1
        style={{
          marginBottom: theme.spacing.xl,
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: theme.colors.text,
        }}
        className="text-xl sm:text-2xl"
      >
        {isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          {/* Dealer Selection */}
          <div style={{ marginBottom: theme.spacing.md, position: 'relative' }} ref={dealerDropdownRef}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Dealer <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div
                onClick={() => {
                  setShowDealerDropdown(!showDealerDropdown);
                  if (!showDealerDropdown) {
                    setDealerSearchTerm('');
                  }
                }}
                style={{
                  width: '100%',
                  padding: theme.spacing.sm,
                  border: `1px solid ${errors.dealerID ? theme.colors.error : '#cbd5e1'}`,
                  borderRadius: '0.5rem',
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '42px',
                  outline: 'none',
                  transition: 'all 0.2s',
                }}
                onFocus={(e) => {
                  if (!errors.dealerID) {
                    e.currentTarget.style.borderColor = '#1e40af';
                    e.currentTarget.style.boxShadow = '0 0 0 1px #1e40af';
                  }
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.dealerID ? theme.colors.error : '#cbd5e1';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span
                  style={{
                    color: formData.dealerID
                      ? theme.colors.text
                      : theme.colors.text + '80',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    textAlign: 'left',
                  }}
                >
                  {formData.dealerID && dealers.find((d) => d.id === formData.dealerID)
                    ? `${dealers.find((d) => d.id === formData.dealerID)?.name} (${dealers.find((d) => d.id === formData.dealerID)?.businessName})`
                    : 'Select a dealer'}
                </span>
                <span style={{ marginLeft: theme.spacing.sm, fontSize: '0.875rem' }}>
                  {showDealerDropdown ? '▲' : '▼'}
                </span>
              </div>

              {showDealerDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.surface,
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    marginTop: theme.spacing.xs,
                    maxHeight: '400px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ padding: theme.spacing.sm, borderBottom: `1px solid ${theme.colors.border}` }}>
                    <input
                      type="text"
                      value={dealerSearchTerm}
                      onChange={(e) => setDealerSearchTerm(e.target.value)}
                      placeholder="Search dealers..."
                      style={{
                        width: '100%',
                        padding: theme.spacing.sm,
                        border: `1px solid ${theme.colors.border}`,
                        borderRadius: theme.borderRadius.md,
                        backgroundColor: theme.colors.surface,
                        color: theme.colors.text,
                        fontSize: '1rem',
                        outline: 'none',
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.stopPropagation()}
                    />
                  </div>
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredDealers.length > 0 ? (
                      filteredDealers.map((dealer) => (
                        <div
                          key={dealer.id}
                          onClick={() => handleDealerSelect(dealer.id)}
                          style={{
                            padding: theme.spacing.sm,
                            cursor: 'pointer',
                            borderBottom: `1px solid ${theme.colors.border}`,
                            backgroundColor:
                              formData.dealerID === dealer.id
                                ? theme.colors.primary + '20'
                                : 'transparent',
                          }}
                          onMouseEnter={(e) => {
                            if (formData.dealerID !== dealer.id) {
                              (e.currentTarget as HTMLElement).style.backgroundColor =
                                theme.colors.border + '40';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (formData.dealerID !== dealer.id) {
                              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                            }
                          }}
                        >
                          <div style={{ fontWeight: '500', color: theme.colors.text }}>
                            {dealer.name}
                          </div>
                          <div style={{ fontSize: '0.875rem', color: theme.colors.text, opacity: 0.7 }}>
                            {dealer.businessName} • {dealer.email}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div
                        style={{
                          padding: theme.spacing.md,
                          textAlign: 'center',
                          color: theme.colors.text,
                          opacity: 0.7,
                        }}
                      >
                        No dealers found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.dealerID && (
              <div
                style={{
                  marginTop: theme.spacing.xs,
                  color: theme.colors.error,
                  fontSize: '0.875rem',
                }}
              >
                {errors.dealerID}
              </div>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <Input
              label="Brand"
              value={formData.brand}
              onChange={(value) => {
                setFormData({ ...formData, brand: value });
                setErrors({ ...errors, brand: undefined });
              }}
              placeholder="Enter brand"
              error={errors.brand}
              required
            />

            <Input
              label="Model"
              value={formData.vehicleModel}
              onChange={(value) => {
                setFormData({ ...formData, vehicleModel: value });
                setErrors({ ...errors, vehicleModel: undefined });
              }}
              placeholder="Enter model"
              error={errors.vehicleModel}
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
                Vehicle Type <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.vehicleType}
                onChange={(value) => {
                  setFormData({ ...formData, vehicleType: value });
                  setErrors({ ...errors, vehicleType: undefined });
                }}
                placeholder="Select vehicle type"
                required
                error={errors.vehicleType}
                options={[
                  { value: 'Car', label: 'Car' },
                  { value: 'Bike', label: 'Bike' },
                ]}
              />
            </div>

            <Input
              label="Year"
              type="number"
              value={formData.year.toString()}
              onChange={(value) => {
                setFormData({ ...formData, year: parseInt(value) || new Date().getFullYear() });
                setErrors({ ...errors, year: undefined });
              }}
              placeholder="2024"
              error={errors.year}
              required
            />

            <Input
              label="Price"
              type="number"
              value={formData.price.toString()}
              onChange={(value) => {
                setFormData({ ...formData, price: parseFloat(value) || 0 });
                setErrors({ ...errors, price: undefined });
              }}
              placeholder="0.00"
              error={errors.price}
              required
            />

            <Input
              label="Number Plate"
              value={formData.numberPlate}
              onChange={(value) => {
                setFormData({ ...formData, numberPlate: value.toUpperCase() });
                setErrors({ ...errors, numberPlate: undefined });
              }}
              placeholder="Enter number plate"
              error={errors.numberPlate}
              required
            />

            <Input
              label="Mileage"
              type="number"
              value={formData.mileage.toString()}
              onChange={(value) => {
                setFormData({ ...formData, mileage: parseInt(value) || 0 });
                setErrors({ ...errors, mileage: undefined });
              }}
              placeholder="0"
              error={errors.mileage}
              required
            />

            <Input
              label="Color"
              value={formData.color}
              onChange={(value) => {
                setFormData({ ...formData, color: value });
                setErrors({ ...errors, color: undefined });
              }}
              placeholder="Enter color"
              error={errors.color}
              required
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
            <div style={{ marginBottom: theme.spacing.md }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: theme.spacing.xs,
                  color: theme.colors.text,
                  fontWeight: '500',
                }}
              >
                Fuel Type <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.fuelType}
                onChange={(value) => {
                  setFormData({ ...formData, fuelType: value as IVehicleFormData['fuelType'] });
                }}
                placeholder="Select fuel type"
                required
                options={[
                  { value: 'Petrol', label: 'Petrol' },
                  { value: 'Diesel', label: 'Diesel' },
                  { value: 'Electric', label: 'Electric' },
                  { value: 'Hybrid', label: 'Hybrid' },
                ]}
              />
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
                Transmission <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.transmission}
                onChange={(value) => {
                  setFormData({ ...formData, transmission: value as IVehicleFormData['transmission'] });
                }}
                placeholder="Select transmission"
                required
                options={[
                  { value: 'Manual', label: 'Manual' },
                  { value: 'Automatic', label: 'Automatic' },
                ]}
              />
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
                Condition <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.condition}
                onChange={(value) => {
                  setFormData({ ...formData, condition: value as IVehicleFormData['condition'] });
                }}
                placeholder="Select condition"
                required
                options={[
                  { value: 'New', label: 'New' },
                  { value: 'Used', label: 'Used' },
                  { value: 'Refurbished', label: 'Refurbished' },
                ]}
              />
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
                Availability <span style={{ color: theme.colors.error }}>*</span>
              </label>
              <Select
                value={formData.availability}
                onChange={(value) => {
                  setFormData({ ...formData, availability: value as IVehicleFormData['availability'] });
                }}
                placeholder="Select availability"
                required
                options={[
                  { value: 'available', label: 'Available' },
                  { value: 'sold', label: 'Sold' },
                  { value: 'reserved', label: 'Reserved' },
                ]}
              />
            </div>
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
              Description <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: undefined });
              }}
              placeholder="Enter vehicle description"
              rows={4}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${errors.description ? theme.colors.error : '#cbd5e1'}`,
                borderRadius: '0.5rem',
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                outline: 'none',
                transition: 'all 0.2s',
              }}
              onFocus={(e) => {
                if (!errors.description) {
                  e.target.style.borderColor = '#1e40af';
                  e.target.style.boxShadow = '0 0 0 1px #1e40af';
                }
              }}
              onBlur={(e) => {
                e.target.style.borderColor = errors.description ? theme.colors.error : '#cbd5e1';
                e.target.style.boxShadow = 'none';
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

          {/* Features */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Features
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={featureInput}
                    onChange={(e) => setFeatureInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature();
                      }
                    }}
                    placeholder="Add a feature"
                    style={{
                      width: '100%',
                      padding: theme.spacing.sm,
                    border: '1px solid #cbd5e1',
                    borderRadius: '0.5rem',
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    fontSize: '1rem',
                    outline: 'none',
                    height: '42px',
                    boxSizing: 'border-box',
                    transition: 'all 0.2s',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#1e40af';
                    e.target.style.boxShadow = '0 0 0 1px #1e40af';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#cbd5e1';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  style={{
                    height: '42px',
                    padding: `0 ${theme.spacing.md}`,
                  backgroundColor: '#1e40af',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '80px',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e3a8a';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#1e40af';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                Add
              </button>
              </div>
            </div>
            {formData.features && formData.features.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {formData.features.map((feature) => (
                  <span
                    key={feature}
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: theme.colors.primary,
                      color: '#ffffff',
                      borderRadius: theme.borderRadius.sm,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: theme.spacing.xs,
                    }}
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(feature)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        padding: 0,
                        marginLeft: theme.spacing.xs,
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images Upload */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Vehicle Images {!isEdit && <span style={{ color: theme.colors.error }}>*</span>}
            </label>
            
            {/* Existing Images (from API) */}
            {formData.images && formData.images.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {formData.images.map((img, index) => (
                  <div
                    key={`existing-${index}`}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <img
                      src={img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}`}
                      alt={`Vehicle image ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.border}`,
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingImage(index)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: theme.colors.error,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New Image Previews */}
            {imagePreviews.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                  gap: theme.spacing.sm,
                  marginBottom: theme.spacing.sm,
                }}
              >
                {imagePreviews.map((preview, index) => (
                  <div
                    key={`new-${index}`}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                    }}
                  >
                    <img
                      src={preview.startsWith('data:') ? preview : `data:image/jpeg;base64,${preview}`}
                      alt={`Vehicle preview ${index + 1}`}
                      style={{
                        width: '100%',
                        height: '150px',
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.border}`,
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: theme.colors.error,
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
              multiple
              onChange={handleImageChange}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: `1px solid ${imageError ? theme.colors.error : theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surface,
                color: theme.colors.text,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            />
            {imageError && (
              <div
                style={{
                  marginTop: theme.spacing.xs,
                  color: theme.colors.error,
                  fontSize: '0.875rem',
                }}
              >
                {imageError}
              </div>
            )}
            <div
              style={{
                marginTop: theme.spacing.xs,
                color: theme.colors.text,
                fontSize: '0.75rem',
                opacity: 0.7,
              }}
            >
              Accepted formats: JPG, PNG, WebP, GIF (Max 10MB per file). You can select multiple images.
            </div>
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/vehicles')}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Update Vehicle' : 'Create Vehicle'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

