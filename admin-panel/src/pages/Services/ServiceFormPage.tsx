import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { SkeletonCard } from '@components/Skeleton';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getUsers } from '@services/userService';
import {
  getServiceCategories,
  getAdminServiceById,
  createAdminService,
  updateAdminService,
  type IServiceSection,
  type ServiceTypeValue,
  type ServicePackageValue,
} from '@services/serviceCategoryService';

interface IFormData {
  dealerId: string;
  sectionId: string;
  name: string;
  price: number | '';
  durationMinutes: number | '';
  homeService: boolean;
  description: string;
  serviceSubCategory: string;
  servicePackage: ServicePackageValue | '';
  vehicleType: 'Car' | 'Bike' | '';
  vehicleModel: string;
  vehicleBrand: string;
  images: string[];
  isActive: boolean;
  commissionPercentage?: number;
}

const INITIAL_FORM: IFormData = {
  dealerId: '',
  sectionId: '',
  name: '',
  price: '',
  durationMinutes: 60,
  homeService: false,
  description: '',
  serviceSubCategory: '',
  servicePackage: '',
  vehicleType: '',
  vehicleModel: '',
  vehicleBrand: '',
  images: [],
  isActive: true,
  commissionPercentage: undefined,
};

export const ServiceFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<IFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sections, setSections] = useState<IServiceSection[]>([]);
  const [dealers, setDealers] = useState<Array<{ id: string; name: string; businessName?: string }>>([]);

  // Derived: selected section config
  const selectedSection = sections.find(s => s.id === formData.sectionId) ?? null;

  useEffect(() => {
    const init = async () => {
      try {
        // Load sections config + dealers in parallel
        const [catData, usersData] = await Promise.all([
          getServiceCategories(),
          getUsers({ limit: 200, role: 'dealer', status: 'active' }),
        ]);
        setSections(catData.sections);
        setDealers(
          (usersData.users || []).map((u: any) => ({
            id: u.id,
            name: u.name,
            businessName: u.businessName || u.name,
          })),
        );

        if (isEdit && id) {
          const svc = await getAdminServiceById(id);
          // Map serviceType back to sectionId
          const matchSection = catData.sections.find(s => s.serviceType === svc.serviceType);
          setFormData({
            dealerId: svc.dealerId || '',
            sectionId: matchSection?.id || '',
            name: svc.name || '',
            price: svc.price,
            durationMinutes: svc.durationMinutes,
            homeService: svc.homeService,
            description: svc.description || '',
            serviceSubCategory: svc.serviceSubCategory || '',
            servicePackage: (svc.servicePackage as ServicePackageValue) || '',
            vehicleType: (svc.vehicleType as 'Car' | 'Bike') || '',
            vehicleModel: svc.vehicleModel || '',
            vehicleBrand: svc.vehicleBrand || '',
            images: svc.images || [],
            isActive: svc.isActive !== false,
            commissionPercentage: (svc as any).commissionPercentage,
          });
        }
      } catch (e) {
        showToast('Failed to load form data', 'error');
        if (isEdit) navigate('/services');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [id, isEdit, navigate, showToast]);

  // When section changes, reset sub-fields
  const handleSectionChange = (sectionId: string) => {
    setFormData(prev => ({
      ...prev,
      sectionId,
      serviceSubCategory: '',
      servicePackage: '',
      vehicleType: '',
      homeService: false,
    }));
    setErrors(prev => ({ ...prev, sectionId: '', serviceSubCategory: '' }));
  };

  const set = (key: keyof IFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.dealerId) e.dealerId = 'Dealer is required';
    if (!formData.sectionId) e.sectionId = 'Section is required';
    if (!formData.name.trim()) e.name = 'Service name is required';
    if (formData.price === '' || Number(formData.price) < 0) e.price = 'Valid price is required';
    if (!formData.durationMinutes || Number(formData.durationMinutes) < 1) e.durationMinutes = 'Duration must be ≥ 1 min';
    if (selectedSection && selectedSection.subcategories.length > 0 && !formData.serviceSubCategory) {
      e.serviceSubCategory = 'Subcategory is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Please fix the errors', 'error'); return; }
    try {
      setSubmitting(true);
      const payload = {
        dealerId: formData.dealerId,
        name: formData.name.trim(),
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        homeService: formData.homeService,
        description: formData.description.trim() || undefined,
        serviceType: selectedSection?.serviceType as ServiceTypeValue,
        vehicleType: selectedSection?.vehicleType === 'Car' ? 'Car' as const
          : selectedSection?.vehicleType === 'Bike' ? 'Bike' as const
          : (formData.vehicleType as 'Car' | 'Bike') || undefined,
        serviceSubCategory: formData.serviceSubCategory || undefined,
        servicePackage: (formData.servicePackage as ServicePackageValue) || undefined,
        vehicleModel: formData.vehicleModel.trim() || undefined,
        vehicleBrand: formData.vehicleBrand.trim() || undefined,
        images: formData.images,
        isActive: formData.isActive,
        ...(formData.commissionPercentage !== undefined && {
          commissionPercentage: formData.commissionPercentage,
        }),
      };

      if (isEdit && id) {
        await updateAdminService(id, payload);
        showToast('Service updated', 'success');
      } else {
        await createAdminService(payload);
        showToast('Service created', 'success');
      }
      navigate('/services');
    } catch {
      showToast(isEdit ? 'Failed to update service' : 'Failed to create service', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const s = theme.spacing;
  const c = theme.colors;

  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: s.xs, color: c.text, fontWeight: 500,
  };
  const selectStyle: React.CSSProperties = {
    width: '100%', padding: s.sm, border: `1px solid ${c.border}`,
    borderRadius: theme.borderRadius.md, backgroundColor: c.surface, color: c.text,
    fontSize: '1rem', marginBottom: s.md,
  };
  const errStyle: React.CSSProperties = { color: c.error, fontSize: '0.875rem', marginTop: 4, marginBottom: s.sm };

  if (loading) {
    return <div><Breadcrumbs /><SkeletonCard /><SkeletonCard /></div>;
  }

  return (
    <div>
      <Breadcrumbs />
      <h1 style={{ marginBottom: s.xl, fontSize: '2rem', fontWeight: 'bold', color: c.text }}>
        {isEdit ? 'Edit Service' : 'Add Service'}
      </h1>

      <Card>
        <form onSubmit={handleSubmit}>

          {/* ── Dealer ── */}
          <div style={{ marginBottom: s.md }}>
            <label style={labelStyle}>Dealer <span style={{ color: c.error }}>*</span></label>
            <select
              value={formData.dealerId}
              onChange={e => set('dealerId', e.target.value)}
              style={{ ...selectStyle, borderColor: errors.dealerId ? c.error : c.border }}
            >
              <option value="">Select a dealer</option>
              {dealers.map(d => (
                <option key={d.id} value={d.id}>{d.businessName || d.name}</option>
              ))}
            </select>
            {errors.dealerId && <p style={errStyle}>{errors.dealerId}</p>}
          </div>

          {/* ── Section ── */}
          <div style={{ marginBottom: s.md }}>
            <label style={labelStyle}>Service Section <span style={{ color: c.error }}>*</span></label>
            <select
              value={formData.sectionId}
              onChange={e => handleSectionChange(e.target.value)}
              style={{ ...selectStyle, borderColor: errors.sectionId ? c.error : c.border }}
            >
              <option value="">Select a section</option>
              {sections.map(sec => (
                <option key={sec.id} value={sec.id}>{sec.label}</option>
              ))}
            </select>
            {errors.sectionId && <p style={errStyle}>{errors.sectionId}</p>}
          </div>

          {/* ── Subcategory (driven by section) ── */}
          {selectedSection && selectedSection.subcategories.length > 0 && (
            <div style={{ marginBottom: s.md }}>
              <label style={labelStyle}>Subcategory <span style={{ color: c.error }}>*</span></label>
              <select
                value={formData.serviceSubCategory}
                onChange={e => set('serviceSubCategory', e.target.value)}
                style={{ ...selectStyle, borderColor: errors.serviceSubCategory ? c.error : c.border }}
              >
                <option value="">Select subcategory</option>
                {selectedSection.subcategories.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.label}</option>
                ))}
              </select>
              {errors.serviceSubCategory && <p style={errStyle}>{errors.serviceSubCategory}</p>}
            </div>
          )}

          {/* ── Package (for Vehicle Wash) ── */}
          {selectedSection?.hasPackages && (selectedSection.packages ?? []).length > 0 && (
            <div style={{ marginBottom: s.md }}>
              <label style={labelStyle}>Package</label>
              <select
                value={formData.servicePackage}
                onChange={e => set('servicePackage', e.target.value as ServicePackageValue)}
                style={selectStyle}
              >
                <option value="">Select package</option>
                {(selectedSection.packages ?? []).map(pkg => (
                  <option key={pkg.value} value={pkg.value}>{pkg.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* ── Delivery Mode / Home Service (for sections with delivery modes) ── */}
          {selectedSection?.hasDeliveryModes && (
            <div style={{ marginBottom: s.md, display: 'flex', gap: s.lg, alignItems: 'center' }}>
              <label style={{ color: c.text, fontWeight: 500 }}>Delivery Mode:</label>
              {(selectedSection.deliveryModes ?? []).map(dm => (
                <label key={dm.value} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: c.text }}>
                  <input
                    type="radio"
                    name="deliveryMode"
                    value={dm.value}
                    checked={
                      dm.value === 'home'
                        ? formData.homeService === true
                        : formData.homeService === false
                    }
                    onChange={() => set('homeService', dm.value === 'home')}
                  />
                  {dm.label}
                </label>
              ))}
            </div>
          )}

          {/* ── Vehicle Type (for sections with vehicleType = 'Both') ── */}
          {selectedSection?.vehicleType === 'Both' && (
            <div style={{ marginBottom: s.md }}>
              <label style={labelStyle}>Vehicle Type</label>
              <select
                value={formData.vehicleType}
                onChange={e => set('vehicleType', e.target.value)}
                style={selectStyle}
              >
                <option value="">Any</option>
                <option value="Car">Car</option>
                <option value="Bike">Bike</option>
              </select>
            </div>
          )}

          {/* ── Name ── */}
          <Input
            label="Service Name"
            value={formData.name}
            onChange={v => set('name', v)}
            placeholder="e.g. General Engine Checkup"
            error={errors.name}
            required
          />

          {/* ── Price & Duration & Commission ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: s.md, marginBottom: s.md }}>
            <Input
              label="Price (₹)"
              type="number"
              value={String(formData.price)}
              onChange={v => set('price', v)}
              placeholder="0"
              error={errors.price}
              required
            />
            <Input
              label="Duration (minutes)"
              type="number"
              value={String(formData.durationMinutes)}
              onChange={v => set('durationMinutes', v)}
              placeholder="60"
              error={errors.durationMinutes}
              required
            />
            <Input
              label="Commission %"
              type="number"
              value={formData.commissionPercentage?.toString() ?? ''}
              onChange={v =>
                set('commissionPercentage', v === '' ? undefined : parseFloat(v))
              }
              placeholder="e.g. 10"
            />
          </div>

          {/* ── Vehicle Brand & Model (optional metadata) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: s.md, marginBottom: s.md }}>
            <Input
              label="Vehicle Brand (optional)"
              value={formData.vehicleBrand}
              onChange={v => set('vehicleBrand', v)}
              placeholder="e.g. Maruti, Honda"
            />
            <Input
              label="Vehicle Model (optional)"
              value={formData.vehicleModel}
              onChange={v => set('vehicleModel', v)}
              placeholder="e.g. Swift, Activa"
            />
          </div>

          {/* ── Description ── */}
          <div style={{ marginBottom: s.md }}>
            <label style={labelStyle}>Description</label>
            <textarea
              value={formData.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe what's included in this service..."
              rows={4}
              style={{
                width: '100%', padding: s.sm,
                border: `1px solid ${c.border}`, borderRadius: theme.borderRadius.md,
                backgroundColor: c.surface, color: c.text, fontSize: '1rem',
                fontFamily: 'inherit', resize: 'vertical',
              }}
            />
          </div>

          {/* ── Home Service toggle (for sections without explicit delivery modes) ── */}
          {!selectedSection?.hasDeliveryModes && (
            <div style={{ marginBottom: s.md, display: 'flex', alignItems: 'center', gap: s.sm }}>
              <input
                id="homeService"
                type="checkbox"
                checked={formData.homeService}
                onChange={e => set('homeService', e.target.checked)}
                style={{ width: 18, height: 18, cursor: 'pointer' }}
              />
              <label htmlFor="homeService" style={{ color: c.text, cursor: 'pointer' }}>Home Service Available</label>
            </div>
          )}

          {/* ── Active ── */}
          <div style={{ marginBottom: s.xl, display: 'flex', alignItems: 'center', gap: s.sm }}>
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={e => set('isActive', e.target.checked)}
              style={{ width: 18, height: 18, cursor: 'pointer' }}
            />
            <label htmlFor="isActive" style={{ color: c.text, cursor: 'pointer' }}>Active (visible to customers)</label>
          </div>

          {/* ── Actions ── */}
          <div style={{ display: 'flex', gap: s.md }}>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEdit ? 'Update Service' : 'Create Service'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => navigate('/services')}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
