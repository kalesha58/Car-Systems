import {useEffect, useRef, useState} from 'react';
import Geolocation from '@react-native-community/geolocation';
import {startLiveLocation, stopLiveLocation} from '@service/chatService';
import {getChatById} from '@service/chatService';
import {IGroup} from '../types/group';
import {useToast} from './useToast';
import {requestLocationPermission} from '@utils/addressUtils';
import {displayNotifeeNotification} from '@service/notificationService';

interface IUseGroupLiveLocationProps {
  group: IGroup | null;
  chatId?: string;
  enabled?: boolean;
}

export const useGroupLiveLocation = ({
  group,
  chatId,
  enabled = true,
}: IUseGroupLiveLocationProps) => {
  const [isActive, setIsActive] = useState(false);
  const [wasActive, setWasActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const {showSuccess} = useToast();

  const checkAndUpdateLocation = async () => {
    if (!group?.tripPlan || !chatId || !enabled || !group.liveLocationEnabled) {
      return;
    }

    const now = new Date();
    const startDate = new Date(group.tripPlan.startDate);
    const endDate = new Date(group.tripPlan.endDate);

    // Check if we're within the date range
    if (now < startDate || now > endDate) {
      if (isActive) {
        await stopLocationTracking();
      }
      return;
    }

    // Check time if provided
    if (group.tripPlan.startTime && group.tripPlan.endTime) {
      const [startHour, startMin] = group.tripPlan.startTime.split(':').map(Number);
      const [endHour, endMin] = group.tripPlan.endTime.split(':').map(Number);

      const startTime = new Date(startDate);
      startTime.setHours(startHour, startMin, 0, 0);

      const endTime = new Date(endDate);
      endTime.setHours(endHour, endMin, 0, 0);

      const currentTime = new Date();
      const currentTimeOnly = new Date();
      currentTimeOnly.setFullYear(1970, 0, 1);
      currentTimeOnly.setHours(currentTime.getHours(), currentTime.getMinutes(), 0, 0);

      const startTimeOnly = new Date();
      startTimeOnly.setFullYear(1970, 0, 1);
      startTimeOnly.setHours(startHour, startMin, 0, 0);

      const endTimeOnly = new Date();
      endTimeOnly.setFullYear(1970, 0, 1);
      endTimeOnly.setHours(endHour, endMin, 0, 0);

      // Check if current time is within the time window
      const isWithinTimeWindow =
        currentTimeOnly >= startTimeOnly && currentTimeOnly <= endTimeOnly;

      if (isWithinTimeWindow && !isActive) {
        await startLocationTracking();
      } else if (!isWithinTimeWindow && isActive) {
        await stopLocationTracking();
      }
    } else {
      // If no time specified, activate for the entire date range
      if (!isActive) {
        await startLocationTracking();
      }
    }
  };

  const startLocationTracking = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        return;
      }

      // Get current location
      Geolocation.getCurrentPosition(
        async position => {
          const coordinates = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          try {
            await startLiveLocation(chatId!, coordinates);
            setIsActive(true);
            setWasActive(true);

            // Send notification
            await displayNotifeeNotification(
              'Live Location Started',
              `Your live location sharing has started for ${group?.name || 'the group'}`,
              {type: 'live_location_start', groupId: group?.id},
            );

            // Start watching position
            watchIdRef.current = Geolocation.watchPosition(
              async position => {
                const coords = {
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude,
                };
                try {
                  await startLiveLocation(chatId!, coords);
                } catch (error) {
                  console.error('Error updating live location:', error);
                }
              },
              error => {
                console.error('Error watching position:', error);
              },
              {
                enableHighAccuracy: true,
                distanceFilter: 50, // Update every 50 meters
                interval: 30000, // Update every 30 seconds
              },
            );
          } catch (error) {
            console.error('Error starting live location:', error);
          }
        },
        error => {
          console.error('Error getting current position:', error);
        },
        {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
      );
    } catch (error) {
      console.error('Error in startLocationTracking:', error);
    }
  };

  const stopLocationTracking = async () => {
    try {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }

      if (chatId && wasActive) {
        await stopLiveLocation(chatId);
        setIsActive(false);

        // Send notification
        await displayNotifeeNotification(
          'Live Location Stopped',
          `Your live location sharing has stopped for ${group?.name || 'the group'}`,
          {type: 'live_location_stop', groupId: group?.id},
        );
      }
    } catch (error) {
      console.error('Error stopping live location:', error);
    }
  };

  useEffect(() => {
    if (!group || !chatId || !enabled) {
      return;
    }

    // Check immediately
    checkAndUpdateLocation();

    // Check every minute
    checkIntervalRef.current = setInterval(() => {
      checkAndUpdateLocation();
    }, 60000); // Check every minute

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
      }
      if (isActive && chatId) {
        stopLocationTracking();
      }
    };
  }, [group, chatId, enabled]);

  return {
    isActive,
    startLocationTracking,
    stopLocationTracking,
  };
};
