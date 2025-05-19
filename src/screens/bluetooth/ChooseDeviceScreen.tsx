import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { COLORS, SIZES } from '../../constants';
import { useBluetooth } from '../../contexts/BluetoothContext';
import { useTheme, getThemeColors } from '../../contexts/ThemeContext';
import bluetoothService from '../../services/bluetooth';

type NavigationProps = StackNavigationProp<any>;

const ChooseDeviceScreen = () => {
  const navigation = useNavigation<NavigationProps>();
  const { availableDevices, connectToDevice } = useBluetooth();
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);
  
  // Track which device we're connecting to
  const [connectingDeviceId, setConnectingDeviceId] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  
  // We'll use a consistent dark background for this process regardless of app theme
  const backgroundStyle = isDarkMode ? colors.background : COLORS.darkBackground;
  const textColor = isDarkMode ? colors.text : COLORS.white;
  const cardBgColor = isDarkMode ? colors.surface : COLORS.white;
  const cardTextColor = isDarkMode ? colors.text : COLORS.dark;
  const cardSubtextColor = isDarkMode ? colors.textSecondary : COLORS.gray;
  const borderColor = isDarkMode ? colors.border : '#EEE';
  
  // Filter and sort devices - prioritize real smart rings
  const organizedDevices = useMemo(() => {
    // Filter out any mock devices
    const filteredDevices = availableDevices.filter(device => {
      const name = device.name?.toLowerCase() || '';
      return !(
        name.includes('simulator') || 
        name.includes('mock') || 
        name.includes('virtual') ||
        name.includes('emu') ||
        name.includes('test') ||
        name.includes('galaxy buds') ||
        name.includes('airpods') ||
        name.includes('bluetooth le audio') ||
        name.includes('audio sink') ||
        name.includes('audio source')
      );
    });
    
    // Sort by: 1. Smart ring status, 2. Signal strength (RSSI)
    return filteredDevices.sort((a, b) => {
      // First prioritize Colmi R02 rings
      const aIsColmi = bluetoothService.isColmiRing(a);
      const bIsColmi = bluetoothService.isColmiRing(b);
      
      if (aIsColmi && !bIsColmi) return -1;
      if (!aIsColmi && bIsColmi) return 1;
      
      // Then prioritize any smart ring
      if (a.isSmartRing && !b.isSmartRing) return -1;
      if (!a.isSmartRing && b.isSmartRing) return 1;
      
      // Then sort by signal strength
      if (a.rssi && b.rssi) {
        return Math.abs(a.rssi) - Math.abs(b.rssi); // Higher RSSI (closer to 0) comes first
      }
      
      // If one has RSSI and other doesn't, prioritize the one with RSSI
      if (a.rssi && !b.rssi) return -1;
      if (!a.rssi && b.rssi) return 1;
      
      // Finally sort by name
      return a.name?.localeCompare(b.name || '') || 0;
    });
  }, [availableDevices]);
  
  // Check if we have real smart rings available
  const hasSmartRings = useMemo(() => {
    return organizedDevices.some(device => 
      device.isSmartRing || bluetoothService.isColmiRing(device)
    );
  }, [organizedDevices]);
  
  // Function to determine if a device is likely in pairing mode based on signal strength
  const isInPairingMode = (device: any) => {
    // Strong signal devices are likely in pairing mode
    return device.rssi && device.rssi > -70;
  };

  const handleDeviceSelect = async (device: any) => {
    // Prevent multiple connection attempts
    if (connectingDeviceId) return;
    
    try {
      // Clear any previous errors
      setScanError(null);
      
      // Set connecting state
      setConnectingDeviceId(device.id);
      
      // If it's a Colmi ring, show pairing instructions
      if (bluetoothService.isColmiRing(device)) {
        Alert.alert(
          "Connecting to Smart Ring",
          "To pair with your Colmi R02 Smart Ring:\n\n" +
          "1. Ensure the ring is charged\n" +
          "2. Keep the ring very close to your phone\n" +
          "3. The ring should vibrate when connected\n\n" +
          "Connecting now...",
          [{ text: "OK" }]
        );
      }
      
      // Connect to device
      const success = await connectToDevice(device.id);
      
      if (success) {
        navigation.navigate('PairingDevice');
      } else {
        // If connection failed, show error
        setScanError("Could not connect to the device. Make sure it's in pairing mode and try again.");
        Alert.alert(
          "Connection Failed",
          "Could not connect to the device. Make sure it's in pairing mode and try again.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Connection error:", error);
      setScanError("Connection error. Please try again.");
      Alert.alert(
        "Connection Error",
        "An error occurred while connecting to the device. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setConnectingDeviceId(null);
    }
  };

  const handleSearchAgain = () => {
    // Clear any errors before searching again
    setScanError(null);
    navigation.navigate('ScanningDevices');
  };
  
  // Add function to reconnect to previously paired ring
  const handleReconnectToRing = async () => {
    try {
      // Clear any previous errors
      setScanError(null);
      setReconnecting(true);
      
      // Attempt to reconnect
      const success = await bluetoothService.reconnectToRing();
      
      if (success) {
        // If reconnection successful, move to next screen
        navigation.navigate('PairingDevice');
      } else {
        // Show error if reconnection failed
        setScanError("Could not reconnect to your ring. Try scanning for it instead.");
        Alert.alert(
          "Reconnection Failed",
          "Could not reconnect to your previous ring. Try scanning for it instead.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Reconnection error:", error);
      setScanError("Reconnection error. Please try again.");
    } finally {
      setReconnecting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: backgroundStyle }]}>
      <StatusBar barStyle="light-content" backgroundColor={backgroundStyle} />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Choose Device</Text>
        <Text style={[styles.helpText, { color: textColor }]}>Help</Text>
      </View>
      
      {/* Card container */}
      <View style={[styles.cardContainer, { backgroundColor: cardBgColor }]}>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: cardTextColor }]}>Connect Smart Ring</Text>
          
          {/* Error Message */}
          {scanError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{scanError}</Text>
            </View>
          )}
          
          {hasSmartRings ? (
            <Text style={[styles.cardDescription, { color: cardSubtextColor }]}>
              Smart rings found! Select your Colmi R02 device to connect:
            </Text>
          ) : (
            <Text style={[styles.cardDescription, { color: cardSubtextColor }]}>
              No smart rings detected. Make sure your ring is in pairing mode and nearby.
            </Text>
          )}
          
          {/* Device List */}
          {organizedDevices.length > 0 ? (
            <ScrollView style={styles.deviceList}>
              {organizedDevices.map((device, index) => {
                const isColmi = bluetoothService.isColmiRing(device);
                const isPairable = isInPairingMode(device);
                const isConnecting = connectingDeviceId === device.id;
                
                return (
                  <TouchableOpacity 
                    key={device.id || index} 
                    style={[
                      styles.deviceItem, 
                      { 
                        borderBottomColor: borderColor,
                        backgroundColor: isColmi ? 
                          `${colors.primary}15` :  // Slight tint for Colmi devices
                          device.isSmartRing ? `${colors.cardSteps}20` : 'transparent',
                      }
                    ]}
                    onPress={() => handleDeviceSelect(device)}
                    disabled={connectingDeviceId !== null || reconnecting} // Disable all when connecting
                  >
                    <View style={styles.deviceInfo}>
                      <View style={styles.deviceNameContainer}>
                        <Text style={[styles.deviceName, { color: cardTextColor }]}>
                          {device.name || "Unknown Device"}
                        </Text>
                        
                        {isColmi && (
                          <View style={styles.badge}>
                            <Text style={styles.badgeText}>Colmi R02 Ring</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={[styles.deviceMac, { color: cardSubtextColor }]}>
                        {device.id?.substring(0, 17)}...
                      </Text>
                      
                      {/* Pairing readiness indicator */}
                      {device.rssi && (
                        <View style={styles.pairingContainer}>
                          <View style={[
                            styles.pairingIndicator, 
                            { backgroundColor: isPairable ? '#4CAF50' : '#FFC107' }
                          ]} />
                          <Text style={[styles.pairingText, { 
                            color: isPairable ? '#4CAF50' : '#FFC107'
                          }]}>
                            {isPairable ? 'Ready to Pair' : 'Move Closer'}
                          </Text>
                        </View>
                      )}
                      
                      {/* Signal indicator */}
                      {device.rssi && (
                        <View style={styles.signalContainer}>
                          <Text style={[styles.signalText, { color: cardSubtextColor }]}>
                            Signal: {device.rssi > -60 ? 'Strong' : 
                                    device.rssi > -80 ? 'Good' : 'Weak'} ({device.rssi} dBm)
                          </Text>
                          <View style={styles.signalBars}>
                            <View 
                              style={[
                                styles.signalBar, 
                                { 
                                  backgroundColor: device.rssi > -90 ? colors.primary : borderColor,
                                  height: 5
                                }
                              ]} 
                            />
                            <View 
                              style={[
                                styles.signalBar, 
                                { 
                                  backgroundColor: device.rssi > -80 ? colors.primary : borderColor,
                                  height: 8 
                                }
                              ]} 
                            />
                            <View 
                              style={[
                                styles.signalBar, 
                                { 
                                  backgroundColor: device.rssi > -70 ? colors.primary : borderColor,
                                  height: 11
                                }
                              ]} 
                            />
                            <View 
                              style={[
                                styles.signalBar, 
                                { 
                                  backgroundColor: device.rssi > -60 ? colors.primary : borderColor,
                                  height: 14
                                }
                              ]} 
                            />
                          </View>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.connectButton}>
                      {isConnecting ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <Text style={[styles.connectButtonText, { 
                          color: isPairable ? colors.primary : '#888'
                        }]}>
                          Connect
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.noDevicesContainer}>
              <Text style={[styles.noDevicesText, { color: cardSubtextColor }]}>
                No devices found. Try searching again.
              </Text>
            </View>
          )}
          
          {/* Button container */}
          <View style={styles.buttonContainer}>
            {/* Reconnect to previous ring button */}
            <TouchableOpacity 
              style={[
                styles.reconnectButton, 
                { backgroundColor: isDarkMode ? colors.secondary : COLORS.secondary }
              ]} 
              onPress={handleReconnectToRing}
              disabled={connectingDeviceId !== null || reconnecting}
            >
              {reconnecting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reconnect to Ring</Text>
              )}
            </TouchableOpacity>
            
            {/* Search again button */}
            <TouchableOpacity 
              style={[
                styles.searchButton, 
                { backgroundColor: isDarkMode ? colors.primary : COLORS.dark }
              ]} 
              onPress={handleSearchAgain}
              disabled={connectingDeviceId !== null || reconnecting}
            >
              <Text style={styles.buttonText}>Search Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SIZES.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SIZES.large,
    paddingBottom: SIZES.medium,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    marginHorizontal: SIZES.large,
    marginBottom: SIZES.large + 70, // Adding extra bottom margin to prevent tab bar overlap
    borderRadius: SIZES.large,
    overflow: 'hidden',
  },
  cardContent: {
    flex: 1,
    padding: SIZES.large,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  deviceList: {
    width: '100%',
    flex: 1,
    marginBottom: SIZES.medium,
  },
  deviceItem: {
    padding: SIZES.medium,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  badge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  deviceMac: {
    fontSize: 14,
    marginTop: 4,
  },
  pairingContainer: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pairingIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  pairingText: {
    fontSize: 12,
    fontWeight: '500',
  },
  signalContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    fontSize: 12,
    marginRight: 8,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 14,
  },
  signalBar: {
    width: 4,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  connectButton: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 6,
    paddingHorizontal: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  connectButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  searchButton: {
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    flex: 1,
    alignItems: 'center',
    marginLeft: 8,
  },
  reconnectButton: {
    paddingVertical: SIZES.medium,
    borderRadius: SIZES.small,
    flex: 1,
    alignItems: 'center',
    marginRight: 8,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonContainer: {
    width: '100%',
    flexDirection: 'row',
    marginTop: SIZES.medium,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SIZES.small,
    borderRadius: SIZES.small,
    marginBottom: SIZES.medium,
    width: '100%',
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  noDevicesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  noDevicesText: {
    fontSize: 16,
    textAlign: 'center',
  }
});

export default ChooseDeviceScreen; 