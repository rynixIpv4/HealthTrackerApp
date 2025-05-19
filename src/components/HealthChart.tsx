import React from 'react';
import { View, Text, StyleSheet, Dimensions, ViewStyle } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { COLORS, SIZES } from '../constants';

interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    color?: (opacity?: number) => string;
    strokeWidth?: number;
  }[];
}

interface HealthChartProps {
  title: string;
  data: ChartData;
  unit?: string;
  height?: number;
  width?: number;
  style?: ViewStyle;
  yAxisSuffix?: string;
  yAxisInterval?: number;
  formatYLabel?: (value: string) => string;
  formatXLabel?: (value: string) => string;
  withDots?: boolean;
  withInnerLines?: boolean;
  withOuterLines?: boolean;
  withHorizontalLines?: boolean;
  withVerticalLines?: boolean;
  backgroundColor?: string;
  noDataText?: string;
}

const screenWidth = Dimensions.get('window').width - 2 * SIZES.large;

const HealthChart: React.FC<HealthChartProps> = ({
  title,
  data,
  unit = '',
  height = 200,
  width = screenWidth,
  style,
  yAxisSuffix = '',
  yAxisInterval = 1,
  formatYLabel,
  formatXLabel,
  withDots = true,
  withInnerLines = true,
  withOuterLines = true,
  withHorizontalLines = true,
  withVerticalLines = true,
  backgroundColor = COLORS.white,
  noDataText = 'No data available',
}) => {
  const hasData = data && data.datasets && data.datasets[0]?.data?.length > 0;

  const chartConfig = {
    backgroundColor: backgroundColor,
    backgroundGradientFrom: backgroundColor,
    backgroundGradientTo: backgroundColor,
    decimalPlaces: 0,
    color: (opacity = 1) => COLORS.primary,
    labelColor: (opacity = 1) => COLORS.gray,
    style: {
      borderRadius: SIZES.medium,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
    propsForBackgroundLines: {
      stroke: COLORS.lightGray,
      strokeWidth: 1,
    },
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      
      {hasData ? (
        <LineChart
          data={data}
          width={width}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          yAxisSuffix={yAxisSuffix}
          yAxisInterval={yAxisInterval}
          formatYLabel={formatYLabel}
          formatXLabel={formatXLabel}
          withDots={withDots}
          withInnerLines={withInnerLines}
          withOuterLines={withOuterLines}
          withHorizontalLines={withHorizontalLines}
          withVerticalLines={withVerticalLines}
        />
      ) : (
        <View style={[styles.noDataContainer, { width, height }]}>
          <Text style={styles.noDataText}>{noDataText}</Text>
        </View>
      )}
      
      {hasData && unit && (
        <View style={styles.unitContainer}>
          <Text style={styles.unitText}>Unit: {unit}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.medium,
    padding: SIZES.medium,
    marginVertical: SIZES.small,
  },
  title: {
    fontSize: SIZES.large,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SIZES.medium,
  },
  chart: {
    borderRadius: SIZES.medium,
  },
  unitContainer: {
    alignItems: 'flex-end',
    marginTop: SIZES.small,
  },
  unitText: {
    fontSize: SIZES.font,
    color: COLORS.gray,
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
    borderRadius: SIZES.medium,
  },
  noDataText: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    fontWeight: '500',
  },
});

export default HealthChart; 