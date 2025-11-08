import {injectable, inject} from "inversify";
import {DataSource} from "typeorm";
import {TYPES} from "../types";
import {TimeSeriesDataPoint} from "../services/analytics/providers/IMetricProvider";

export interface GenericTimeSeriesOptions {
    tableName: string;
    fieldName: string;
}

export interface IAnalyticsRepository {
    getGenericTimeSeries(
        deviceId: number,
        options: GenericTimeSeriesOptions
    ): Promise<TimeSeriesDataPoint[]>;

    getCpuUsageTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getEstablishedBgpPeersTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getStorageFreeMbTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getCriticalAlarmsCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getTotalArpEntriesTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getUpBfdSessionsCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getTransceiverRxPowerTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]>;

    getTransceiverTxPowerTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]>;

    getInterfaceStatusTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]>;

    getTotalIpRoutesTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;

    getRoutesByProtocolTimeSeries(deviceId: number, protocol: string): Promise<TimeSeriesDataPoint[]>;

    getStaticArpCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]>;
}

@injectable()
export class AnalyticsRepository implements IAnalyticsRepository {
    constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
    }

    async getGenericTimeSeries(
        deviceId: number,
        options: GenericTimeSeriesOptions
    ): Promise<TimeSeriesDataPoint[]> {
        const { tableName, fieldName } = options;
        const alias = 't';

        const sql = `
            SELECT s.created_at as time, ${alias}.${fieldName} as value
            FROM ${tableName} ${alias}
            JOIN snapshots s ON ${alias}.snapshot_id = s.id
            ORDER BY s.created_at ASC
        `;

        return this.dataSource.query(sql);
    }

    getCpuUsageTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time, c.system_cpu_use_rate_percent as value
            FROM cpu_usage_summaries c
                JOIN snapshots s
            ON c.snapshot_id = s.id
            WHERE c.device_id = ?
            ORDER BY s.created_at ASC
        `, [deviceId]);
    }

    getEstablishedBgpPeersTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time, COUNT(p.id) as value
            FROM bgp_peers p
                JOIN snapshots s
            ON p.snapshot_id = s.id
            WHERE p.device_id = ?
              AND p.state = 'Established'
            GROUP BY s.id, s.created_at
            ORDER BY s.created_at ASC
        `, [deviceId]);
    }

    getStorageFreeMbTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                st.free_mb as value
            FROM storage_summaries st
                JOIN snapshots s
            ON st.snapshot_id = s.id
            WHERE st.device_id = ?
            ORDER BY s.created_at ASC
        `, [deviceId]);
    }

    getCriticalAlarmsCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(a.id) as value
            FROM alarms a
                JOIN snapshots s
            ON a.snapshot_id = s.id
            WHERE
                a.device_id = ?
              AND a.level = 'Critical'
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId]);
    }

    getTotalArpEntriesTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(a.id) as value
            FROM arp_records a
                JOIN snapshots s
            ON a.snapshot_id = s.id
            WHERE a.device_id = ?
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId]);
    }

    getUpBfdSessionsCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(b.id) as value
            FROM bfd_sessions b
                JOIN snapshots s
            ON b.snapshot_id = s.id
            WHERE
                b.device_id = ?
              AND b.state = 'Up'
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId]);
    }

    getTransceiverRxPowerTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                t.rx_power as value
            FROM transceivers t
                JOIN interfaces i
            ON t.interface_id = i.id
                JOIN snapshots s ON t.snapshot_id = s.id
            WHERE
                t.device_id = ?
              AND i.name = ? -- <-- ВИПРАВЛЕНО: фільтруємо за іменем, а не ID
              AND t.rx_power IS NOT NULL
            ORDER BY
                s.created_at ASC
        `, [deviceId, interfaceName]);
    }

    getTransceiverTxPowerTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                t.tx_power as value
            FROM transceivers t
                JOIN interfaces i
            ON t.interface_id = i.id
                JOIN snapshots s ON t.snapshot_id = s.id
            WHERE
                t.device_id = ?
              AND i.name = ?
              AND t.tx_power IS NOT NULL
            ORDER BY
                s.created_at ASC
        `, [deviceId, interfaceName]);
    }

    getInterfaceStatusTimeSeries(deviceId: number, interfaceName: string): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                CASE
                    WHEN LOWER(i.phy_status) LIKE 'up%' THEN 1
                    ELSE 0
            END
            as value
            FROM interfaces i
            JOIN snapshots s ON i.snapshot_id = s.id
            WHERE
                i.device_id = ?
                AND i.name = ?
            ORDER BY
                s.created_at ASC
        `, [deviceId, interfaceName]);
    }

    getStaticArpCountTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(a.id) as value
            FROM arp_records a
                JOIN snapshots s
            ON a.snapshot_id = s.id
            WHERE a.device_id = ? AND a.type = 'Static'
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId]);
    }

    getTotalIpRoutesTimeSeries(deviceId: number): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(r.id) as value
            FROM ip_routes r
                JOIN snapshots s
            ON r.snapshot_id = s.id
            WHERE r.device_id = ?
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId]);
    }

    getRoutesByProtocolTimeSeries(deviceId: number, protocol: string): Promise<TimeSeriesDataPoint[]> {
        return this.dataSource.query(`
            SELECT s.created_at as time,
                COUNT(r.id) as value
            FROM ip_routes r
                JOIN snapshots s
            ON r.snapshot_id = s.id
            WHERE r.device_id = ? AND r.protocol = ?
            GROUP BY
                s.id, s.created_at
            ORDER BY
                s.created_at ASC
        `, [deviceId, protocol]);
    }
}