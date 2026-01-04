
'use client';

import { ResponsiveContainer, Sankey, Tooltip } from 'recharts';

interface FundFlowProps {
    transaction: {
        id: string;
        allocations: { vendorName: string; amount: number }[];
        collections: { customerName: string; amount: number }[];
        payouts: { beneficiary: string; netAmount: number }[];
    };
}

export function FundFlowSankey({ transaction }: FundFlowProps) {
    // 1. Prepare Nodes with colors
    const nodes: { name: string; nodeColor?: string }[] = [];
    const links: { source: number; target: number; value: number; linkColor?: string }[] = [];

    const POOL_NAME = '公司资金池';

    // Helper to get or add node index with color
    const getNodeIndex = (name: string, color?: string) => {
        let index = nodes.findIndex(n => n.name === name);
        if (index === -1) {
            nodes.push({ name, nodeColor: color });
            index = nodes.length - 1;
        }
        return index;
    };

    // Ensure Pool exists (blue color for company)
    const poolIndex = getNodeIndex(POOL_NAME, '#3b82f6'); // Blue for company pool

    // 2. Collections (Customer -> Pool) - Green for upstream/revenue
    transaction.collections.forEach(c => {
        const sourceIdx = getNodeIndex(`【客户】${c.customerName}`, '#10b981'); // Green for customers
        links.push({
            source: sourceIdx,
            target: poolIndex,
            value: Number(c.amount),
            linkColor: '#86efac' // Light green for revenue flow
        });
    });

    // 3. Allocations (Pool -> Vendor) - Orange for capital allocation
    transaction.allocations.forEach(a => {
        const targetIdx = getNodeIndex(`【供应商】${a.vendorName}`, '#f97316'); // Orange for vendors
        links.push({
            source: poolIndex,
            target: targetIdx,
            value: Number(a.amount),
            linkColor: '#fdba74' // Light orange for allocation flow
        });
    });

    // 4. Payouts (Pool -> Beneficiary) - Red for expenses
    transaction.payouts.forEach(p => {
        const targetIdx = getNodeIndex(`【受益人】${p.beneficiary}`, '#ef4444'); // Red for beneficiaries
        links.push({
            source: poolIndex,
            target: targetIdx,
            value: Number(p.netAmount),
            linkColor: '#fca5a5' // Light red for payout flow
        });
    });

    // If no flows, show nothing or placeholder
    if (nodes.length <= 1) {
        return <div className="flex h-full items-center justify-center text-muted-foreground">暂无资金流向数据</div>;
    }

    // Custom node rendering with colors
    const renderNode = (props: any) => {
        const { x, y, width, height, index } = props;
        const node = nodes[index];
        const fillColor = node.nodeColor || '#77c878';

        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fillColor}
                    fillOpacity={0.8}
                    stroke={fillColor}
                    strokeWidth={2}
                />
            </g>
        );
    };

    return (
        <div style={{ width: '100%', height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={{ nodes, links }}
                    node={renderNode}
                    nodePadding={50}
                    margin={{
                        left: 20,
                        right: 20,
                        top: 20,
                        bottom: 20,
                    }}
                    link={(props: any) => {
                        const { sourceX, targetX, sourceY, targetY, sourceControlX, targetControlX, linkWidth, index } = props;
                        const link = links[index];
                        const linkColor = link?.linkColor || '#77c878';

                        return (
                            <path
                                d={`
                                    M${sourceX},${sourceY + linkWidth / 2}
                                    C${sourceControlX},${sourceY + linkWidth / 2}
                                    ${targetControlX},${targetY + linkWidth / 2}
                                    ${targetX},${targetY + linkWidth / 2}
                                `}
                                fill="none"
                                stroke={linkColor}
                                strokeWidth={linkWidth}
                                strokeOpacity={0.5}
                            />
                        );
                    }}
                >
                    <Tooltip
                        content={({ payload }: any) => {
                            if (payload && payload.length > 0) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-background border rounded p-2 shadow-lg">
                                        <p className="font-semibold">{data.name}</p>
                                        {data.value && <p className="text-sm">金额: ¥{Number(data.value).toLocaleString()}</p>}
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}
