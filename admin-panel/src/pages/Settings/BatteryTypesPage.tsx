import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import { Table } from '@components/Table/Table';
import {
  createBatteryType,
  deleteBatteryType,
  getBatteryTypes,
  updateBatteryType,
  type IBatteryType,
} from '@services/batteryTypeService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { extractErrorMessage } from '@utils/errorHandler';
import { Battery, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface IBatteryTypeFormData {
  name: string;
  status: 'active' | 'inactive';
  sortOrder: number;
}

export const BatteryTypesPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [batteryTypes, setBatteryTypes] = useState<IBatteryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<IBatteryType | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IBatteryType | null>(null);
  const [formData, setFormData] = useState<IBatteryTypeFormData>({
    name: '',
    status: 'active',
    sortOrder: 0,
  });

  const fetchBatteryTypes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getBatteryTypes();
      setBatteryTypes(response.batteryTypes || []);
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchBatteryTypes();
  }, [fetchBatteryTypes]);

  const openCreate = () => {
    setEditing(null);
    setFormData({ name: '', status: 'active', sortOrder: 0 });
    setShowModal(true);
  };

  const openEdit = (item: IBatteryType) => {
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
        await updateBatteryType(editing.id, formData);
        showToast('Battery type updated', 'success');
      } else {
        await createBatteryType(formData);
        showToast('Battery type created', 'success');
      }
      setShowModal(false);
      fetchBatteryTypes();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBatteryType(deleteTarget.id);
      showToast('Battery type deleted', 'success');
      setDeleteTarget(null);
      fetchBatteryTypes();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  return (
    <div>
      <Breadcrumbs />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Battery size={22} color={theme.colors.primary} />
          <h1 style={{ margin: 0, color: theme.colors.text }}>Battery Types</h1>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          Add Battery Type
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
          data={batteryTypes.map((item) => ({
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
        title={editing ? 'Edit Battery Type' : 'Add Battery Type'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="e.g. Lead Acid"
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
        title="Delete Battery Type"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone if products use it.`}
      />
    </div>
  );
};
