import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';

type NavigationProps = StackNavigationProp<any>;

const ConnectedScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { 
    selectedDevice, 
    disconnectDevice,
    deviceBatteryLevel,
    deviceSignalStrength
  } = useBluetooth();

  const handleDisconnect = () => {
    disconnectDevice();
    navigation.navigate('BluetoothDeviceList');
  };

  const handleGoHome = () => {
    // Navigate to the home screen or dashboard
    navigation.navigate('Home');
  };

  const getBatteryIcon = () => {
    const level = deviceBatteryLevel || 0;
    
    if (level >= 80) return 'battery';
    if (level >= 50) return 'battery-60';
    if (level >= 30) return 'battery-40';
    if (level >= 10) return 'battery-20';
    return 'battery-alert-variant-outline';
  };

  const getSignalIcon = () => {
    const strength = deviceSignalStrength || 0;
    
    if (strength >= 80) return 'signal';
    if (strength >= 60) return 'signal-4';
    if (strength >= 40) return 'signal-3';
    if (strength >= 20) return 'signal-2';
    return 'signal-1';
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkBackground} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Connected Device</Text>
        <View style={styles.placeholder} />
      </View>
      
      {/* Card container */}
      <View style={styles.cardContainer}>
        <View style={styles.successIconContainer}>
          <Icon name="bluetooth-connect" size={40} color={COLORS.white} />
        </View>
        
        <Text style={styles.deviceName}>{selectedDevice?.name || 'Device'}</Text>
        <Text style={styles.deviceStatus}>Connected</Text>
        
        <View style={styles.deviceInfoCard}>
          <View style={styles.deviceInfoRow}>
            <Icon name={getBatteryIcon()} size={24} color={COLORS.primary} />
            <Text style={styles.deviceInfoLabel}>Battery</Text>
            <Text style={styles.deviceInfoValue}>{deviceBatteryLevel || '--'}%</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.deviceInfoRow}>
            <Icon name={getSignalIcon()} size={24} color={COLORS.primary} />
            <Text style={styles.deviceInfoLabel}>Signal Strength</Text>
            <Text style={styles.deviceInfoValue}>{deviceSignalStrength || '--'}%</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.deviceInfoRow}>
            <Icon name="bluetooth" size={24} color={COLORS.primary} />
            <Text style={styles.deviceInfoLabel}>Device ID</Text>
            <Text style={styles.deviceInfoValue}>{selectedDevice?.id?.substring(0, 8) || 'Unknown'}</Text>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.primaryButton]} 
            onPress={handleGoHome}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]} 
            onPress={handleDisconnect}
          >
            <Text style={styles.secondaryButtonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.large,
    paddingVertical: SIZES.medium,
  },
  backButton: {
    padding: SIZES.small,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: 24,
    opacity: 0,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: SIZES.large,
    marginBottom: SIZES.large,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.large,
    padding: SIZES.large,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SIZES.xlarge,
  },
  deviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: SIZES.small,
  },
  deviceStatus: {
    fontSize: 16,
    color: COLORS.success,
    fontWeight: '500',
    marginBottom: SIZES.xlarge,
  },
  deviceInfoCard: {
    width: '100%',
    backgroundColor: COLORS.lightBackground,
    borderRadius: SIZES.medium,
    marginBottom: SIZES.xlarge,
    overflow: 'hidden',
  },
  deviceInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SIZES.medium,
  },
  deviceInfoLabel: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    marginLeft: SIZES.small,
  },
  deviceInfoValue: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primary,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: SIZES.medium,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 'auto',
  },
  button: {
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    alignItems: 'center',
    marginBottom: SIZES.medium,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  secondaryButtonText: {
    color: COLORS.error,
    fontSize: 16,
  },
});

export default ConnectedScreen; 