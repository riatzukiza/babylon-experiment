// import * as GUI from 'babylonjs-gui';
import * as BABYLON from '@babylonjs/core/Legacy/legacy';
import * as MATERIAL from '@babylonjs/materials';
import { v4 as uuidv4 } from 'uuid';
import {Systems, ParticleBall } from "./systems";
import {Octree} from "pex-geom"

class Water { }
class Iron { }
class Copper { }
class Nitrogen { }

class Soil { }
class Rock { }
class Wind { }
class Plant { }


export class Game {

    private _canvas: HTMLCanvasElement;
    private _engine: BABYLON.Engine;
    private _scene: BABYLON.Scene;
    private _camera: BABYLON.ArcRotateCamera;
    private _light: BABYLON.Light;


    constructor(canvasElement: string) {
        // Create canvas and engine
        this._canvas = <HTMLCanvasElement>document.getElementById(canvasElement);
        this._engine = new BABYLON.Engine(this._canvas, true);
    }

    /**
     * Creates the BABYLONJS Scene
     */
    createScene(): BABYLON.Scene {
        var scene = new BABYLON.Scene(this._engine);
        // Camera
        var camera = this._camera = new BABYLON.ArcRotateCamera("Camera", 3 * Math.PI / 2, Math.PI / 4, 100, BABYLON.Vector3.Zero(), scene);
        camera.attachControl(this._canvas, true);
        // Light
        var light = this._light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 0.1, 0), scene);

        scene.enablePhysics(new BABYLON.Vector3(0, 0, 0));

        let size = (Math.random()) * 5;
        for(let i = 0;i < 500;i++) {
            ParticleBall.spawn(
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 20,
                size,size,
                //(Math.random() - 0.5) * 0.9,
                scene
            )

            // ParticleBall.spawn(
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     100,
            //     100,
            //     // (Math.random()) * 2,
            //     // (Math.random()) * 2000,
            //     //(Math.random() - 0.5) * 0.9,
            //     scene
            // )

            // ParticleBall.spawn(
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     100,
            //     100,
            //     // (Math.random()) * 2,
            //     // (Math.random()) * 2000,
            //     //(Math.random() - 0.5) * 0.9,
            //     scene
            // )

            // ParticleBall.spawn(
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     (Math.random() - 0.5) * 500,
            //     10,
            //     10,
            //     // (Math.random()) * 2,
            //     // (Math.random()) * 2000,
            //     //(Math.random() - 0.5) * 0.9,
            //     scene
            // )

        }

        return scene;

    }


    /**
     * Starts the animation loop.
     */
    animate(): void {
        this._scene = this.createScene();;
        let sceneToRender = this._scene

        this._engine.runRenderLoop(() => {
            if (sceneToRender) {
                sceneToRender.render();
                Systems.gravity.update(sceneToRender);
                console.log("fps",this._engine.getFps())
            }
        });

        // Resize
        window.addEventListener("resize", () => {
            this._engine.resize();
        });

    }



}
