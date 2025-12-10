import {View, StyleSheet, ScrollView} from 'react-native';
import React, {FC} from 'react';
import {Colors, Fonts} from '@utils/Constants';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {RFValue} from 'react-native-responsive-fontsize';
import CustomText from '@components/ui/CustomText';

interface IOrderWorkflowProps {
  status?: string;
  timeline?: any[];
}

interface IWorkflowStep {
  key: string;
  label: string;
  icon: string;
  iconFilled: string;
}

const workflowSteps: IWorkflowStep[] = [
  {
    key: 'ORDER_PLACED',
    label: 'Order Placed',
    icon: 'cart-outline',
    iconFilled: 'cart',
  },
  {
    key: 'PAYMENT_CONFIRMED',
    label: 'Payment Confirmed',
    icon: 'credit-card-check-outline',
    iconFilled: 'credit-card-check',
  },
  {
    key: 'ORDER_CONFIRMED',
    label: 'Order Confirmed',
    icon: 'check-circle-outline',
    iconFilled: 'check-circle',
  },
  {
    key: 'PACKED',
    label: 'Packed',
    icon: 'package-outline',
    iconFilled: 'package',
  },
  {
    key: 'SHIPPED',
    label: 'Shipped',
    icon: 'truck-delivery-outline',
    iconFilled: 'truck-delivery',
  },
  {
    key: 'OUT_FOR_DELIVERY',
    label: 'Out for Delivery',
    icon: 'bike-fast',
    iconFilled: 'bike-fast',
  },
  {
    key: 'DELIVERED',
    label: 'Delivered',
    icon: 'check-circle-outline',
    iconFilled: 'check-circle',
  },
];

const OrderWorkflow: FC<IOrderWorkflowProps> = ({status, timeline}) => {
  const normalizedStatus = status?.toUpperCase() || 'ORDER_PLACED';

  // Find the current step index
  const getCurrentStepIndex = (): number => {
    const index = workflowSteps.findIndex(
      step => step.key === normalizedStatus,
    );
    return index >= 0 ? index : 0;
  };

  const currentStepIndex = getCurrentStepIndex();

  // Determine step state
  const getStepState = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (stepIndex < currentStepIndex) {
      return 'completed';
    } else if (stepIndex === currentStepIndex) {
      return 'current';
    }
    return 'pending';
  };

  // Format status for comparison (handle variations)
  const normalizeStatusForStep = (stepKey: string): boolean => {
    // Handle status variations
    if (normalizedStatus === stepKey) {
      return true;
    }
    // Handle legacy status formats
    if (stepKey === 'ORDER_CONFIRMED' && normalizedStatus === 'CONFIRMED') {
      return true;
    }
    if (stepKey === 'OUT_FOR_DELIVERY' && normalizedStatus === 'ARRIVING') {
      return true;
    }
    return false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Icon name="package-variant" color={Colors.disabled} size={RFValue(20)} />
        </View>
        <View>
          <CustomText variant="h5" fontFamily={Fonts.SemiBold}>
            Order Status
          </CustomText>
          <CustomText variant="h8" fontFamily={Fonts.Medium}>
            Track your order journey
          </CustomText>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepperContainer}>
        {workflowSteps.map((step, index) => {
          const stepState = getStepState(index);
          const isCompleted = stepState === 'completed';
          const isCurrent = stepState === 'current';
          const isPending = stepState === 'pending';

          // Check if this step matches current status
          const isActive = normalizeStatusForStep(step.key) || isCurrent;

          return (
            <View key={step.key} style={styles.stepWrapper}>
              <View style={styles.stepContent}>
                {/* Step Icon */}
                <View
                  style={[
                    styles.stepIconContainer,
                    isCompleted && styles.stepIconCompleted,
                    isCurrent && styles.stepIconCurrent,
                    isPending && styles.stepIconPending,
                  ]}>
                  <Icon
                    name={isCompleted || isCurrent ? step.iconFilled : step.icon}
                    color={
                      isCompleted
                        ? Colors.secondary
                        : isCurrent
                        ? Colors.secondary
                        : Colors.disabled
                    }
                    size={RFValue(16)}
                  />
                </View>

                {/* Step Label */}
                <CustomText
                  variant="h9"
                  fontFamily={isCurrent ? Fonts.SemiBold : Fonts.Medium}
                  style={[
                    styles.stepLabel,
                    isCompleted && styles.stepLabelCompleted,
                    isCurrent && styles.stepLabelCurrent,
                    isPending && styles.stepLabelPending,
                  ]}
                  numberOfLines={2}
                  textAlign="center">
                  {step.label}
                </CustomText>
              </View>

              {/* Connecting Line */}
              {index < workflowSteps.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    isCompleted && styles.connectorLineCompleted,
                    !isCompleted && styles.connectorLinePending,
                  ]}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 15,
    marginVertical: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderBottomWidth: 0.7,
    borderColor: Colors.border,
  },
  iconContainer: {
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: 100,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperContainer: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepWrapper: {
    alignItems: 'center',
    minWidth: 70,
    maxWidth: 90,
    marginRight: 0,
    position: 'relative',
    flex: 1,
  },
  stepContent: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  stepIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.backgroundSecondary,
    borderWidth: 2,
    borderColor: Colors.disabled,
  },
  stepIconCompleted: {
    backgroundColor: Colors.secondary + '15',
    borderColor: Colors.secondary,
  },
  stepIconCurrent: {
    backgroundColor: Colors.secondary + '20',
    borderColor: Colors.secondary,
    borderWidth: 2.5,
  },
  stepIconPending: {
    backgroundColor: Colors.backgroundSecondary,
    borderColor: Colors.disabled,
  },
  stepLabel: {
    fontSize: RFValue(9),
    textAlign: 'center',
  },
  stepLabelCompleted: {
    color: Colors.secondary,
  },
  stepLabelCurrent: {
    color: Colors.secondary,
  },
  stepLabelPending: {
    color: Colors.disabled,
  },
  connectorLine: {
    position: 'absolute',
    top: 16,
    right: -35,
    width: 35,
    height: 2,
    zIndex: 0,
  },
  connectorLineCompleted: {
    backgroundColor: Colors.secondary,
  },
  connectorLinePending: {
    backgroundColor: Colors.border,
  },
});

export default OrderWorkflow;

