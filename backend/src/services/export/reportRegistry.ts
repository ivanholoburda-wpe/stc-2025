import { ReportDefinition } from "./providers/IReportProvider";

export const REPORT_REGISTRY: ReportDefinition[] = [
    {
        id: 'per_device_details',
        label: "General report",
        description: "General report",
    },
    {
        id: 'hardware_inventory_report',
        label: 'Hardware Inventory',
        description: 'Generates a complete list of all hardware components (boards, power supplies, etc.) in the network.'
    },
    {
        id: 'transceiver_inventory_report',
        label: 'Transceiver Inventory',
        description: 'Generates a complete list of all optical transceivers in the network with their parameters.'
    },
    {
        id: 'software_license_report',
        label: 'Software & License Audit',
        description: 'Generates a report on software versions, patches, and licenses on all devices.'
    },
    {
        id: 'full_arp_report',
        label: 'Full ARP/MAC Table',
        description: 'Generates a consolidated report of all ARP entries in the network for tracking IP and MAC addresses.'
    },
    {
        id: 'network_health_report',
        label: 'Network Health Summary',
        description: 'Generates a summary report on key health metrics (CPU, disks, alarms, BGP) for all devices.'
    },
    {
        id: 'down_ports_report',
        label: 'Unused/Down Ports Report',
        description: 'Generates a report of all ports that are in a Down or Administratively Down state.'
    },
    {
        id: 'interface_details_report',
        label: 'Flat Interface & Neighbor Report',
        description: 'Generates a single large sheet with all interfaces and information about their LLDP neighbors.'
    },
    {
        id: 'per_device_interface_report',
        label: 'Interface Status (Per Device)',
        description: 'Generates an XLSX file with a separate sheet for each device, showing its interface status.'
    },
    {
        id: 'ip_route_per_device_report',
        label: 'IP Route Table (Per Device)',
        description: 'Generates an XLSX file with a separate sheet for each device, showing its routing table.'
    },
    {
        id: 'igp_details_report',
        label: 'IGP Details Report',
        description: 'Generates a detailed report on all IGP protocols (OSPF, IS-IS) in the network.'
    },
];