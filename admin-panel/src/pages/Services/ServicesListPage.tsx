import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { SkeletonCard } from '@components/Skeleton';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAdminServices,
  deleteAdminService,
  type IAdminService,
  type IAdminServiceQueryParams,
} from '@services/serviceCategoryService';

const SERVICE_TYPE_LABELS: Record<string, string> = {
  car_automobile: 'Car Service',
  bike_automobile: 'Bike Service',
  car_wash: 'Vehicle Wash',
  tire_service: 'Tyre Service',
  car_detailing: 'PPF & Detailing',
  battery_service: 'Battery Service',
  general: 'General',
};

export const ServicesListPage = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [services, setServices] = useState<IAdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const LIMIT = 20;

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const params: IAdminServiceQueryParams = { page, limit: LIMIT };
      if (search.trim()) params.search = search.trim();
      if (filterType) params.serviceType = filterType;
      const data = await getAdminServices(params);
      setServices(data.services);
      setTotalPages(data.pagination.totalPages);
      setTotal(data.pagination.total);
    } catch {
      showToast('Failed to load services', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, filterType, showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service? This cannot be undone.')) return;
    try {
      setDeletingId(id);
      await deleteAdminService(id);
      showToast('Service deleted', 'success');
      fetchServices();
    } catch {
      showToast('Failed to delete service', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const s = theme.spacing;
  const c = theme.colors;

  return (
    <div>
      <Breadcrumbs />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: s.xl }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: c.text, margin: 0 }}>Services</h1>
          <p style={{ color: c.text, opacity: 0.6, margin: `${s.xs} 0 0` }}>{total} services found</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/services/new')}>+ Add Service</Button>
      </div>

      {/* Filters */}
      <Card>
        <div style={{ display: 'flex', gap: s.md, flexWrap: 'wrap' }}>
          <input
            placeholder="Search services..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{
              flex: 1, minWidth: 200, padding: s.sm,
              border: `1px solid ${c.border}`, borderRadius: theme.borderRadius.md,
              backgroundColor: c.surface, color: c.text, fontSize: '1rem',
            }}
          />
          <select
            value={filterType}
            onChange={e => { setFilterType(e.target.value); setPage(1); }}
            style={{
              padding: s.sm, border: `1px solid ${c.border}`,
              borderRadius: theme.borderRadius.md, backgroundColor: c.surface,
              color: c.text, fontSize: '1rem', minWidth: 180,
            }}
          >
            <option value="">All Sections</option>
            {Object.entries(SERVICE_TYPE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
          <Button variant="secondary" onClick={() => { setSearch(''); setFilterType(''); setPage(1); }}>
            Clear
          </Button>
        </div>
      </Card>

      <div style={{ marginTop: s.lg }}>
        {loading ? (
          <><SkeletonCard /><SkeletonCard /></>
        ) : services.length === 0 ? (
          <Card>
            <div style={{ textAlign: 'center', padding: s.xl, color: c.text, opacity: 0.5 }}>
              No services found. <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => navigate('/services/new')}>Add one?</span>
            </div>
          </Card>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: c.surface }}>
                  {['Name', 'Section', 'Subcategory', 'Package', 'Vehicle', 'Price', 'Home Svc', 'Active', 'Dealer', 'Actions'].map(h => (
                    <th key={h} style={{ padding: `${s.sm} ${s.md}`, textAlign: 'left', color: c.text, fontWeight: 600, borderBottom: `1px solid ${c.border}`, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((svc, idx) => (
                  <tr key={svc.id} style={{ backgroundColor: idx % 2 === 0 ? 'transparent' : c.surface + '40' }}>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text, fontWeight: 500 }}>{svc.name}</td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text }}>
                      <span style={{ backgroundColor: '#0d8320' + '20', color: '#0d8320', padding: '2px 8px', borderRadius: 12, fontSize: '0.8rem' }}>
                        {svc.serviceType ? SERVICE_TYPE_LABELS[svc.serviceType] || svc.serviceType : '—'}
                      </span>
                    </td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text, opacity: 0.8, fontSize: '0.9rem' }}>{svc.serviceSubCategory || '—'}</td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text, opacity: 0.8, fontSize: '0.9rem' }}>{svc.servicePackage || '—'}</td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text, opacity: 0.8, fontSize: '0.9rem' }}>{svc.vehicleType || '—'}</td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text }}>₹{svc.price.toLocaleString()}</td>
                    <td style={{ padding: `${s.sm} ${s.md}` }}>
                      <span style={{ color: svc.homeService ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{svc.homeService ? '✓ Yes' : '✗ No'}</span>
                    </td>
                    <td style={{ padding: `${s.sm} ${s.md}` }}>
                      <span style={{ color: svc.isActive ? '#22c55e' : '#ef4444', fontWeight: 600, fontSize: '0.85rem' }}>{svc.isActive ? '✓' : '✗'}</span>
                    </td>
                    <td style={{ padding: `${s.sm} ${s.md}`, color: c.text, opacity: 0.7, fontSize: '0.85rem' }}>{svc.dealer?.businessName || svc.dealerId.slice(-6)}</td>
                    <td style={{ padding: `${s.sm} ${s.md}` }}>
                      <div style={{ display: 'flex', gap: s.xs }}>
                        <button
                          onClick={() => navigate(`/services/${svc.id}/edit`)}
                          style={{ padding: '4px 10px', backgroundColor: c.primary + '20', color: c.primary, border: `1px solid ${c.primary}40`, borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
                        >Edit</button>
                        <button
                          onClick={() => handleDelete(svc.id)}
                          disabled={deletingId === svc.id}
                          style={{ padding: '4px 10px', backgroundColor: '#ef4444' + '20', color: '#ef4444', border: '1px solid #ef444440', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem' }}
                        >{deletingId === svc.id ? '...' : 'Del'}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: s.sm, marginTop: s.lg }}>
          <Button variant="secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
          <span style={{ padding: `${s.sm} ${s.md}`, color: c.text }}>Page {page} / {totalPages}</span>
          <Button variant="secondary" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
        </div>
      )}
    </div>
  );
};
