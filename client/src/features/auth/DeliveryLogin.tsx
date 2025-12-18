import {View, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import React, {FC, useState} from 'react';
import {deliveryLogin} from '@service/authService';
import {navigate, resetAndNavigate} from '@utils/NavigationUtils';
import CustomSafeAreaView from '@components/global/CustomSafeAreaView';
import {screenHeight} from '@utils/Scaling';
import LottieView from 'lottie-react-native';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import CustomInput from '@components/ui/CustomInput';
import Icon from 'react-native-vector-icons/Ionicons'
import { RFValue } from 'react-native-responsive-fontsize';
import CustomButton from '@components/ui/CustomButton';
import ThemedModal from '@components/ui/ThemedModal';

const DeliveryLogin: FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    try {
      await deliveryLogin(email, password);
      resetAndNavigate('DeliveryDashboard');
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.Response?.ReturnMessage ||
        error?.response?.data?.message ||
        error?.message ||
        'Login failed. Please try again.';
      setErrorModalMessage(errorMessage);
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomSafeAreaView>
      <ThemedModal
        visible={errorModalVisible}
        title="Login Failed"
        message={errorModalMessage}
        variant="error"
        primaryText="OK"
        onClose={() => setErrorModalVisible(false)}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
        <View style={styles.container}>
          <View style={styles.lottieContainer}>
            <LottieView
              autoPlay
              loop
              style={styles.lottie}
              source={require('@assets/animations/delivery_man.json')}
              hardwareAccelerationAndroid
            />
          </View>

          <CustomText variant='h3' fontFamily={Fonts.Bold}>
            Delivery Partner Portal
          </CustomText>
          <CustomText variant='h6' style={styles.text} fontFamily={Fonts.SemiBold}>
            Faster than Flash⚡️
          </CustomText>


          <CustomInput
            onChangeText={setEmail}
            value={email}
            left={
            <Icon
              name='mail'
              color='#F8890E'
              style={{ marginLeft: 10 }}
              size={RFValue(18)} />
            }
            placeholder='Email'
            inputMode='email'
            right={false}
          />

          <CustomInput
            onChangeText={setPassword}
            value={password}
            left={<Icon
              name='key-sharp'
              color='#F8890E'
              style={{ marginLeft: 10 }}
              size={RFValue(18)} />}
            placeholder='Password'
            secureTextEntry
            right={false}
          />

          <TouchableOpacity
            onPress={() =>
              navigate('ForgotPassword', {
                returnTo: 'DeliveryLogin',
                prefillEmail: email,
              })
            }
            style={{ alignSelf: 'flex-end', marginTop: 6 }}>
            <CustomText variant="h6" fontFamily={Fonts.Medium} style={{ color: '#F8890E' }}>
              Forgot password?
            </CustomText>
          </TouchableOpacity>

        <CustomButton
            disabled={email.length == 0 || password.length < 8}
            title='Login'
            onPress={handleLogin}
            loading={loading}
          />


        </View>
      </ScrollView>
    </CustomSafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  lottie: {
    height: '100%',
    width: '100%',
  },
  lottieContainer: {
    height: screenHeight * 0.12,
    width: '100%',
  },
  text: {
    marginTop: 2,
    marginBottom: 25,
    opacity: 0.8,
  },
});

export default DeliveryLogin;
