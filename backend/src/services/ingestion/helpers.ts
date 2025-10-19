export function normalizeInterfaceName(shortName: string, moduleType: string): string | null {
    const numericPartMatch = shortName.match(/(\d+(\/\d+)*)/);
    if (!numericPartMatch) {
        return null;
    }

    const numericPart = numericPartMatch[0];

    let prefix: string | null = null;

    const lowerModuleType = moduleType.toLowerCase();

    if (lowerModuleType.includes('100g')) {
        prefix = '100GE';
    } else if (lowerModuleType.includes('40g')) {
        prefix = '40GE';
    } else if (lowerModuleType.includes('25g')) {
        prefix = '25GE';
    } else if (lowerModuleType.includes('10g')) {
        prefix = 'GigabitEthernet';
    } else if (lowerModuleType.includes('1g') || lowerModuleType.includes('esfp')) {
        prefix = 'GigabitEthernet';
    } else if (lowerModuleType.includes('fe') || lowerModuleType.includes('100m')) {
        prefix = 'FastEthernet';
    } else {
        return null;
    }

    return `${prefix}${numericPart}`;
}

export function normalizeInterfaceNameLLDP(shortName: string): string {
    const match = shortName.match(/^([a-zA-Z-]+)(\d+.*)$/);

    if (!match) {
        return shortName;
    }

    const prefix = match[1].toUpperCase();
    const numericPart = match[2];

    switch (prefix) {
        case 'GE':
            return `GigabitEthernet${numericPart}`;
        case 'XGE':
            return `XGigabitEthernet${numericPart}`;
        case 'FE':
            return `FastEthernet${numericPart}`;
        case 'ETH':
            return `Ethernet${numericPart}`;

        case 'GIGABITETHERNET':
        case 'XGIGABITETHERNET':
        case 'ETHERNET':
        case '25GE':
        case '40GE':
        case '100GE':
        case 'VLANIF':
        case 'LOOPBACK':
            return shortName;

        default:
            return shortName;
    }
}