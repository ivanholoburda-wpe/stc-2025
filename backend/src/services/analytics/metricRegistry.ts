export interface MetricDefinition {
    id: string;
    label: string;
    category: string;
    unit?: string;
    description: string;
}

export const METRIC_REGISTRY: MetricDefinition[] = [
    {
        id: 'cpu_usage.system_percent',
        label: 'System CPU Usage',
        category: 'System Health',
        unit: '%',
        description: 'Общая загрузка CPU системы в процентах.'
    },
    {
        id: 'storage.free_mb',
        label: 'Free Storage',
        category: 'System Health',
        unit: 'MB',
        description: 'Свободное место на диске в мегабайтах.'
    },

    {
        id: 'interfaces.status',
        label: 'Interface Status (Up/Down)',
        category: 'Interfaces',
        unit: '',
        description: 'Показывает состояние интерфейса во времени (1 = Up, 0 = Down). Требует выбора интерфейса.'
    },
    {
        id: 'transceiver.rx_power',
        label: 'Transceiver Rx Power',
        category: 'Interfaces',
        unit: 'dBm',
        description: 'Мощность принимаемого оптического сигнала. Требует выбора интерфейса.'
    },
    {
        id: 'transceiver.tx_power',
        label: 'Transceiver Tx Power',
        category: 'Interfaces',
        unit: 'dBm',
        description: 'Мощность передаваемого оптического сигнала. Требует выбора интерфейса.'
    },

    {
        id: 'alarms.critical_count',
        label: 'Critical Alarms Count',
        category: 'Alarms',
        unit: 'Alarms',
        description: 'Количество активных тревог уровня Critical.'
    },

    {
        id: 'arp.total_count',
        label: 'Total ARP Entries',
        category: 'L2/L3 State',
        unit: 'Entries',
        description: 'Общее количество записей в ARP-таблице.'
    },

    {
        id: 'bfd.up_sessions_count',
        label: 'Up BFD Sessions',
        category: 'Protocols',
        unit: 'Sessions',
        description: 'Количество активных BFD-сессий в состоянии Up.'
    },
    {
        id: 'bgp.established_peers_ipv4',
        label: 'Established BGP Peers (IPv4)',
        category: 'Protocols',
        unit: 'Peers',
        description: 'Количество BGP-соседей IPv4 Unicast в состоянии Established.'
    },
];