import React from 'react';
import { OptionType } from '../../api/types';
import {
    BaseSettingFieldProps,
    ToggleField,
    TextField,
    TextAreaField,
    SecretField,
    NumberField,
    SelectField
} from './types';

const fieldComponentsMap: Record<OptionType, React.FC<BaseSettingFieldProps>> = {
    toggle: ToggleField,
    text: TextField,
    textarea: TextAreaField,
    secret: SecretField,
    number: NumberField,
    select: SelectField,
};

export const SettingField: React.FC<BaseSettingFieldProps & { type: OptionType }> = ({ type, ...props }) => {
    const FieldComponent = fieldComponentsMap[type] ?? TextField;
    return <FieldComponent {...props} />;
};

export type { BaseSettingFieldProps };