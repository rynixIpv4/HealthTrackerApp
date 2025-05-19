import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { COLORS, SIZES, ELEVATION_STYLES } from '../constants';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  backgroundColor?: string;
  style?: ViewStyle;
  onPress?: () => void;
  trendValue?: number;
  trendIcon?: React.ReactNode;
  textColor?: string;
  secondaryColor?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon,
  backgroundColor = COLORS.white,
  style,
  onPress,
  trendValue,
  trendIcon,
  textColor = COLORS.black,
  secondaryColor = COLORS.gray
}) => {
  const CardComponent = onPress ? TouchableOpacity : View;

  const getTrendColor = () => {
    if (trendValue === undefined) return COLORS.gray;
    return trendValue > 0 ? COLORS.success : trendValue < 0 ? COLORS.danger : COLORS.gray;
  };

  return (
    <CardComponent
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.title, { color: secondaryColor }]}>{title}</Text>
        </View>
      </View>
      
      <View style={styles.valueContainer}>
        <Text style={[styles.value, { color: textColor }]}>
          {value}
          {unit && <Text style={[styles.unit, { color: secondaryColor }]}> {unit}</Text>}
        </Text>
      </View>
      
      {(trendValue !== undefined || trendIcon) && (
        <View style={styles.trendContainer}>
          {trendIcon && <View style={styles.trendIcon}>{trendIcon}</View>}
          {trendValue !== undefined && (
            <Text style={[styles.trendValue, { color: getTrendColor() }]}>
              {trendValue > 0 ? '+' : ''}
              {trendValue}%
            </Text>
          )}
        </View>
      )}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    minWidth: 150,
    ...ELEVATION_STYLES.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SIZES.small,
  },
  iconContainer: {
    marginRight: SIZES.base,
  },
  title: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },
  valueContainer: {
    marginBottom: SIZES.small,
  },
  value: {
    fontSize: SIZES.xlarge,
    fontWeight: 'bold',
  },
  unit: {
    fontSize: SIZES.medium,
    fontWeight: 'normal',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendIcon: {
    marginRight: SIZES.base,
  },
  trendValue: {
    fontSize: SIZES.font,
    fontWeight: '500',
  },
});

export default MetricCard; 