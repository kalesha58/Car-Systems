import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { BusinessRegistrationModal } from '@components/BusinessRegistrationModal/BusinessRegistrationModal';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Modal } from '@components/Modal/Modal';
import { SkeletonCard } from '@components/Skeleton';
import { Table } from '@components/Table/Table';
import { getBusinessRegistrationByUserId, type IUpdateBusinessRegistrationStatusPayload,updateBusinessRegistrationStatus } from '@services/dealerService';
import { getUserById, getUserOrders, type IUserOrdersResponse, updateUserStatus } from '@services/userService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { Building2, Edit } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { IUserDetails } from '../../types/user';

export const UserDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isDealerContext = location.pathname.startsWith('/dealers');
  const [user, setUser] = useState<IUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showBusinessRegistrationModal, setShowBusinessRegistrationModal] = useState(false);
  const [hasBusinessRegistration, setHasBusinessRegistration] = useState<boolean | null>(null);
  const [businessRegistrationData, setBusinessRegistrationData] = useState<any | null>(null);

  const [updating, setUpdating] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isFetchingRef = useRef(false);
  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    // Prevent duplicate calls for same ID
    if (isFetchingRef.current && lastFetchedIdRef.current === id) return;
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isFetchingRef.current = true;
    lastFetchedIdRef.current = id;

    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const [userData, ordersData] = await Promise.all([
          getUserById(id),
          getUserOrders(id),
        ]);

        const ordersResponse = ordersData as IUserOrdersResponse;

        setUser({
          ...userData,
          createdDate: (userData as { createdAt?: string; createdDate?: string }).createdAt || userData.createdDate,
          role: ((userData as { role?: string | string[]; roles?: string[] }).role || (userData as { role?: string | string[]; roles?: string[] }).roles || ['user']) as string[],
          orders: ordersResponse.orders.map((order) => ({
            id: order.id,
            date: order.date,
            amount: order.amount,
            status: order.status,
          })),
          /*
          vehicles: vehiclesResponse.vehicles.map((vehicle) => ({
            id: vehicle.id,
            make: vehicle.brand,
            model: vehicle.model,
            year: vehicle.year || 0,
            licensePlate: vehicle.numberPlate,
          })),
          */
        } as IUserDetails);



        // Use isBusinessRegistration flag from user data for dealers
        if (isDealerContext && id) {
          try {
            const regData = await getBusinessRegistrationByUserId(id);
            if (regData.Response) {
              setBusinessRegistrationData(regData.Response);
              setHasBusinessRegistration(true);
            } else {
              setHasBusinessRegistration(false);
            }
          } catch (err) {
            // console.error('Failed to fetch business registration', err);
            setHasBusinessRegistration(false);
          }
        }
      } catch (error) {
        if ((error as { name?: string })?.name !== 'AbortError') {
          console.error('Error fetching user details:', error);
          showToast('Failed to load user details', 'error');
        }
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
      }
    };

    fetchUserDetails();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [id, isDealerContext, showToast]);

  const handleUpdateBusinessStatus = async (status: 'approved' | 'rejected') => {
    if (!businessRegistrationData?.id) return;
    
    try {
      setUpdating(true);
      const payload: IUpdateBusinessRegistrationStatusPayload = {
        status,
      };
      
      const response = await updateBusinessRegistrationStatus(businessRegistrationData.id, payload);
      
      if (response.success && response.Response) {
        setBusinessRegistrationData({ ...businessRegistrationData, status });
        showToast(`Business registration ${status} successfully`, 'success');
        setShowStatusModal(false);
      }
    } catch (error) {
      console.error(`Error updating business registration status to ${status}:`, error);
      showToast(`Failed to ${status === 'approved' ? 'approve' : 'reject'} business registration`, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleBlock = async () => {
    if (!user || !id) return;

    try {
      setUpdating(true);
      // Map status correctly: active -> inactive, inactive/blocked -> active
      // Per Swagger: "blocked" maps to "inactive" on backend
      let newStatus: 'active' | 'inactive' | 'suspended' | 'blocked';
      if (user.status === 'active') {
        newStatus = 'blocked'; // Frontend shows 'blocked', backend maps to 'inactive'
      } else if (user.status === 'blocked' || user.status === 'inactive') {
        newStatus = 'active';
      } else {
        // If suspended or other status, toggle to active
        newStatus = 'active';
      }
      
      await updateUserStatus(id, { status: newStatus });
      setUser({ ...user, status: newStatus });
      showToast(`${isDealerContext ? 'Dealer' : 'User'} ${newStatus === 'active' ? 'unblocked' : 'blocked'} successfully`, 'success');
      setShowBlockModal(false);
    } catch (error) {
      console.error('Error updating user status:', error);
      showToast('Failed to update user status', 'error');
    } finally {
      setUpdating(false);
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

  if (!user) {
    return (
      <div>
        <Breadcrumbs />
        <Card>
          <p style={{ color: theme.colors.error }}>User not found</p>
          <Button onClick={() => navigate(isDealerContext ? '/dealers' : '/users')}>
            Back to {isDealerContext ? 'Dealers' : 'Users'}
          </Button>
        </Card>
      </div>
    );
  }



  const orderColumns = [
    { key: 'id', header: 'Order ID' },
    {
      key: 'date',
      header: 'Date',
      render: (order: { date: string }) =>
        new Date(order.date).toLocaleDateString(),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (order: { amount: number }) => {
        const amount = typeof order.amount === 'number' ? order.amount : 0;
        return `$${amount.toFixed(2)}`;
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (order: { status: string }) => (
        <span
          style={{
            padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
            borderRadius: theme.borderRadius.sm,
            backgroundColor:
              order.status === 'completed'
                ? theme.colors.success
                : order.status === 'cancelled'
                ? theme.colors.error
                : theme.colors.warning,
            color: '#ffffff',
            fontSize: '0.875rem',
          }}
        >
          {order.status}
        </span>
      ),
    },
  ];

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
          {isDealerContext ? 'Dealer Details' : 'User Details'}
        </h1>
        <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
          {/*isDealerContext && !hasBusinessRegistration && (
            <Button
              variant="primary"
              onClick={() => setShowBusinessRegistrationModal(true)}
              icon={Building2}
            >
              Register Business
            </Button>
          )*/}
          <Button
            variant={user.status === 'active' ? 'danger' : 'primary'}
            onClick={() => setShowBlockModal(true)}
          >
            {user.status === 'active' ? (isDealerContext ? 'Block Dealer' : 'Block User') : (isDealerContext ? 'Unblock Dealer' : 'Unblock User')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(isDealerContext ? `/dealers/${id}/edit` : `/users/${id}/edit`)}
          >
            Edit
          </Button>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
        }}
      >
        <Card title="Profile Information">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Name
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {user.name}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Email
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {user.email}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Phone
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {user.phone}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Status
              </strong>
              <p className="m-0">
                <span
                  style={{
                    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                    borderRadius: theme.borderRadius.sm,
                    backgroundColor:
                      user.status === 'active'
                        ? theme.colors.success
                        : theme.colors.error,
                    color: '#ffffff',
                    fontSize: '0.875rem',
                    display: 'inline-block',
                  }}
                >
                  {user.status}
                </span>
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Created Date
              </strong>
              <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                {new Date(user.createdDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                Roles
              </strong>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                {user.role && user.role.length > 0 ? (
                  user.role.map((role) => (
                    <span
                      key={role}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: 
                          role === 'admin' 
                            ? theme.colors.primary 
                            : role === 'dealer' 
                            ? theme.colors.warning 
                            : theme.colors.success,
                        color: '#ffffff',
                        textTransform: 'capitalize',
                        display: 'inline-block',
                      }}
                    >
                      {role}
                    </span>
                  ))
                ) : (
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      backgroundColor: theme.colors.success,
                      color: '#ffffff',
                      display: 'inline-block',
                    }}
                  >
                    user
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {!isDealerContext && user.vehicles && user.vehicles.length > 0 && (
          <Card title="Vehicles">
            {user.vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                style={{
                  padding: theme.spacing.md,
                  marginBottom: theme.spacing.sm,
                  backgroundColor: theme.colors.background,
                  borderRadius: theme.borderRadius.md,
                }}
              >
                <p style={{ margin: 0, fontWeight: 'bold' }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </p>
                <p style={{ margin: 0, color: theme.colors.textSecondary }}>
                  License: {vehicle.licensePlate}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>



      {isDealerContext && businessRegistrationData && (
        <div style={{ marginBottom: theme.spacing.xl }}>
          <Card 
            title={(
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                  <div style={{ 
                    padding: '8px', 
                    borderRadius: theme.borderRadius.md, 
                    backgroundColor: theme.colors.background,
                    color: theme.colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Building2 size={20} />
                  </div>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Business Registration Details</span>
                </div>
                
                {businessRegistrationData.status === 'pending' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setShowStatusModal(true)}
                    icon={Edit}
                  >
                    Update Status
                  </Button>
                )}
              </div>
            ) as any}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Business Name
                </strong>
                <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                  {businessRegistrationData.businessName}
                </p>
              </div>
              
              <div>
                <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Status
                </strong>
                <p className="m-0">
                  <span
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      borderRadius: theme.borderRadius.sm,
                      backgroundColor:
                        businessRegistrationData.status === 'approved'
                          ? theme.colors.success
                          : businessRegistrationData.status === 'rejected'
                          ? theme.colors.error
                          : theme.colors.warning,
                      color: '#ffffff',
                      fontSize: '0.875rem',
                      textTransform: 'capitalize',
                      display: 'inline-block',
                    }}
                  >
                    {businessRegistrationData.status || 'Pending'}
                  </span>
                </p>
              </div>

              <div>
                <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Type
                </strong>
                <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                  {businessRegistrationData.type}
                </p>
              </div>

              <div>
                <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  GST Number
                </strong>
                <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                  {businessRegistrationData.gst}
                </p>
              </div>

              <div className="md:col-span-2">
                <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                  Address
                </strong>
                <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                  {businessRegistrationData.address}
                </p>
              </div>
              
              {/* Payment Details Section */}
              {businessRegistrationData.payout && (
                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase">Payout Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                        Payment Type
                      </strong>
                      <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                        {businessRegistrationData.payout.type}
                      </p>
                    </div>
                    
                    {businessRegistrationData.payout.type === 'UPI' && businessRegistrationData.payout.upiId && (
                      <div>
                        <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                          UPI ID
                        </strong>
                        <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                          {businessRegistrationData.payout.upiId}
                        </p>
                      </div>
                    )}
                    
                    {businessRegistrationData.payout.type === 'Bank Transfer' && businessRegistrationData.payout.bank && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div>
                          <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                            Account Number
                          </strong>
                          <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                            {businessRegistrationData.payout.bank.accountNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                            IFSC Code
                          </strong>
                          <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                            {businessRegistrationData.payout.bank.ifscCode || 'N/A'}
                          </p>
                        </div>
                         <div>
                          <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                            Account Name
                          </strong>
                          <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                            {businessRegistrationData.payout.bank.accountName || 'N/A'}
                          </p>
                        </div>
                         <div>
                          <strong className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">
                            Bank Name
                          </strong>
                          <p className="m-0 text-sm md:text-base text-slate-800 dark:text-slate-200 font-medium">
                            {businessRegistrationData.payout.bank.bankName || 'N/A'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shop Photos Section */}
              {businessRegistrationData.shopPhotos && businessRegistrationData.shopPhotos.length > 0 && (
                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase">Shop Photos</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: theme.spacing.md }}>
                    {businessRegistrationData.shopPhotos.map((photo: { url: string }, index: number) => (
                      <div key={index} style={{ position: 'relative', borderRadius: theme.borderRadius.md, overflow: 'hidden' }}>
                        <img
                          src={photo.url}
                          alt={`Shop photo ${index + 1}`}
                          style={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                          }}
                          onClick={() => window.open(photo.url, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents Section */}
              {businessRegistrationData.documents && businessRegistrationData.documents.length > 0 && (
                <div className="md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase">Documents</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                    {businessRegistrationData.documents.map((doc: { kind: string; url: string }, index: number) => (
                      <div
                        key={index}
                        style={{
                          padding: theme.spacing.md,
                          backgroundColor: theme.colors.background,
                          borderRadius: theme.borderRadius.md,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <p style={{ margin: 0, fontWeight: 'bold' }}>{doc.kind}</p>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            color: theme.colors.primary,
                            textDecoration: 'none',
                            fontWeight: '500',
                          }}
                        >
                          View Document
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      <Card title="Orders">
        <Table columns={orderColumns} data={user.orders} />
      </Card>

      <ConfirmModal
        isOpen={showBlockModal}
        onClose={() => !updating && setShowBlockModal(false)}
        onConfirm={handleBlock}
        title={user.status === 'active' ? (isDealerContext ? 'Block Dealer' : 'Block User') : (isDealerContext ? 'Unblock Dealer' : 'Unblock User')}
        message={`Are you sure you want to ${
          user.status === 'active' ? 'block' : 'unblock'
        } this ${isDealerContext ? 'dealer' : 'user'}?`}
        confirmText={updating ? 'Updating...' : user.status === 'active' ? 'Block' : 'Unblock'}
        type="danger"
        disabled={updating}
      />

      {/* Business Registration Modal */}
      {isDealerContext && id && (
        <BusinessRegistrationModal
          isOpen={showBusinessRegistrationModal}
          hasExistingRegistration={hasBusinessRegistration === true}
          onClose={async () => {
            setShowBusinessRegistrationModal(false);
            // Refresh user data to get updated isBusinessRegistration flag
            if (id) {
              try {
                const userData = await getUserById(id);
                const isBusinessRegistered = (userData as { isBusinessRegistration?: boolean }).isBusinessRegistration === true;
                setHasBusinessRegistration(isBusinessRegistered);
              } catch (error) {
                console.error('Error refreshing user data:', error);
                setHasBusinessRegistration(false);
              }
            }
          }}
          dealerId={id || ''}
          onSuccess={async () => {
            setShowBusinessRegistrationModal(false);
            // Refresh user data to get updated isBusinessRegistration flag
            if (id) {
              try {
                const userData = await getUserById(id);
                const isBusinessRegistered = (userData as { isBusinessRegistration?: boolean }).isBusinessRegistration === true;
                setHasBusinessRegistration(isBusinessRegistered);
              } catch (error) {
                console.error('Error refreshing user data:', error);
              }
            }
          }}
        />
      )}
      {/* Status Update Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Business Registration Status"
      >
        <div style={{ padding: theme.spacing.md }}>
          <p style={{ marginBottom: theme.spacing.xl, color: theme.colors.text }}>
            What action would you like to take for this business registration?
          </p>
          <div style={{ display: 'flex', gap: theme.spacing.md, justifyContent: 'flex-end' }}>
            <Button
              variant="danger"
              onClick={() => handleUpdateBusinessStatus('rejected')}
              disabled={updating}
              style={{ minWidth: '100px' }}
            >
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={() => handleUpdateBusinessStatus('approved')}
              disabled={updating}
              style={{ backgroundColor: theme.colors.success, borderColor: theme.colors.success, minWidth: '100px' }}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

