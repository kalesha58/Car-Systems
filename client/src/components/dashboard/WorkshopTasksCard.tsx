import React, { FC, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import { useTheme } from '@hooks/useTheme';
import IconIonicons from 'react-native-vector-icons/Ionicons';
import { getDealerServiceBookings, IServiceBooking } from '@service/serviceBookingService';
import { useTranslation } from 'react-i18next';

interface WorkshopTasksCardProps {
  limit?: number;
}

const WorkshopTasksCard: FC<WorkshopTasksCardProps> = ({ limit = 3 }) => {
  const { colors: theme } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [tasks, setTasks] = useState<IServiceBooking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch bookings that can be mapped to tasks (in_progress, awaiting, new)
      const [inProgress, awaiting, newBookings] = await Promise.all([
        getDealerServiceBookings({ status: 'in_progress', limit: 10 }),
        getDealerServiceBookings({ status: 'awaiting', limit: 10 }),
        getDealerServiceBookings({ status: 'new', limit: 10 }),
      ]);

      // Combine and prioritize: in_progress > awaiting > new
      const allTasks = [
        ...inProgress.bookings.map(b => ({ ...b, taskPriority: 'high' as const })),
        ...awaiting.bookings.map(b => ({ ...b, taskPriority: 'high' as const })),
        ...newBookings.bookings.map(b => ({ ...b, taskPriority: 'medium' as const })),
      ].slice(0, limit);

      setTasks(allTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getPriorityColor = (priority?: 'high' | 'medium' | 'low'): string => {
    switch (priority) {
      case 'high':
        return '#ef4444'; // red
      case 'medium':
        return '#f59e0b'; // amber
      case 'low':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: theme.border || 'transparent',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    title: {
      fontSize: RFValue(16),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
    },
    subtitle: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
      marginBottom: 12,
    },
    taskItem: {
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border || theme.backgroundSecondary,
    },
    lastTaskItem: {
      borderBottomWidth: 0,
    },
    taskHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    taskInfo: {
      flex: 1,
    },
    taskTitle: {
      fontSize: RFValue(14),
      fontFamily: Fonts.SemiBold,
      color: theme.text,
      marginBottom: 4,
    },
    taskDetails: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
      marginBottom: 2,
    },
    priorityBadge: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 4,
      alignSelf: 'flex-start',
    },
    priorityText: {
      fontSize: RFValue(10),
      fontFamily: Fonts.Medium,
    },
    viewAllButton: {
      marginTop: 12,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: theme.primary,
      alignItems: 'center',
    },
    viewAllButtonText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.SemiBold,
      color: theme.white || '#FFFFFF',
    },
    emptyState: {
      paddingVertical: 20,
      alignItems: 'center',
    },
    emptyText: {
      fontSize: RFValue(12),
      fontFamily: Fonts.Regular,
      color: theme.textSecondary,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: 'center',
    },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <IconIonicons name="construct-outline" size={RFValue(20)} color={theme.text} />
            <CustomText style={styles.title}>
              {t('dealer.workshopTasks') || 'Workshop Tasks'}
            </CustomText>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (tasks.length === 0) {
    return null; // Don't show card if no tasks
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <IconIonicons name="construct-outline" size={RFValue(20)} color={theme.text} />
          <CustomText style={styles.title}>
            {t('dealer.workshopTasks') || 'Workshop Tasks'}
          </CustomText>
        </View>
      </View>
      <CustomText style={styles.subtitle}>
        {t('dealer.currentTasksAndPriorities') || 'Current tasks and priorities in the workshop.'}
      </CustomText>

      {tasks.map((task, index) => {
        const priority = task.priority || (task.status === 'in_progress' || task.status === 'awaiting' ? 'high' : 'medium');
        return (
          <View
            key={task.id}
            style={[
              styles.taskItem,
              index === tasks.length - 1 && styles.lastTaskItem,
            ]}>
            <View style={styles.taskHeader}>
              <View style={styles.taskInfo}>
                <CustomText style={styles.taskTitle}>
                  {task.serviceRequest} - {task.vehicleName || task.vehicleInfo?.brand || 'Vehicle'}
                </CustomText>
                {task.assignedMechanic && (
                  <CustomText style={styles.taskDetails}>
                    {t('dealer.assignedTo') || 'Assigned to'}: {task.assignedMechanic}
                  </CustomText>
                )}
                {task.bookingDate && (
                  <CustomText style={styles.taskDetails}>
                    {t('dealer.due') || 'Due'}: {formatDate(task.bookingDate)}
                  </CustomText>
                )}
              </View>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(priority) + '20' }]}>
                <CustomText style={[styles.priorityText, { color: getPriorityColor(priority) }]}>
                  {priority === 'high' ? t('dealer.highPriority') || 'High Priority' : 
                   priority === 'medium' ? t('dealer.mediumPriority') || 'Medium Priority' : 
                   t('dealer.lowPriority') || 'Low Priority'}
                </CustomText>
              </View>
            </View>
          </View>
        );
      })}

      <TouchableOpacity style={styles.viewAllButton} onPress={() => {}}>
        <CustomText style={styles.viewAllButtonText}>
          {t('dealer.viewAllTasksAssign') || 'View All Tasks / Assign'}
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

export default WorkshopTasksCard;
