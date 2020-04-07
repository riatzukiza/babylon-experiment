import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import {EntityGroup,Entity,Component,ComponentSystem} from "./ecs";
const geom = require("pex-geom")
console.log(geom);
const Octree = geom.Octree

class GravitationComponent extends Component {
    public imposter: BABYLON.PhysicsImpostor;
    public mesh: BABYLON.Mesh;
    constructor(
        entity:Entity,
        system:GravitationSystem,
        imposter:BABYLON.PhysicsImpostor,
        mesh:BABYLON.Mesh
    ) {
        super(entity,system)
        this.imposter = imposter
        this.mesh = mesh;
        // let item = <SceneItemComponent>Systems.sceneItems.get(entity);
        // system.octree.addMesh(item.node);
    }
}

class GravitationSystem extends ComponentSystem {
    public components: Map<Entity,GravitationComponent>
    Component = GravitationComponent;
    private origin = BABYLON.Vector3.Zero();
    update() {

        let octree = new BABYLON.Octree(() => {})
        let groupings = []
        let groupedComponents = new Set();
        let i = 0
        for(let [entityA,c] of this.components) {
            let A = c.imposter
            let pA = A.getObjectCenter();
            octree.addMesh(pA,c)
        }
        for(let [e,c] of this.components) {

            if(groupedComponents.has(c)) continue;

            let A = c.imposter
            let pA = A.getObjectCenter();
            let grouping = octree.intersects(pA,30,{includeData:true})

            for(let i = 0;i < 8;i++) {
                let c = grouping.data[i]
                groupedComponents.add(c)
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
                    A.applyForce(
                        forceVector.scale(force),
                        pA.add(this.origin)
                    )
                }
            }
            let sumx = 0;
            for(let i =0; i < m.length;i++) {
                sumx += m[i] * r[i].x
            }

            let sumy = 0;
            for(let i =0; i < m.length;i++) {
                sumy += m[i] * r[i].y
            }

            let sumz = 0;
            for(let i =0; i < m.length;i++) {
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
                    A.applyForce(
                        forceVector.scale(force),
                        pA.add(this.origin)
                    )
                }


            }

        }

    }
    // update() {
    //     for(let [entityA,{imposter:A}] of this.components) {
    //         for(let [entityB,{imposter:B}] of this.components) {
    //             if(A === B) continue;

    //             let pA = A.getObjectCenter();
    //             let pB = B.getObjectCenter();
                
    //             let massA = A.mass;
    //             let massB = B.mass;

    //             let d_2 = BABYLON.Vector3.DistanceSquared(pA,pB);

    //             let force = (massA * massB) / d_2;

    //             // let forceVector = new BABYLON.Vector3(

    //             //     pB.x - pA.x,
    //             //     pB.y - pA.y,
    //             //     pB.z - pA.z
    //             // ) ;
    //             let forceVector = pB.subtract(pA);
    //             A.applyForce(
    //                 forceVector.scale(force),
    //                 pA.add(this.origin)
    //             )
    //         }
    //     }
    // }
}
class SceneItemComponent extends Component {
    public node: BABYLON.Node;
    constructor(entity:Entity,system:SceneItemSystem,node:BABYLON.Node) {
        super(entity,system);
        this.node = node;
    }
}
class SceneItemSystem extends ComponentSystem {
    public components: Map<Entity,SceneItemComponent>
    Component = GravitationComponent;
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

        let sphere = BABYLON.Mesh.CreateSphere(`sphere-${particle.uuid}`,4*size,size,scene);
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
        this.group.set(particle,imposter,sphere);
    }

}
