// libs/common/src/exceptions/database-exceptions.ts
export class DuplicateKeyException extends Error {
    readonly field: string;
    readonly value: string;
    readonly code: string = 'DUPLICATE_KEY_ERROR';

    constructor(field: string, value: string) {
        super(`Giá trị "${value}" của trường "${field}" đã tồn tại trong hệ thống.`);
        this.name = 'DuplicateKeyException';
        this.field = field;
        this.value = value;
    }
}