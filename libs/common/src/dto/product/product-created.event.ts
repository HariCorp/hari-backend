import { Types } from "mongoose";

export class ProductCreatedEvent extends Event {
    constructor(
        public readonly _id: Types.ObjectId,
        public readonly productId: string,
        public readonly name: string,
        public readonly description?: string,
        metadata?: any
    ) {
        super(metadata);
    }
}