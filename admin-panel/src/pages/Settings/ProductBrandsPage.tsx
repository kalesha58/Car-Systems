import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import { Table } from '@components/Table/Table';
import {
  createProductBrand,
  deleteProductBrand,
  getProductBrands,
  updateProductBrand,
  type IProductBrand,
} from '@services/productBrandService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { extractErrorMessage } from '@utils/errorHandler';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface IProductBrandFormData {
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export const ProductBrandsPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [productBrands, setProductBrands] = useState<IProductBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IProductBrand | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IProductBrand | null>(null);
  const [formData, setFormData] = useState<IProductBrandFormData>({
    name: '',
    status: 'active',
    sortOrder: 0,
  });

  const fetchProductBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getProductBrands();
      setProductBrands(response.productBrands || []);
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchProductBrands();
  }, [fetchProductBrands]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', status: 'active', sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (item: IProductBrand) => {
    setEditing(item);
    setFormData({
      name: item.name,
      status: item.status,
      sortOrder: item.sortOrder,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showToast('Name is required', 'error');
      return;
    }

    try {
      if (editing) {
        await updateProductBrand(editing.id, formData);
        showToast('Product brand updated', 'success');
      } else {
        await createProductBrand(formData);
        showToast('Product brand created', 'success');
      }
      setShowModal(false);
      fetchProductBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteProductBrand(deleteTarget.id);
      showToast('Product brand deleted', 'success');
      setDeleteTarget(null);
      fetchProductBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  return (
    <div>
      <Breadcrumbs />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Package size={22} color={theme.colors.primary} />
          <h1 style={{ margin: 0, color: theme.colors.text }}>Product Brands</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Product Brand
        </Button>
      </div>

      <Card>
        <Table
          loading={loading}
          columns={[
            { key: 'name', header: 'Name' },
            { key: 'status', header: 'Status' },
            { key: 'sortOrder', header: 'Sort Order' },
            { key: 'products', header: 'Products' },
            { key: 'actions', header: 'Actions' },
          ]}
          data={productBrands.map((item) => ({
            ...item,
            products: item.products ?? 0,
            actions: (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget(item)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ),
          }))}
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? 'Edit Product Brand' : 'Add Product Brand'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g. Castrol"
          />
          <Select
            label="Status"
            value={formData.status}
            onChange={(value) =>
              setFormData({ ...formData, status: value as 'active' | 'inactive' })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <Input
            label="Sort Order"
            type="number"
            value={String(formData.sortOrder)}
            onChange={(value) =>
              setFormData({ ...formData, sortOrder: parseInt(value, 10) || 0 })
            }
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>{editing ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product Brand"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone if products use it.`}
      />
    </div>
  );
};
