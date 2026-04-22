import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { Select } from '@components/Select';
import { SkeletonCard } from '@components/Skeleton';
import { getCategories } from '@services/categoryService';
import { getBusinessRegistration } from '@services/dealerService';
import { createProduct, getProductById, type ICreateProductPayload,updateProduct } from '@services/productService';
import { getUsers } from '@services/userService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerListItem } from '../../types/dealer';
import { IProductFormData } from '../../types/product';

export const ProductFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');
  const [loading, setLoading] = useState(isEdit);
  const [formData, setFormData] = useState<IProductFormData>({
    name: '',
    brand: '',
    category: '',
    description: '',
    price: 0,
    stock: 0,
    vehicleType: '',
    returnPolicy: '',
    dealerID: '',
    tags: [],
    specifications: {},
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [dealers, setDealers] = useState<IDealerListItem[]>([]);
  const [dealerSearchTerm, setDealerSearchTerm] = useState('');
  const [showDealerDropdown, setShowDealerDropdown] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string>('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dealerDropdownRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchKey = `${id || 'new'}-${isEdit}`;
    
    // Prevent duplicate calls for same key
    if (isFetchingRef.current && lastFetchKeyRef.current === fetchKey) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchKeyRef.current = fetchKey;

    const fetchData = async () => {
      try {
        // Fetch categories
        const categoriesResponse = await getCategories();
        setCategories(categoriesResponse.categories.map((cat: { id: string; name: string }) => ({ id: cat.id, name: cat.name })));

        // Fetch dealers using users API with role=dealer
        const dealersResponse = await getUsers({ limit: 100, role: 'dealer', status: 'active' });
        // Map users to dealer format
        const mappedDealers: IDealerListItem[] = dealersResponse.users.map((user: { id: string; name: string; phone: string; email: string; ordersCount?: number; createdDate: string }) => ({
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

        // Fetch product if editing
        if (isEdit && id) {
          setLoading(true);
          const product = await getProductById(id);
          
          // Extract business registration ID from product response
          const businessRegistrationId = (product as { userId?: string; dealerID?: string }).userId || product.dealerID || '';
          
          // Fetch business registration to get the userId for matching with dealers dropdown
          let dealerUserId = businessRegistrationId; // Default to business registration ID if API fails
          if (businessRegistrationId) {
            try {
              const businessRegResponse = await getBusinessRegistration(businessRegistrationId);
              // Extract userId from business registration response
              if (businessRegResponse.Response?.userId) {
                dealerUserId = businessRegResponse.Response.userId;
              }
            } catch (error) {
              // Business registration API might fail, but we don't want to block product editing
              // The error will be handled by the API client interceptor and show toast if needed
              console.error('Error fetching business registration:', error);
            }
          }
          
          setFormData({
            name: product.name,
            brand: product.brand || '',
            category: product.category || '',
            description: product.description,
            price: product.price,
            stock: product.stock,
            vehicleType: product.vehicleType || '',
            returnPolicy: product.returnPolicy || '',
            dealerID: dealerUserId, // Use userId from business registration response - this will match with dealers list
            tags: product.tags || [],
            specifications: product.specifications || {},
            image: (product as { images?: string[]; image?: string }).images?.[0] || product.image || '',
            images: product.images || [],
          });
          
          // Clear imagePreviews for edit mode - it should only contain newly selected images
          setImagePreviews([]);
        }
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching data:', error);
          showToast('Failed to load data', 'error');
          if (isEdit) {
            navigate('/products');
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
  }, [id, isEdit, navigate, showToast]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!formData.brand.trim()) {
      newErrors.brand = 'Brand is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    if (!formData.vehicleType.trim()) {
      newErrors.vehicleType = 'Vehicle type is required';
    }

    if (!formData.dealerID) {
      newErrors.dealerID = 'Dealer is required';
    }

    // Validate image for new products
    if (!isEdit && selectedImages.length === 0 && (!formData.images || formData.images.length === 0)) {
      setImageError('At least one product image is required');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const selectedCategory = categories.find((cat) => cat.name === formData.category);

      if (!selectedCategory) {
        showToast('Please select a valid category', 'error');
        return;
      }

      if (!formData.dealerID) {
        showToast('Please select a dealer', 'error');
        return;
      }

      // Prepare images array - convert to data URI format
      const imagesArray: string[] = [];
      
      // Process newly selected images
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
      }
      
      // Add existing images if editing
      if (formData.images && formData.images.length > 0) {
        // Use existing images - check if they're URLs, data URIs, or base64 strings
        const processedImages = formData.images.map((img) => {
          // If it's already a data URI or URL, use as-is
          if (img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')) {
            return img;
          }
          // If it's base64 without prefix, add the data URI prefix
          // Otherwise assume it's a URL and use as-is (fallback)
          return img;
        });
        imagesArray.push(...processedImages);
      }

      // Prepare payload according to new API structure
      // Note: dealerID is passed as path parameter, not in body
      const payload: ICreateProductPayload = {
        name: formData.name,
        brand: formData.brand,
        category: formData.category, // Using category name as string, not categoryId
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        vehicleType: formData.vehicleType,
        specifications: formData.specifications || {},
        returnPolicy: formData.returnPolicy || '',
        tags: formData.tags || [],
        ...(imagesArray.length > 0 && { images: imagesArray }),
      };

      if (isEdit && id) {
        // Update: dealerId and productId are path parameters
        await updateProduct(formData.dealerID, id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        // Create: dealerId is path parameter
        await createProduct(formData.dealerID, payload);
        showToast('Product created successfully', 'success');
      }
      navigate('/products');
    } catch (error) {
      console.error('Error saving product:', error);
      showToast(isEdit ? 'Failed to update product' : 'Failed to create product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((t) => t !== tag) || [],
    });
  };

  // Filter dealers based on search term - show all if no search term
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

  // Handle adding specification
  const handleAddSpecification = useCallback(() => {
    if (specKey.trim() && specValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        specifications: {
          ...(prev.specifications || {}),
          [specKey.trim()]: specValue.trim(),
        },
      }));
      setSpecKey('');
      setSpecValue('');
    }
  }, [specKey, specValue]);

  // Handle removing specification
  const handleRemoveSpecification = useCallback((key: string) => {
    setFormData((prev) => {
      const newSpecs = { ...(prev.specifications || {}) };
      delete newSpecs[key];
      return {
        ...prev,
        specifications: newSpecs,
      };
    });
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
          fontSize: '2rem',
          fontWeight: 'bold',
          color: theme.colors.text,
        }}
      >
        {isEdit ? 'Edit Product' : 'Add Product'}
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>
          <Input
            label="Product Name"
            value={formData.name}
            onChange={(value) => {
              setFormData({ ...formData, name: value });
              setErrors({ ...errors, name: undefined });
            }}
            placeholder="Enter product name"
            error={errors.name}
            required
          />

          <Input
            label="Brand"
            value={formData.brand}
            onChange={(value) => {
              setFormData({ ...formData, brand: value });
              setErrors({ ...errors, brand: undefined });
            }}
            placeholder="Enter brand name"
            error={errors.brand}
            required
          />

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
              {/* Dropdown Button/Input */}
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
                  border: `1px solid ${errors.dealerID ? theme.colors.error : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  backgroundColor: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  minHeight: '42px',
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

              {/* Dropdown Menu */}
              {showDealerDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: theme.colors.surface,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.borderRadius.md,
                    marginTop: theme.spacing.xs,
                    maxHeight: '400px',
                    overflow: 'hidden',
                    zIndex: 1000,
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* Search Input */}
                  <div style={{ padding: theme.spacing.sm, borderBottom: `1px solid ${theme.colors.border}` }}>
                    <Input
                      value={dealerSearchTerm}
                      onChange={(value) => {
                        setDealerSearchTerm(value);
                      }}
                      placeholder="Search dealers..."
                      onFocus={(e) => {
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    />
                  </div>

                  {/* Dealers List */}
                  <div
                    style={{
                      maxHeight: '300px',
                      overflowY: 'auto',
                    }}
                  >
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

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Category <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <Select
              value={formData.category}
              onChange={(value) => {
                setFormData({ ...formData, category: value });
                setErrors({ ...errors, category: undefined });
              }}
              placeholder="Select a category"
              required
              searchable={categories.length > 5}
              error={errors.category}
              options={categories.map((cat) => ({
                value: cat.name,
                label: cat.name,
              }))}
            />
            {errors.category && (
              <div
                style={{
                  marginTop: theme.spacing.xs,
                  color: theme.colors.error,
                  fontSize: '0.875rem',
                }}
              >
                {errors.category}
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
              Description <span style={{ color: theme.colors.error }}>*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData({ ...formData, description: e.target.value });
                setErrors({ ...errors, description: undefined });
              }}
              placeholder="Enter product description"
              rows={4}
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: theme.spacing.md,
              marginBottom: theme.spacing.md,
            }}
          >
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
              label="Stock"
              type="number"
              value={formData.stock.toString()}
              onChange={(value) => {
                setFormData({ ...formData, stock: parseInt(value) || 0 });
                setErrors({ ...errors, stock: undefined });
              }}
              placeholder="0"
              error={errors.stock}
              required
            />
          </div>

          <Input
            label="Vehicle Type"
            value={formData.vehicleType}
            onChange={(value) => {
              setFormData({ ...formData, vehicleType: value });
              setErrors({ ...errors, vehicleType: undefined });
            }}
            placeholder="e.g., Car, Bike, Truck"
            error={errors.vehicleType}
            required
          />

          {/* Specifications */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Specifications
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecification();
                      }
                    }}
                    placeholder="Key (e.g., weight)"
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
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSpecification();
                      }
                    }}
                    placeholder="Value (e.g., 500g)"
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
                  onClick={handleAddSpecification}
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
            {formData.specifications && Object.keys(formData.specifications).length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {Object.entries(formData.specifications).map(([key, value]) => (
                  <span
                    key={key}
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
                    <strong>{key}:</strong> {value}
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecification(key)}
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

          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Return Policy
            </label>
            <textarea
              value={formData.returnPolicy}
              onChange={(e) => {
                setFormData({ ...formData, returnPolicy: e.target.value });
              }}
              placeholder="e.g., 30 days return policy"
              rows={3}
              style={{
                width: '100%',
                padding: theme.spacing.sm,
                border: '1px solid #cbd5e1',
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
                e.target.style.borderColor = '#1e40af';
                e.target.style.boxShadow = '0 0 0 1px #1e40af';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#cbd5e1';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Image Upload */}
          <div style={{ marginBottom: theme.spacing.md }}>
            <label
              style={{
                display: 'block',
                marginBottom: theme.spacing.xs,
                color: theme.colors.text,
                fontWeight: '500',
              }}
            >
              Product Images {!isEdit && <span style={{ color: theme.colors.error }}>*</span>}
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
                      src={
                        img.startsWith('data:') || img.startsWith('http://') || img.startsWith('https://')
                          ? img
                          : `data:image/jpeg;base64,${img}`
                      }
                      alt={`Product image ${index + 1}`}
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
                      src={preview}
                      alt={`Product preview ${index + 1}`}
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
              Accepted formats: JPG, PNG, WebP, GIF (Max 10MB)
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
              Tags
            </label>
            <div style={{ display: 'flex', gap: theme.spacing.sm, marginBottom: theme.spacing.sm, alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: 0 }}>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    placeholder="Add a tag"
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
                  onClick={handleAddTag}
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
            {formData.tags && formData.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
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
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '1rem',
                      }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/products')}
            >
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {isEdit ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

