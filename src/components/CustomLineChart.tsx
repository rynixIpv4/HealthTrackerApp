import React from 'react';
import { Dimensions, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

interface CustomLineChartProps {
  data: number[];
  labels: string[];
  color: string;
  width?: number;
  height?: number;
  withGradient?: boolean;
  withDots?: boolean;
}

/**
 * A custom LineChart component with consistent styling throughout the app
 */
const CustomLineChart: React.FC<CustomLineChartProps> = ({
  data,
  labels,
  color,
  width = Dimensions.get('window').width - 50,
  height = 200,
  withGradient = true,
  withDots = true,
}) => {
  return (
    <View style={{ 
      borderRadius: 16, 
      overflow: 'hidden',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      padding: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    }}>
      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: data.length > 0 ? data : [0],
              color: () => color,
              strokeWidth: 3,
            },
          ],
        }}
        width={width - 24} // Adjust for padding
        height={height}
        chartConfig={{
          backgroundColor: 'rgba(255, 255, 255, 1)',
          backgroundGradientFrom: 'rgba(255, 255, 255, 1)',
          backgroundGradientTo: 'rgba(250, 250, 250, 1)',
          decimalPlaces: 0,
          color: () => color,
          labelColor: () => '#777777',
          propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#ffffff"
          },
          propsForBackgroundLines: {
            strokeDasharray: '', 
            stroke: 'rgba(230, 230, 230, 0.6)',
            strokeWidth: 1
          },
          fillShadowGradient: withGradient ? color : 'transparent',
          fillShadowGradientOpacity: 0.15,
          useShadowColorFromDataset: false,
        }}
        withHorizontalLines={true}
        withVerticalLines={false}
        withInnerLines={false}
        withOuterLines={false}
        withShadow={false}
        bezier
        style={{
          borderRadius: 8,
          paddingRight: 0,
        }}
        getDotColor={() => color}
        renderDotContent={withDots ? undefined : () => null}
        fromZero={true}
        yAxisInterval={4}
      />
    </View>
  );
};

export default CustomLineChart; 