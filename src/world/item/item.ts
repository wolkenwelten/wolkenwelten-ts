import { Entity } from '../entity/entity';

export type MaybeItem = Item | undefined;

export class Item {
    name: string;
    carrier?: Entity;

    constructor(name: string) {
        this.name = name;
    }
}
