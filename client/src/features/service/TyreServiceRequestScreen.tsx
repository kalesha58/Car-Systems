import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

type TyreServiceRequestRouteParams = {
  TyreServiceRequest: {
    serviceId: string;
  };
};

/** @deprecated Tyre booking uses slot flow on ServiceDetail. Redirects for deep links. */
const TyreServiceRequestScreen: React.FC = () => {
  const route = useRoute<RouteProp<TyreServiceRequestRouteParams, 'TyreServiceRequest'>>();
  const navigation = useNavigation();
  const { serviceId } = route.params;

  useEffect(() => {
    (navigation as any).replace('ServiceDetail', { serviceId });
  }, [navigation, serviceId]);

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default TyreServiceRequestScreen;
