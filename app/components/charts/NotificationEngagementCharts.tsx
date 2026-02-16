"use client";

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid,
} from "recharts";
import { PushNotifications } from "../../types";
import InfoTooltip from "../InfoTooltip";

interface Props {
    data: PushNotifications;
}

export default function NotificationEngagementCharts({ data }: Props) {
    // Build a summary bar data for received vs interacted
    const engagementSummary = [
        { label: "Received", count: data.totalReceived },
        { label: "Interacted", count: data.totalInteracted },
        { label: "Drove Listening", count: data.notificationDrivenListening },
    ];

    return (
        <div className="flex flex-col gap-6">
            {/* Overview stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Notifications Received
                        <InfoTooltip text="Total push notifications received from Spotify." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalReceived}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Interacted With
                        <InfoTooltip text="Notifications you tapped or interacted with." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.totalInteracted}
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Engagement Rate
                        <InfoTooltip text="Percentage of received notifications that you interacted with." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.engagementRate}%
                    </p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-muted">
                        Drove Listening
                        <InfoTooltip text="Notifications followed by a listening session within 30 minutes. Shows how much Spotify's nudges influence your behavior." />
                    </p>
                    <p className="text-2xl font-bold text-accent">
                        {data.notificationDrivenListening}
                    </p>
                    <p className="text-[10px] text-muted">
                        {data.notificationDrivenPct}% of notifications
                    </p>
                </div>
            </div>

            {/* Engagement Funnel */}
            <div>
                <h4 className="text-xs text-muted mb-2">
                    Notification Funnel
                    <InfoTooltip text="From notifications received, to those you interacted with, to those that led to actual listening." />
                </h4>
                <ResponsiveContainer width="100%" height={150}>
                    <BarChart
                        data={engagementSummary}
                        layout="vertical"
                        margin={{ left: 10 }}
                    >
                        <XAxis type="number" fontSize={10} />
                        <YAxis
                            type="category"
                            dataKey="label"
                            width={120}
                            tick={{ fontSize: 11 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1e1e1e",
                                border: "1px solid #2a2a2a",
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                            formatter={(value) => [value, "Count"]}
                        />
                        <Bar
                            dataKey="count"
                            fill="#1db954"
                            radius={[0, 4, 4, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Notification Types */}
            {data.notificationTypes.length > 0 && (
                <div>
                    <h4 className="text-xs text-muted mb-2">
                        Notification Campaigns
                        <InfoTooltip text="Breakdown by campaign ID. Each campaign represents a different type of notification from Spotify." />
                    </h4>
                    <ResponsiveContainer
                        width="100%"
                        height={Math.max(
                            150,
                            data.notificationTypes.length * 28,
                        )}
                    >
                        <BarChart
                            data={data.notificationTypes}
                            layout="vertical"
                            margin={{ left: 10 }}
                        >
                            <XAxis type="number" fontSize={10} />
                            <YAxis
                                type="category"
                                dataKey="campaignId"
                                width={100}
                                tick={{ fontSize: 10 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1e1e1e",
                                    border: "1px solid #2a2a2a",
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                                formatter={(value) => [
                                    value,
                                    "Notifications",
                                ]}
                            />
                            <Bar
                                dataKey="count"
                                fill="#6c5ce7"
                                radius={[0, 4, 4, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
