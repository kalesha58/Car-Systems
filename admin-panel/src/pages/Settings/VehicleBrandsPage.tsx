import { Breadcrumbs } from '@components/Breadcrumbs/Breadcrumbs';
import { Button } from '@components/Button/Button';
import { Card } from '@components/Card/Card';
import { ConfirmModal } from '@components/ConfirmModal/ConfirmModal';
import { Input } from '@components/Input/Input';
import { Modal } from '@components/Modal/Modal';
import { Select } from '@components/Select';
import { Table } from '@components/Table/Table';
import {
  createVehicleBrand,
  createVehicleModel,
  deleteVehicleBrand,
  deleteVehicleModel,
  getVehicleBrands,
  getVehicleModels,
  updateVehicleBrand,
  updateVehicleModel,
  type IVehicleBrand,
  type IVehicleModel,
  type VehicleBrandType,
} from '@services/vehicleBrandService';
import { useToastStore } from '@store/toastStore';
import { useTheme } from '@theme/ThemeContext';
import { extractErrorMessage } from '@utils/errorHandler';
import { Car, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export const VehicleBrandsPage = () => {
  const { theme } = useTheme();
  const { showToast } = useToastStore();
  const [activeType, setActiveType] = useState<VehicleBrandType>('Bike');
  const [brands, setBrands] = useState<IVehicleBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<IVehicleBrand | null>(null);
  const [deleteBrandTarget, setDeleteBrandTarget] = useState<IVehicleBrand | null>(null);
  const [brandForm, setBrandForm] = useState({ name: '', status: 'active' as 'active' | 'inactive' });

  const [modelsBrand, setModelsBrand] = useState<IVehicleBrand | null>(null);
  const [models, setModels] = useState<IVehicleModel[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [showModelModal, setShowModelModal] = useState(false);
  const [editingModel, setEditingModel] = useState<IVehicleModel | null>(null);
  const [deleteModelTarget, setDeleteModelTarget] = useState<IVehicleModel | null>(null);
  const [modelForm, setModelForm] = useState({ name: '', status: 'active' as 'active' | 'inactive' });

  const fetchBrands = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getVehicleBrands({ type: activeType });
      setBrands(response.vehicleBrands || []);
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [activeType, showToast]);

  const fetchModels = useCallback(
    async (brand: IVehicleBrand) => {
      try {
        setModelsLoading(true);
        const response = await getVehicleModels(brand.id);
        setModels(response.vehicleModels || []);
      } catch (error) {
        showToast(extractErrorMessage(error), 'error');
      } finally {
        setModelsLoading(false);
      }
    },
    [showToast],
  );

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (modelsBrand) {
      fetchModels(modelsBrand);
    } else {
      setModels([]);
    }
  }, [modelsBrand, fetchModels]);

  const openCreateBrand = () => {
    setEditingBrand(null);
    setBrandForm({ name: '', status: 'active' });
    setShowBrandModal(true);
  };

  const openEditBrand = (brand: IVehicleBrand) => {
    setEditingBrand(brand);
    setBrandForm({ name: brand.name, status: brand.status });
    setShowBrandModal(true);
  };

  const handleBrandSubmit = async () => {
    if (!brandForm.name.trim()) {
      showToast('Brand name is required', 'error');
      return;
    }

    try {
      if (editingBrand) {
        await updateVehicleBrand(editingBrand.id, brandForm);
        showToast('Brand updated', 'success');
      } else {
        await createVehicleBrand({ ...brandForm, type: activeType });
        showToast('Brand created', 'success');
      }
      setShowBrandModal(false);
      fetchBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleDeleteBrand = async () => {
    if (!deleteBrandTarget) return;
    try {
      await deleteVehicleBrand(deleteBrandTarget.id);
      showToast('Brand deleted', 'success');
      if (modelsBrand?.id === deleteBrandTarget.id) {
        setModelsBrand(null);
      }
      setDeleteBrandTarget(null);
      fetchBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const openCreateModel = () => {
    setEditingModel(null);
    setModelForm({ name: '', status: 'active' });
    setShowModelModal(true);
  };

  const openEditModel = (model: IVehicleModel) => {
    setEditingModel(model);
    setModelForm({ name: model.name, status: model.status });
    setShowModelModal(true);
  };

  const handleModelSubmit = async () => {
    if (!modelsBrand) return;
    if (!modelForm.name.trim()) {
      showToast('Model name is required', 'error');
      return;
    }

    try {
      if (editingModel) {
        await updateVehicleModel(editingModel.id, modelForm);
        showToast('Model updated', 'success');
      } else {
        await createVehicleModel(modelsBrand.id, modelForm);
        showToast('Model created', 'success');
      }
      setShowModelModal(false);
      fetchModels(modelsBrand);
      fetchBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  const handleDeleteModel = async () => {
    if (!deleteModelTarget || !modelsBrand) return;
    try {
      await deleteVehicleModel(deleteModelTarget.id);
      showToast('Model deleted', 'success');
      setDeleteModelTarget(null);
      fetchModels(modelsBrand);
      fetchBrands();
    } catch (error) {
      showToast(extractErrorMessage(error), 'error');
    }
  };

  return (
    <div>
      <Breadcrumbs items={[{ label: 'Settings' }, { label: 'Vehicle Brands' }]} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Car size={22} color={theme.colors.primary} />
          <h1 style={{ margin: 0, color: theme.colors.text }}>Vehicle Brands & Models</h1>
        </div>
        <Button onClick={openCreateBrand}>
          <Plus size={16} />
          Add Brand
        </Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['Car', 'Bike'] as VehicleBrandType[]).map((type) => (
          <Button
            key={type}
            variant={activeType === type ? 'primary' : 'secondary'}
            onClick={() => {
              setActiveType(type);
              setModelsBrand(null);
            }}
          >
            {type}
          </Button>
        ))}
      </div>

      {!loading && brands.length === 0 && (
        <Card style={{ marginBottom: 16, padding: 24, textAlign: 'center' }}>
          <p style={{ margin: 0, color: theme.colors.textSecondary }}>
            No {activeType} brands configured yet. Add your first brand to populate dropdowns across the app.
          </p>
        </Card>
      )}

      <Card>
        <Table
          loading={loading}
          columns={[
            { key: 'name', header: 'Brand' },
            { key: 'status', header: 'Status' },
            { key: 'modelCount', header: 'Models' },
            { key: 'actions', header: 'Actions' },
          ]}
          data={brands.map((brand) => ({
            ...brand,
            actions: (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Button variant="secondary" size="sm" onClick={() => setModelsBrand(brand)}>
                  Models
                </Button>
                <Button variant="secondary" size="sm" onClick={() => openEditBrand(brand)}>
                  Edit
                </Button>
                <Button variant="danger" size="sm" onClick={() => setDeleteBrandTarget(brand)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            ),
          }))}
        />
      </Card>

      {modelsBrand && (
        <Card style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: '1.1rem', color: theme.colors.text }}>
              Models for {modelsBrand.name}
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setModelsBrand(null)}>
                Close
              </Button>
              <Button size="sm" onClick={openCreateModel}>
                <Plus size={14} />
                Add Model
              </Button>
            </div>
          </div>
          <Table
            loading={modelsLoading}
            columns={[
              { key: 'name', header: 'Model' },
              { key: 'status', header: 'Status' },
              { key: 'actions', header: 'Actions' },
            ]}
            data={models.map((model) => ({
              ...model,
              actions: (
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="sm" onClick={() => openEditModel(model)}>
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => setDeleteModelTarget(model)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ),
            }))}
          />
          {!modelsLoading && models.length === 0 && (
            <p style={{ margin: '12px 0 0', color: theme.colors.textSecondary }}>
              No models for this brand yet. Add models to enable model dropdowns.
            </p>
          )}
        </Card>
      )}

      <Modal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        title={editingBrand ? 'Edit Brand' : `Add ${activeType} Brand`}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Name"
            value={brandForm.name}
            onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
            placeholder={activeType === 'Bike' ? 'e.g. Hero' : 'e.g. Maruti Suzuki'}
          />
          <Select
            label="Status"
            value={brandForm.status}
            onChange={(e) =>
              setBrandForm({ ...brandForm, status: e.target.value as 'active' | 'inactive' })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowBrandModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBrandSubmit}>{editingBrand ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showModelModal}
        onClose={() => setShowModelModal(false)}
        title={editingModel ? 'Edit Model' : 'Add Model'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Input
            label="Name"
            value={modelForm.name}
            onChange={(e) => setModelForm({ ...modelForm, name: e.target.value })}
            placeholder="e.g. Splendor Plus"
          />
          <Select
            label="Status"
            value={modelForm.status}
            onChange={(e) =>
              setModelForm({ ...modelForm, status: e.target.value as 'active' | 'inactive' })
            }
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowModelModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleModelSubmit}>{editingModel ? 'Update' : 'Create'}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteBrandTarget}
        onClose={() => setDeleteBrandTarget(null)}
        onConfirm={handleDeleteBrand}
        title="Delete Brand"
        message={`Delete "${deleteBrandTarget?.name}"? Deactivate instead if it is in use.`}
      />

      <ConfirmModal
        isOpen={!!deleteModelTarget}
        onClose={() => setDeleteModelTarget(null)}
        onConfirm={handleDeleteModel}
        title="Delete Model"
        message={`Delete "${deleteModelTarget?.name}"? Deactivate instead if it is in use.`}
      />
    </div>
  );
};
