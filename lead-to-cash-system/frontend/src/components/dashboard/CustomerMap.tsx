'use client';

import React, { useEffect, useState } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

interface CityData {
    name: string;
    value: number;
    wonDealCount?: number;
    hasWonDeal?: boolean; // Backwards compatibility if needed
}

export function CustomerMap() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<CityData[]>([]);
    const [mapLoaded, setMapLoaded] = useState(false);
    const [geoCoordMap, setGeoCoordMap] = useState<Record<string, number[]>>({});
    const [totalWonDeals, setTotalWonDeals] = useState(0);

    useEffect(() => {
        const initMap = async () => {
            try {
                // 1. Fetch Map Data
                const mapRes = await fetch('/maps/china.json');
                const mapJson = await mapRes.json();
                echarts.registerMap('china', mapJson);
                setMapLoaded(true);

                // Extract coordinates from GeoJSON
                const coords: Record<string, number[]> = {};
                mapJson.features.forEach((feature: any) => {
                    if (feature.properties && feature.properties.cp) {
                        coords[feature.properties.name] = feature.properties.cp;
                        if (feature.properties.name.endsWith('市')) {
                            coords[feature.properties.name.replace('市', '')] = feature.properties.cp;
                        }
                    } else if (feature.properties.center) {
                        coords[feature.properties.name] = feature.properties.center;
                    }
                });

                // Add major cities coordinates (that are not provinces)
                const CITY_COORDS: Record<string, number[]> = {
                    '深圳': [114.0579, 22.5431],
                    '深圳市': [114.0579, 22.5431],
                    '广州': [113.2644, 23.1291],
                    '广州市': [113.2644, 23.1291],
                    '成都': [104.0668, 30.5728],
                    '成都市': [104.0668, 30.5728],
                    '杭州': [120.1551, 30.2741],
                    '杭州市': [120.1551, 30.2741],
                    '武汉': [114.3054, 30.5931],
                    '武汉市': [114.3054, 30.5931],
                    '西安': [108.9398, 34.3416],
                    '西安市': [108.9398, 34.3416],
                    '南京': [118.7969, 32.0603],
                    '南京市': [118.7969, 32.0603],
                    '苏州': [120.5853, 31.2989],
                    '苏州市': [120.5853, 31.2989],
                };

                setGeoCoordMap({ ...coords, ...CITY_COORDS });

                // 2. Fetch Customer Data
                const customerRes = await api.get('/customers/stats/distribution');
                setData(customerRes);

                // Calculate Total Won (Contracts)
                const total = customerRes.reduce((acc: number, curr: CityData) => {
                    return acc + (curr.wonDealCount || 0);
                }, 0);
                setTotalWonDeals(total);

            } catch (error) {
                console.error("Failed to load map or data", error);
            } finally {
                setLoading(false);
            }
        };

        initMap();
    }, []);

    const getWonDealData = () => {
        const res = [];
        for (const item of data) {
            if (item.wonDealCount && item.wonDealCount > 0) {
                const geoCoord = geoCoordMap[item.name] || geoCoordMap[item.name + '市'];
                if (geoCoord) {
                    res.push({
                        name: item.name,
                        value: geoCoord.concat(item.wonDealCount) // [lng, lat, wonCount]
                    });
                }
            }
        }
        return res;
    };

    const getOption = () => {
        return {
            tooltip: {
                trigger: 'item',
                formatter: (params: any) => {
                    if (params.seriesType === 'scatter') {
                        return `${params.name}: ${params.value?.[2]} Count`;
                    }
                    // Map Series: Use wonDealCount if available, else 0
                    const item = data.find(d => d.name === params.name || d.name + '市' === params.name);
                    const count = item?.wonDealCount || 0;
                    return `${params.name}: ${count} Won Opportunities`;
                }
            },
            visualMap: {
                min: 0,
                max: Math.max(...data.map(d => d.wonDealCount || 0), 5), // Scale by Won Deals
                left: '20',
                top: 'bottom',
                text: ['High', 'Low'],
                calculable: true,
                seriesIndex: [0],
                inRange: {
                    color: ['#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
                }
            },
            geo: {
                map: 'china',
                roam: true,
                layoutCenter: ['50%', '50%'],
                layoutSize: '100%',
                label: {
                    show: true,
                    color: '#666',
                    fontSize: 10
                },
                itemStyle: {
                    normal: {
                        areaColor: '#f3f4f6',
                        borderColor: '#9ca3af'
                    },
                    emphasis: {
                        areaColor: '#d1d5db'
                    }
                }
            },
            series: [
                {
                    name: 'Opportunity Distribution',
                    type: 'map',
                    geoIndex: 0,
                    data: data.map(item => ({
                        name: item.name.endsWith('市') || item.name.endsWith('省') || item.name.length < 2 ? item.name : item.name + '市',
                        value: item.wonDealCount || 0 // Map now visualizes Won Deal Count
                    }))
                },
                {
                    name: 'Won Deals',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: getWonDealData(),
                    symbol: 'path://M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
                    symbolSize: 24,
                    itemStyle: {
                        color: '#ff0000',
                        shadowBlur: 5,
                        shadowColor: '#333'
                    },
                    label: {
                        show: false
                    },
                    zlevel: 1
                }
            ]
        };
    };

    if (loading || !mapLoaded) {
        return (
            <Card className="col-span-1 min-h-[800px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </Card>
        );
    }

    return (
        <Card className="col-span-1 min-h-[800px]">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>客户分布 (Customer Distribution)</span>
                    <span className="text-sm font-normal text-slate-500">
                        Total Won Deals: <span className="text-red-600 font-bold">{totalWonDeals}</span>
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="h-[750px]">
                <div className="flex h-full gap-4">
                    <div className="flex-1 h-full">
                        <ReactECharts
                            option={getOption()}
                            style={{ height: '100%', width: '100%' }}
                            opts={{ renderer: 'canvas' }}
                        />
                    </div>
                    <div className="w-64 border-l pl-4 flex flex-col">
                        <h3 className="font-semibold mb-4 text-sm text-slate-700">区域汇总 (Regional Summary)</h3>
                        <div className="space-y-2 overflow-y-auto flex-1 pr-2">
                            {data
                                .filter(d => (d.wonDealCount || 0) > 0)
                                .sort((a, b) => (b.wonDealCount || 0) - (a.wonDealCount || 0))
                                .map((city, idx) => (
                                    <div key={city.name} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs ${idx < 3 ? 'bg-red-100 text-red-600 font-bold' : 'bg-slate-200 text-slate-600'}`}>
                                                {idx + 1}
                                            </span>
                                            <span>{city.name}</span>
                                        </div>
                                        <span className="font-medium">{city.wonDealCount}</span>
                                    </div>
                                ))}
                            {data.filter(d => (d.wonDealCount || 0) > 0).length === 0 && (
                                <div className="text-slate-400 text-sm text-center py-4">暂无数据</div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
