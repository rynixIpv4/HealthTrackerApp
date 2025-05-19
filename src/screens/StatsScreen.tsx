import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme, getThemeColors } from '../contexts/ThemeContext';
import { COLORS, SIZES } from '../constants';

const screenWidth = Dimensions.get('window').width;

interface StatsScreenProps {
  navigation: any;
}

const StatsScreen: React.FC<StatsScreenProps> = ({ navigation }) => {
  // Theme context
  const { theme, isDarkMode } = useTheme();
  const colors = getThemeColors(theme);

  // Example chart data
  const heartRateData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [65, 72, 68, 75, 71, 69, 72],
        color: (opacity = 1) => `rgba(255, 82, 82, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Heart Rate (bpm)'],
  };

  const stepData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [6240, 8320, 5400, 7200, 9100, 10500, 6800],
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
    labelColor: (opacity = 1) => isDarkMode 
      ? `rgba(255, 255, 255, ${opacity})` 
      : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: '#ffa726',
    },
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? "light-content" : "dark-content"} 
        backgroundColor={colors.background} 
      />
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Health Statistics</Text>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: isDarkMode ? 'rgba(74, 144, 226, 0.2)' : 'rgba(74, 144, 226, 0.1)' }]}
          onPress={() => {}}
        >
          <Text style={styles.iconText}>🔍</Text>
          <Text style={styles.filterText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={[styles.scrollView, { backgroundColor: colors.background }]}>
        <View style={[styles.periodSelector, { backgroundColor: colors.surface }]}>
          <TouchableOpacity style={[styles.periodOption, styles.activePeriod]}>
            <Text style={styles.activePeriodText}>Week</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.periodOption}>
            <Text style={[styles.periodText, { color: colors.textSecondary }]}>Month</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.periodOption}>
            <Text style={[styles.periodText, { color: colors.textSecondary }]}>Year</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Heart Rate</Text>
            <View style={styles.chartInfo}>
              <Text style={[styles.chartAverage, { color: colors.textSecondary }]}>Avg: 70 bpm</Text>
              <Text style={styles.iconText}>ℹ️</Text>
            </View>
          </View>
          <LineChart
            data={heartRateData}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={[styles.chartCard, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>Steps</Text>
            <View style={styles.chartInfo}>
              <Text style={[styles.chartAverage, { color: colors.textSecondary }]}>Avg: 7,651 steps</Text>
              <Text style={styles.iconText}>ℹ️</Text>
            </View>
          </View>
          <BarChart
            data={stepData}
            width={screenWidth - 40}
            height={220}
            yAxisSuffix=""
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            style={styles.chart}
          />
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.surface, shadowColor: isDarkMode ? 'transparent' : '#000' }]}>
          <Text style={[styles.summaryTitle, { color: colors.text }]}>Weekly Summary</Text>
          <View style={styles.summaryItems}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryIcon, { color: "#FF5252" }]}>❤️</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>70 bpm</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Heart Rate</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryIcon, { color: "#4A90E2" }]}>👣</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>7,651</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Avg Steps</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryIcon, { color: "#FF9800" }]}>🔥</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>2,450</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total Calories</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  filterText: {
    color: '#4A90E2',
    marginLeft: 4,
    fontWeight: '500',
  },
  iconText: {
    fontSize: 18,
    marginRight: 4,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 16,
    padding: 4,
  },
  periodOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
  },
  activePeriod: {
    backgroundColor: '#4A90E2',
  },
  periodText: {
    fontWeight: '500',
  },
  activePeriodText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  chartCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartAverage: {
    fontSize: 14,
    marginRight: 8,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryItems: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    width: '30%',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default StatsScreen; 