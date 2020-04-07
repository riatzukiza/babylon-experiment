import { v4 as uuidv4 } from 'uuid';

export class Entity {
    private static _entities = new Map<string,Entity>();
    static create() {
        let entity = new Entity();
        this._entities.set(entity.uuid,entity);
        return entity;
    }
    static find(uuid:string){
        return this._entities.get(uuid);
    }
    static destroy(uuid) {
    }

    public uuid : string;
    constructor() {
        this.uuid = uuidv4();
    }
}

export class Component {
    public entity:Entity;
    public system: ComponentSystem;
    constructor(
        entity:Entity,
        system:ComponentSystem,
        config
    ) {
        this.entity = entity;
        this.system = system;
    }
}

export class ComponentSystem {
    public components: Map<Entity,Component>
    Component = Component
    constructor() {
        this.components = new Map();
    }
    register(entity:Entity,config) {
        if(this.components.has(entity)) throw new Error("System already has this entity");
        this.components.set(entity,new this.Component(entity,this,config))
    }
    get(entity:Entity) {
        return this.components.get(entity);
    }
    update(scene) {
        throw new Error("Update not implemented on component system subtype");
    }
}

export class EntityGroup {
    private _members: Set<Entity>;
    private _systems: ComponentSystem[];
    constructor(...systems:ComponentSystem[]) {
        this._members = new Set();
        this._systems = systems;
    }
    set(entity:Entity,config) {
        if(this._members.has(entity)) throw new Error("Entity already in group");

        this._members.add(entity);

        for(let s of this._systems) {
            s.register(entity,config);
        }
    }
    spawn(config) {
        this.set(Entity.create(),config);
    }
    get(entity:Entity) {
        if(this._members.has(entity)) {
            return this._systems.map(s => s.get(entity))
        }
    }
}
