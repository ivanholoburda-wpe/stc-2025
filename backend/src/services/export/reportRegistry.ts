import { ReportDefinition } from "./providers/IReportProvider";

export const REPORT_REGISTRY: ReportDefinition[] = [
    {
        id: 'hardware_inventory_report',
        label: 'Hardware Inventory',
        description: 'Створює повний список усіх апаратних компонентів (плати, блоки живлення і т.д.) у мережі.'
    },
    {
        id: 'transceiver_inventory_report',
        label: 'Transceiver Inventory',
        description: 'Створює повний список усіх оптичних трансиверів у мережі з їхніми параметрами.'
    },
    {
        id: 'software_license_report',
        label: 'Software & License Audit',
        description: 'Створює звіт по версіях ПЗ, патчах та ліцензіях на всіх пристроях.'
    },
    {
        id: 'full_arp_report',
        label: 'Full ARP/MAC Table',
        description: 'Створює зведений звіт по всіх ARP-записах у мережі для відстеження IP- та MAC-адрес.'
    },
    {
        id: 'network_health_report',
        label: 'Network Health Summary',
        description: 'Створює зведений звіт по ключових показниках "здоров\'я" (CPU, диски, аларми, BGP) для всіх пристроїв.'
    },
    {
        id: 'down_ports_report',
        label: 'Unused/Down Ports Report',
        description: 'Створює звіт по всіх портах, що знаходяться в стані Down або Administratively Down.'
    },
    {
        id: 'interface_details_report',
        label: 'Flat Interface & Neighbor Report',
        description: 'Створює один великий аркуш з усіма інтерфейсами та інформацією про їхніх LLDP-сусідів.'
    },
    {
        id: 'per_device_interface_report',
        label: 'Interface Status (Per Device)',
        description: 'Створює XLSX-файл з окремим аркушем для кожного пристрою, що показує стан його інтерфейсів.'
    },
    {
        id: 'ip_route_per_device_report',
        label: 'IP Route Table (Per Device)',
        description: 'Створює XLSX-файл з окремим аркушем для кожного пристрою, що показує його таблицю маршрутизації.'
    },
    {
        id: 'igp_details_report',
        label: 'IGP Details Report',
        description: 'Створює детальний звіт по всіх IGP-протоколах (OSPF, IS-IS) у мережі.'
    },
];

