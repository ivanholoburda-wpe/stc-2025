export interface BaseSettingFieldProps {
    optionKey: string;
    value: string;
    onChange: (key: string, value: string) => void;
    label: string;
    description?: string;
    options?: string[];
    optionDisplayNames?: Record<string, string>;
}