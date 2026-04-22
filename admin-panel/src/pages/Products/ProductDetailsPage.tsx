import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ImagePreviewModal } from '@components/ImagePreviewModal/ImagePreviewModal';
import { SkeletonCard } from '@components/Skeleton';
import { getProductById } from '@services/productService';
import { getUsers } from '@services/userService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { motion } from 'framer-motion';
import { ArrowLeft,Edit, Package } from 'lucide-react';
import { useEffect, useRef,useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IDealerListItem } from '../../types/dealer';
import { IProduct } from '../../types/product';

export const ProductDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [product, setProduct] = useState<IProduct | null>(null);
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

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);

        // Extract userId from product response
        const productUserId = (productData as { userId?: string; dealerID?: string }).userId || productData.dealerID || '';

        // Fetch dealer information if userId exists
        if (productUserId) {
          try {
            const dealersResponse = await getUsers({ limit: 100, role: 'dealer', status: 'active' });
            const foundDealer = dealersResponse.users.find((user: { id: string; name: string; phone: string; email: string; ordersCount?: number; createdDate: string }) => user.id === productUserId);
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

        setProduct(productData);
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching product:', error);
          showToast('Failed to load product details', 'error');
          navigate('/products');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchProduct();

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

  if (!product) {
    return (
      <div>
        <Breadcrumbs />
        <Card>
          <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
            <p style={{ color: theme.colors.text, margin: 0 }}>Product not found</p>
            <Button
              variant="outline"
              onClick={() => navigate('/products')}
              style={{ marginTop: theme.spacing.md }}
            >
              Back to Products
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0 ? product.images : [product.image].filter(Boolean);

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
          Product Details
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          <Button variant="outline" onClick={() => navigate('/products')} icon={ArrowLeft}>
            Back
          </Button>
          <Button variant="outline" onClick={() => navigate(`/products/${id}/edit`)} icon={Edit}>
            Edit
          </Button>
        </div>
      </div>

      {/* Product Information */}
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
                <Package size={24} style={{ color: theme.colors.primary }} />
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
                  {product.name}
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginTop: theme.spacing.xs,
                    fontSize: '0.875rem',
                    color: theme.colors.textSecondary,
                  }}
                >
                  Product Information
                </p>
              </div>
              {/* Product Images Thumbnails */}
              {productImages.length > 0 && (
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
                  {productImages.map((img, index) => (
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
                          alt={`${product.name} thumbnail ${index + 1}`}
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
                  Product Name
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {product.name}
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
                  {product.brand || 'N/A'}
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
                  Category
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: theme.colors.text,
                  }}
                >
                  {product.category}
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
                  ₹{product.price.toFixed(2)}
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
                  Stock
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color:
                      product.stock === 0
                        ? theme.colors.error
                        : product.stock < 50
                        ? theme.colors.warning
                        : theme.colors.text,
                  }}
                >
                  {product.stock}
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
                  Status
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
                      backgroundColor:
                        product.status === 'active'
                          ? theme.colors.success + '20'
                          : product.status === 'out_of_stock'
                          ? theme.colors.error + '20'
                          : theme.colors.secondary + '20',
                      color:
                        product.status === 'active'
                          ? theme.colors.success
                          : product.status === 'out_of_stock'
                          ? theme.colors.error
                          : theme.colors.text,
                    }}
                  >
                    {product.status.charAt(0).toUpperCase() + product.status.slice(1).replace('_', ' ')}
                  </span>
                </p>
              </div>

              {product.vehicleType && (
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
                    {product.vehicleType}
                  </p>
                </div>
              )}

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

              {product.createdDate && (
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
                    {formatDate(product.createdDate)}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
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
                  {product.description}
                </p>
              </div>
            )}

            {/* Return Policy */}
            {product.returnPolicy && (
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
                  Return Policy
                </label>
                <p
                  style={{
                    margin: 0,
                    fontSize: '0.875rem',
                    color: theme.colors.text,
                    lineHeight: '1.6',
                  }}
                >
                  {product.returnPolicy}
                </p>
              </div>
            )}

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
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
                  Tags
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                        backgroundColor: theme.colors.primary + '20',
                        color: theme.colors.primary,
                        borderRadius: theme.borderRadius.sm,
                        fontSize: '0.75rem',
                        fontWeight: '500',
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Specifications */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
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
                  Specifications
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: theme.spacing.sm,
                  }}
                >
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div
                      key={key}
                      style={{
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.surface,
                        borderRadius: theme.borderRadius.md,
                        border: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: theme.colors.textSecondary,
                          marginBottom: theme.spacing.xs,
                        }}
                      >
                        {key}
                      </div>
                      <div
                        style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: theme.colors.text,
                        }}
                      >
                        {value}
                      </div>
                    </div>
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
        images={productImages}
        title={`${product.name} - Images`}
      />
    </div>
  );
};

