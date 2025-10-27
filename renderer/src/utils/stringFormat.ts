export function formatLabelFromKey(str: string): string {
    return str.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

