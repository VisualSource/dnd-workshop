import { Application, Container, CullerPlugin, extensions } from "pixi.js";

export class Engine {
    #mountCount = 0;
    #fakeDismount = false;
    canvas: HTMLCanvasElement | null = null;
    public app: Application | null = null;
    private controller: AbortController | null = null;

    constructor(){
        extensions.add(CullerPlugin);
    }

    public mount(canvas: HTMLCanvasElement){
        this.#mountCount++;
        if(this.#mountCount !== 1) return;

        if(import.meta.env.DEV && this.#fakeDismount) {
            this.#fakeDismount = false;
            return;
        }
        this.canvas = canvas;
        this.app = new Application();
        this.app.init({
            canvas,
                antialias: true
        }).then(()=>{
            if(this.controller?.signal.aborted){
                return;
            }

       

            const container = new Container();
            container.cullable = true;
            container.cullableChildren = true;
            this.app?.stage.addChild(container);
            

        });
    }
    public unmount(){
        this.#mountCount--;
        if(this.#mountCount !== 0) return;

        if(import.meta.env.DEV && this.canvas?.isConnected){
            this.#fakeDismount = true;
            return;
        }
        this.canvas = null;
        this.controller?.abort();
    }
}