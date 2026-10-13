import { FieldType } from '@domain/models/checklist';
import { IFieldStrategy } from './types';
import {
    StringFieldStrategy,
    IntegerFieldStrategy,
    RadioFieldStrategy,
    ChoiceFieldStrategy,
    CheckboxFieldStrategy,
    DateFieldStrategy,
    AutoFieldStrategy
} from './strategies';

export class FieldRegistry {
    private static readonly strategies = new Map<FieldType, IFieldStrategy>();

    static {
        this.strategies.set('STRING', new StringFieldStrategy());
        this.strategies.set('INTEGER', new IntegerFieldStrategy());
        this.strategies.set('RADIO', new RadioFieldStrategy());
        this.strategies.set('CHOICE', new ChoiceFieldStrategy());
        this.strategies.set('CHECKBOX', new CheckboxFieldStrategy());
        this.strategies.set('DATE', new DateFieldStrategy());
        this.strategies.set('AUTO_DATE', new AutoFieldStrategy());
    }

    public static register(type: FieldType, strategy: IFieldStrategy): void {
        this.strategies.set(type, strategy);
    }

    public static get(type: FieldType): IFieldStrategy {
        return this.strategies.get(type) || this.strategies.get('STRING')!;
    }
}