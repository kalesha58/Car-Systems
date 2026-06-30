import React, { useEffect, useState } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { BookingFlowShell } from '@components/booking/BookingFlowShell';
import { BookingPickerSheet } from '@components/booking/pickers/BookingPickerSheet';
import { BookingLocationPicker } from '@components/booking/pickers/BookingLocationPicker';
import { BookingVehiclePicker } from '@components/booking/pickers/BookingVehiclePicker';
import { BookingDateTimeSection } from '@components/booking/sections/BookingDateTimeSection';
import { BookingLocationSection } from '@components/booking/sections/BookingLocationSection';
import { BookingPriceSummary } from '@components/booking/sections/BookingPriceSummary';
import { BookingTrustFooter } from '@components/booking/sections/BookingTrustFooter';
import { BookingVehicleSection } from '@components/booking/sections/BookingVehicleSection';
import { ServiceSummaryCard } from '@components/booking/sections/ServiceSummaryCard';
import { CustomerStackRoutes } from '@constants/routes';
import { useServiceBooking } from '@context/ServiceBookingContext';
import { formatSlotTime } from '@utils/bookingMappers';
import type { CustomerStackParamList } from '@navigation/CustomerNavigator';

type Props = NativeStackScreenProps<
  CustomerStackParamList,
  typeof CustomerStackRoutes.ServiceBookingDateTime
>;

type PickerType = 'vehicle' | 'location' | null;

export function ServiceBookingMainScreen({ navigation }: Props) {
  const {
    draft,
    updateBooking,
    getService,
    getVehicle,
    getLocation,
    getTotals,
    vehicles,
    slots,
    slotsLoading,
    loadSlots,
  } = useServiceBooking();

  const service = getService();
  const vehicle = getVehicle();
  const location = getLocation();
  const totals = getTotals();

  const [picker, setPicker] = useState<PickerType>(null);
  const [timeExpanded, setTimeExpanded] = useState(false);

  useEffect(() => {
    if (draft.date) loadSlots(draft.date);
  }, [draft.date, draft.locationType, loadSlots]);

  const canContinue = Boolean(
    draft.date && draft.timeSlot && draft.vehicleId && location && service,
  );

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
          slots={slots}
          slotsLoading={slotsLoading}
          onDateChange={(date) => updateBooking({ date })}
          onTimeChange={(slotId, startTime) =>
            updateBooking({ slotId, timeSlot: formatSlotTime(startTime) })
          }
          expanded={timeExpanded}
          onToggleExpand={() => setTimeExpanded((v) => !v)}
        />

        <BookingVehicleSection
          vehicle={vehicle}
          locked={draft.vehicleLocked}
          onPress={() => setPicker('vehicle')}
        />

        <BookingLocationSection
          location={location}
          locationType={draft.locationType}
          onPress={() => setPicker('location')}
        />

        <BookingPriceSummary
          serviceAmount={totals.serviceAmount}
          addonsAmount={0}
          addonsCount={0}
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
          vehicles={vehicles}
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
        title="Service Location"
        onClose={() => setPicker(null)}
      >
        <BookingLocationPicker
          location={location}
          locationType={draft.locationType}
          homeServiceEnabled={service?.homeService ?? false}
          onSelectLocationType={(locationType) => updateBooking({ locationType })}
        />
      </BookingPickerSheet>
    </>
  );
}
