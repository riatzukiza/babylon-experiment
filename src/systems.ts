import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import {EntityGroup,Entity,Component,ComponentSystem} from "./ecs";
const geom = require("pex-geom")
console.log(geom);
const Octree = geom.Octree

class GravitationComponent extends Component {
    public imposter: BABYLON.PhysicsImpostor;
    public mesh: BABYLON.Mesh;
    public scene: BABYLON.Scene;
    constructor(
        entity:Entity,
        system:ComponentSystem,
        config
    ) {
        super(entity,system,config)
        this.imposter = config.imposter
        this.mesh = config.mesh;
        this.scene = config.scene;
        // let item = <SceneItemComponent>Systems.sceneItems.get(entity);
        // system.octree.addMesh(item.node);
    }
}

class GravitationSystem extends ComponentSystem {
    public components: Map<Entity,GravitationComponent>
    Component = GravitationComponent;
    private origin = BABYLON.Vector3.Zero();
    update(scene) {

        let octree = scene.createOrUpdateSelectionOctree();
        let groupings = []
        let groupedComponents = new Set();
        for(let [e,c] of this.components) {

            if(groupedComponents.has(c)) continue;

            let A = c.imposter
            let pA = A.getObjectCenter();
            let intersection = octree.intersects(pA,100,false)
            let grouping = []

            for(let i = 0;i < 128;i++) {

                let g = intersection.data[i]
                if(!g) break;
                let e = Entity.find(g.name)
                let c = this.get(e);
                if(!groupedComponents.has(c)) {
                    grouping.push(c);
                    groupedComponents.add(c)
                }
            }
            groupings.push(grouping);
        }

        let massClusters = [];

        for(let group of groupings) {
            let M = 0;

            let m = [];
            let r = [];

            for(let A of group) {

                let pA = A.imposter.getObjectCenter();
                let massA = A.imposter.mass;

                M += massA
                m.push(massA);
                r.push(pA);

                for(let B of group) {
                    if(A === B) continue;

                    let pB = B.imposter.getObjectCenter();
                    let massB = B.imposter.mass;

                    let d_2 = BABYLON.Vector3.DistanceSquared(pA,pB);

                    let force = (massA * massB) / d_2;

                    // let forceVector = new BABYLON.Vector3(

                    //     pB.x - pA.x,
                    //     pB.y - pA.y,
                    //     pB.z - pA.z
                    // ) ;
                    let forceVector = pB.subtract(pA);
                    A.imposter.applyForce(
                        forceVector.scale(force),
                        pA.add(this.origin)
                    )
                }
            }
            let sumx = 0;
            let sumy = 0;
            let sumz = 0;

            for(let i =0; i < m.length;i++) {
                sumx += m[i] * r[i].x
                sumy += m[i] * r[i].y
                sumz += m[i] * r[i].z
            }

            let R = new BABYLON.Vector3(sumx,sumy,sumz);
            massClusters.push({center:R,mass:M,group});

        }
        for(let clusterA of massClusters) {
            let pA = clusterA.center
            let massA = clusterA.mass;
            for(let clusterB of massClusters) {
                if(clusterA === clusterB) continue;
                let pB = clusterB.center;
                let massB = clusterB.mass;

                let d_2 = BABYLON.Vector3.DistanceSquared(pA,pB);

                let force = (massA * massB) / d_2;

                // let forceVector = new BABYLON.Vector3(

                //     pB.x - pA.x,
                //     pB.y - pA.y,
                //     pB.z - pA.z
                // ) ;
                let forceVector = pB.subtract(pA);
                for(let A of clusterA.group) {
                    A.imposter.applyForce(
                        forceVector.scale(force),
                        pA.add(this.origin)
                    )
                }


            }

        }

    }
    _update(scene) {
        for(let [entityA,{imposter:A}] of this.components) {
            for(let [entityB,{imposter:B}] of this.components) {
                if(A === B) continue;

                let pA = A.getObjectCenter();
                let pB = B.getObjectCenter();
                
                let massA = A.mass;
                let massB = B.mass;

                let d_2 = BABYLON.Vector3.DistanceSquared(pA,pB);

                let force = (massA * massB) / d_2;

                // let forceVector = new BABYLON.Vector3(

                //     pB.x - pA.x,
                //     pB.y - pA.y,
                //     pB.z - pA.z
                // ) ;
                let forceVector = pB.subtract(pA);
                A.applyForce(
                    forceVector.scale(force* 10),
                    pA.add(this.origin)
                )
            }
        }
    }
}
class SceneItemComponent extends Component {
    public node: BABYLON.Node;
    public mesh: BABYLON.Mesh;
    constructor(entity:Entity,system:SceneItemSystem,config) {
        super(entity,system,config);
        this.node = config.node;
        this.mesh = config.mesh;
    }
}
class SceneItemSystem extends ComponentSystem {
    public components: Map<Entity,SceneItemComponent>
    Component = SceneItemComponent;
    update() {}
}

export class Systems {
    static gravity = new GravitationSystem()
    static sceneItems = new SceneItemSystem()
}


export class ParticleBall {
    static group = new EntityGroup(
        Systems.gravity,
        Systems.sceneItems
    )
    static spawn(
        x:number,
        y:number,
        z:number,
        size:number,
        mass:number,
        //restitution:number,
        scene:BABYLON.Scene
    ) {
        let particle = Entity.create();

        let sphere = BABYLON.Mesh.CreateSphere(particle.uuid,Math.round(size),size,scene);
        sphere.position.x = x;
        sphere.position.y = y;
        sphere.position.z = z;

        let imposter = new BABYLON.PhysicsImpostor(
            sphere,
            BABYLON.PhysicsImpostor.SphereImpostor,
            {
                mass,
                restitution:0.1
            },
            scene
        );
        this.group.set(particle,{imposter,mesh:sphere,scene});
    }

}
