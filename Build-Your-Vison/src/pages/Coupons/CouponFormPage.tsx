import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { Input } from '@components/Input/Input';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getCouponById,
  createCoupon,
  updateCoupon,
  type ICreateCouponPayload,
} from '@services/couponService';

interface ICouponFormData {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number | '';
  minOrderAmount: number | '';
  maxDiscountAmount: number | '';
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  usageLimit: number | '';
}

const INITIAL_FORM: ICouponFormData = {
  code: '',
  discountType: 'percentage',
  discountValue: '',
  minOrderAmount: '',
  maxDiscountAmount: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
  usageLimit: '',
};

export const CouponFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const isEdit = Boolean(id && id !== 'new');

  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ICouponFormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isEdit || !id) return;
    const load = async () => {
      try {
        const coupon = await getCouponById(id);
        setFormData({
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: coupon.minOrderAmount ?? '',
          maxDiscountAmount: coupon.maxDiscountAmount ?? '',
          validFrom: coupon.validFrom?.split('T')[0] ?? '',
          validUntil: coupon.validUntil?.split('T')[0] ?? '',
          isActive: coupon.isActive,
          usageLimit: coupon.usageLimit ?? '',
        });
      } catch {
        showToast('Failed to load coupon', 'error');
        navigate('/coupons');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, isEdit, navigate, showToast]);

  const set = (key: keyof ICouponFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.code.trim()) e.code = 'Coupon code is required';
    if (formData.discountValue === '' || Number(formData.discountValue) <= 0)
      e.discountValue = 'Discount value must be > 0';
    if (formData.discountType === 'percentage' && Number(formData.discountValue) > 100)
      e.discountValue = 'Percentage cannot exceed 100';
    if (!formData.validFrom) e.validFrom = 'Valid from date is required';
    if (!formData.validUntil) e.validUntil = 'Valid until date is required';
    if (formData.validFrom && formData.validUntil && formData.validFrom >= formData.validUntil)
      e.validUntil = 'Valid until must be after valid from';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) { showToast('Please fix the errors', 'error'); return; }
    try {
      setSubmitting(true);
      const payload: ICreateCouponPayload = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        discountValue: Number(formData.discountValue),
        validFrom: new Date(formData.validFrom).toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
        isActive: formData.isActive,
        ...(formData.minOrderAmount !== '' && { minOrderAmount: Number(formData.minOrderAmount) }),
        ...(formData.maxDiscountAmount !== '' && {
          maxDiscountAmount: Number(formData.maxDiscountAmount),
        }),
        ...(formData.usageLimit !== '' && { usageLimit: Number(formData.usageLimit) }),
      };

      if (isEdit && id) {
        await updateCoupon(id, payload);
        showToast('Coupon updated successfully', 'success');
      } else {
        await createCoupon(payload);
        showToast('Coupon created successfully', 'success');
      }
      navigate('/coupons');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Failed to save coupon', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const s = theme.spacing;
  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: s.xs,
    color: theme.colors.text,
    fontWeight: 500,
    fontSize: '0.875rem',
  };

  if (loading) {
    return (
      <div style={{ padding: s.lg, color: theme.colors.textSecondary }}>Loading...</div>
    );
  }

  return (
    <div style={{ padding: s.lg, maxWidth: 720 }}>
      <Breadcrumbs />
      <h1 style={{ color: theme.colors.text, margin: `0 0 ${s.lg}` }}>
        {isEdit ? 'Edit Coupon' : 'Create Coupon'}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card style={{ padding: s.lg, marginBottom: s.md }}>
          <h2 style={{ margin: `0 0 ${s.md}`, color: theme.colors.text, fontSize: '1rem' }}>
            Coupon Details
          </h2>

          {/* Code */}
          <div style={{ marginBottom: s.md }}>
            <Input
              label="Coupon Code *"
              value={formData.code}
              onChange={(v) => set('code', v.toUpperCase())}
              placeholder="e.g. SAVE20"
              error={errors.code}
              required
            />
          </div>

          {/* Discount Type & Value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: s.md, marginBottom: s.md }}>
            <div>
              <label style={labelStyle}>Discount Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => set('discountType', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: '0.875rem',
                }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed (₹)</option>
              </select>
            </div>
            <Input
              label="Discount Value *"
              type="number"
              value={String(formData.discountValue)}
              onChange={(v) => set('discountValue', v)}
              placeholder={formData.discountType === 'percentage' ? '0–100' : '0'}
              error={errors.discountValue}
              required
            />
          </div>

          {/* Optional fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: s.md, marginBottom: s.md }}>
            <Input
              label="Min Order Amount (₹)"
              type="number"
              value={String(formData.minOrderAmount)}
              onChange={(v) => set('minOrderAmount', v)}
              placeholder="0"
            />
            <Input
              label="Max Discount (₹)"
              type="number"
              value={String(formData.maxDiscountAmount)}
              onChange={(v) => set('maxDiscountAmount', v)}
              placeholder="optional"
            />
            <Input
              label="Usage Limit"
              type="number"
              value={String(formData.usageLimit)}
              onChange={(v) => set('usageLimit', v)}
              placeholder="unlimited"
            />
          </div>

          {/* Validity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: s.md, marginBottom: s.md }}>
            <div>
              <label style={labelStyle}>Valid From *</label>
              <input
                type="date"
                value={formData.validFrom}
                onChange={(e) => set('validFrom', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.validFrom ? theme.colors.error : theme.colors.border}`,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
              {errors.validFrom && (
                <p style={{ color: theme.colors.error, fontSize: '0.75rem', marginTop: 4 }}>
                  {errors.validFrom}
                </p>
              )}
            </div>
            <div>
              <label style={labelStyle}>Valid Until *</label>
              <input
                type="date"
                value={formData.validUntil}
                onChange={(e) => set('validUntil', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${errors.validUntil ? theme.colors.error : theme.colors.border}`,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
              {errors.validUntil && (
                <p style={{ color: theme.colors.error, fontSize: '0.75rem', marginTop: 4 }}>
                  {errors.validUntil}
                </p>
              )}
            </div>
          </div>

          {/* Active Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: s.md }}>
            <input
              id="isActive"
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            <label htmlFor="isActive" style={{ ...labelStyle, marginBottom: 0 }}>
              Active (coupon is usable by customers)
            </label>
          </div>
        </Card>

        <div style={{ display: 'flex', gap: s.sm, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={() => navigate('/coupons')} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
          </Button>
        </div>
      </form>
    </div>
  );
};
