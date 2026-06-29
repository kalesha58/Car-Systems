import React, { useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BookingFlowShell } from '@components/booking/BookingFlowShell';
import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { BookingLocationPicker } from '@components/booking/pickers/BookingLocationPicker';
import { BookingVehiclePicker } from '@components/booking/pickers/BookingVehiclePicker';
import { BookingAddonsSection } from '@components/booking/sections/BookingAddonsSection';
import { BookingDateTimeSection } from '@components/booking/sections/BookingDateTimeSection';
import { BookingLocationSection } from '@components/booking/sections/BookingLocationSection';
import { BookingPriceSummary } from '@components/booking/sections/BookingPriceSummary';
import { BookingTrustFooter } from '@components/booking/sections/BookingTrustFooter';
import { BookingVehicleSection } from '@components/booking/sections/BookingVehicleSection';
import { ServiceSummaryCard } from '@components/booking/sections/ServiceSummaryCard';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingDateTime
>;

type PickerType = 'vehicle' | 'location' | null;

export function ServiceBookingMainScreen({ navigation }: Props) {
  const { draft, updateBooking, getService, getVehicle, getWorkshop, getTotals } =
    useServiceBooking();

  const service = getService();
  const vehicle = getVehicle();
  const workshop = getWorkshop();
  const totals = getTotals();

  const [picker, setPicker] = useState<PickerType>(null);
  const [timeExpanded, setTimeExpanded] = useState(false);

  const toggleAddon = (id: string) => {
    const selected = draft.selectedAddonIds.includes(id);
    updateBooking({
      selectedAddonIds: selected
        ? draft.selectedAddonIds.filter((x) => x !== id)
        : [...draft.selectedAddonIds, id],
    });
  };

  const canContinue =
    Boolean(draft.date && draft.timeSlot && draft.vehicleId && draft.workshopId && service);

  return (
    <>
      <BookingFlowShell
        step={1}
        onBack={() => navigation.goBack()}
        onContinue={() => navigation.navigate(CustomerStackRoutes.ServiceBookingSummary)}
        continueLabel="Continue to Review"
        continueDisabled={!canContinue}
        footerExtra={<BookingTrustFooter />}
      >
        {service && <ServiceSummaryCard service={service} />}

        <BookingDateTimeSection
          date={draft.date}
          timeSlot={draft.timeSlot}
          onDateChange={(date) => updateBooking({ date })}
          onTimeChange={(timeSlot) => updateBooking({ timeSlot })}
          expanded={timeExpanded}
          onToggleExpand={() => setTimeExpanded((v) => !v)}
        />

        <BookingVehicleSection
          vehicle={vehicle}
          locked={draft.vehicleLocked}
          onPress={() => setPicker('vehicle')}
        />

        <BookingLocationSection
          workshop={workshop}
          locationType={draft.locationType}
          onPress={() => setPicker('location')}
        />

        <BookingAddonsSection
          selectedIds={draft.selectedAddonIds}
          onToggle={toggleAddon}
        />

        <BookingPriceSummary
          serviceAmount={totals.serviceAmount}
          addonsAmount={totals.addonsAmount}
          addonsCount={draft.selectedAddonIds.length}
          platformFee={totals.platformFee}
          couponDiscount={totals.couponDiscount}
          total={totals.total}
        />
      </BookingFlowShell>

      <BookingPickerSheet
        visible={picker === 'vehicle'}
        title={draft.vehicleLocked ? 'Your Vehicle' : 'Select Vehicle'}
        onClose={() => setPicker(null)}
      >
        <BookingVehiclePicker
          selectedId={draft.vehicleId}
          locked={draft.vehicleLocked}
          onSelect={(vehicleId) => {
            updateBooking({ vehicleId });
            setPicker(null);
          }}
        />
      </BookingPickerSheet>

      <BookingPickerSheet
        visible={picker === 'location'}
        title="Select Location"
        onClose={() => setPicker(null)}
      >
        <BookingLocationPicker
          workshopId={draft.workshopId}
          locationType={draft.locationType}
          onSelectWorkshop={(workshopId) => {
            updateBooking({ workshopId });
            setPicker(null);
          }}
          onSelectLocationType={(locationType) => updateBooking({ locationType })}
        />
      </BookingPickerSheet>
    </>
  );
}
