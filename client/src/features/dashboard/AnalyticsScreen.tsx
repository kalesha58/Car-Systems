import React, { useCallback, useEffect, useState, useMemo } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Dimensions,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { useTheme } from '@hooks/useTheme';
import CustomHeader from '@components/ui/CustomHeader';
import CustomText from '@components/ui/CustomText';
import { Fonts } from '@utils/Constants';
import { RFValue } from 'react-native-responsive-fontsize';
import {
    BarChart,
    PieChart,
    LineChart
} from "react-native-chart-kit";
import {
    getDealerProducts,
    getDealerVehicles,
    getDealerServices,
    getDealerOrders,
} from '@service/dealerService';
import { useFocusEffect } from '@react-navigation/native';
import { formatCurrency } from '@utils/analytics';

const screenWidth = Dimensions.get('window').width;

const AnalyticsScreen = () => {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [vehicles, setVehicles] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);

    const fetchAnalyticsData = useCallback(async () => {
        try {
            setLoading(true);
            const [productsData, vehiclesData, servicesData, ordersData] =
                await Promise.all([
                    getDealerProducts({ limit: 1000 }),
                    getDealerVehicles({ limit: 1000 }),
                    getDealerServices({ limit: 1000 }),
                    getDealerOrders({ limit: 1000 }),
                ]);

            setProducts(productsData.Response?.products || []);
            setVehicles(vehiclesData.Response?.vehicles || []);
            setServices(servicesData.Response?.services || []);
            setOrders(ordersData || []);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchAnalyticsData();
        }, [fetchAnalyticsData]),
    );

    // --- Process Data for Charts ---

    // 1. Product Sales (Bar Chart) - Top 5 Products by Price
    const productBarData = useMemo(() => {
        const sorted = [...products].sort((a, b) => b.price - a.price).slice(0, 5);
        return {
            labels: sorted.map(p => p.name.length > 8 ? p.name.substring(0, 6) + '..' : p.name),
            datasets: [
                {
                    data: sorted.map(p => p.price)
                }
            ]
        };
    }, [products]);

    // 2. Vehicle Availability (Pie Chart)
    const vehiclePieData = useMemo(() => {
        const statusCounts: Record<string, number> = {};
        vehicles.forEach(v => {
            const status = v.availability || 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        const statusColors: Record<string, string> = {
            available: '#10b981',
            sold: '#ef4444',
            reserved: '#f59e0b',
        };

        return Object.keys(statusCounts).map(status => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            population: statusCounts[status],
            color: statusColors[status] || '#888',
            legendFontColor: colors.textSecondary,
            legendFontSize: 12
        }));
    }, [vehicles, colors.textSecondary]);

    // 3. Orders Trend (Line Chart)
    const orderLineData = useMemo(() => {
        if (!orders.length) {
            return {
                labels: ["No Data"],
                datasets: [{ data: [0] }]
            };
        }

        // Group by day (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const dataPoints = last7Days.map(date => {
            return orders.filter(o => o.createdAt?.startsWith(date)).length;
        });

        return {
            labels: last7Days.map(d => d.substring(5)), // MM-DD
            datasets: [
                {
                    data: dataPoints,
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // optional
                    strokeWidth: 2 // optional
                }
            ],
            legend: ["Daily Orders"] // optional
        };
    }, [orders]);


    // Helper to convert hex to rgba for chart opacity
    const hexToRgba = (hex: string, opacity: number) => {
        let r = 0, g = 0, b = 0;
        if (!hex) return `rgba(0, 0, 0, ${opacity})`;

        if (hex.startsWith('#')) {
            hex = hex.substring(1);
        }

        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const chartConfig = {
        backgroundGradientFrom: colors.cardBackground,
        backgroundGradientTo: colors.cardBackground,
        color: (opacity = 1) => hexToRgba(colors.secondary || '#000000', opacity),
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
        decimalPlaces: 0,
        labelColor: (opacity = 1) => colors.textSecondary,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: colors.secondary
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <CustomHeader title="Analytics" />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.secondary} />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <CustomHeader title="Analytics" />
            <ScrollView contentContainerStyle={styles.content}>

                {/* Products Section */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.cardTitle}>
                        Top Products by Price
                    </CustomText>
                    <View style={{ overflow: 'hidden' }}>
                        {productBarData.datasets[0].data.length > 0 ? (
                            <BarChart
                                data={productBarData}
                                width={screenWidth - 60}
                                height={240}
                                yAxisLabel="₹"
                                yAxisSuffix=""
                                chartConfig={chartConfig}
                                verticalLabelRotation={30}
                                showValuesOnTopOfBars
                                fromZero
                                flatColor={true}
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}><CustomText>No product data available</CustomText></View>
                        )}
                    </View>
                </View>

                {/* Vehicles Section */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.cardTitle}>
                        Vehicle Inventory Status
                    </CustomText>
                    <View style={{ alignItems: 'center' }}>
                        {vehiclePieData.length > 0 ? (
                            <PieChart
                                data={vehiclePieData}
                                width={screenWidth - 32}
                                height={220}
                                chartConfig={chartConfig}
                                accessor={"population"}
                                backgroundColor={"transparent"}
                                paddingLeft={"15"}
                                absolute
                            />
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}><CustomText>No vehicle data available</CustomText></View>
                        )}
                    </View>
                </View>


                {/* Orders Trend */}
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <CustomText variant="h6" fontFamily={Fonts.SemiBold} style={styles.cardTitle}>
                        Last 7 Days Orders
                    </CustomText>
                    <View style={{ overflow: 'hidden' }}>
                        <LineChart
                            data={orderLineData}
                            width={screenWidth - 50}
                            height={220}
                            chartConfig={chartConfig}
                            bezier
                            style={{
                                marginVertical: 8,
                                borderRadius: 16
                            }}
                            fromZero
                        />
                    </View>
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        padding: 16,
        gap: 16,
    },
    card: {
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        alignItems: 'center',
        overflow: 'hidden'
    },
    cardTitle: {
        marginBottom: 8,
        alignSelf: 'flex-start'
    },
});

export default AnalyticsScreen;
