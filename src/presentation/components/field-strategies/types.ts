import { ReactElement } from 'react';
import { ITemplateField } from '@domain/models/checklist';

export interface FieldRenderProps {
    readonly field: ITemplateField;
    readonly value: string;
    readonly comment?: string;
    readonly onChangeValue: (val: string) => void;
    readonly onChangeComment: (comment: string) => void;
    readonly disabled?: boolean;
    readonly error?: string;
}

export interface IFieldStrategy {
    render(props: FieldRenderProps): ReactElement;
    validate(value: string, field: ITemplateField): string | null;
}