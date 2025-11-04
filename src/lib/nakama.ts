import { Client, Session } from "@heroiclabs/nakama-js";

class Nakama {
    private client: Client;

    private _session: Session | null = null;


    constructor(){
        this.client = new Client();


        // load session
        this.restore();
    }

    get session(){
        if(!this._session) throw new Error("no session");
        return this._session;
    }

    async restore(){

        const token = localStorage.getItem("token");
        const refreshToken = localStorage.getItem("refresh-token");

        if(!token || !refreshToken) {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh-token");

            return;
        }

        const session = new Session(token,refreshToken,false);

        if(session.isexpired(Date.now() + 1)) {
          try {
            this._session = await this.client.sessionRefresh(session);
          } catch (error) {
            localStorage.removeItem("token");
            localStorage.removeItem("refresh-token");
            console.error(error);
          }
        } else {
            this._session = session;
        }

        localStorage.setItem("token",this._session!.token);
        localStorage.setItem("refresh-token",this._session!.refresh_token);
    }

    async login(email: string, psd: string){
        this._session = await this.client.authenticateEmail(email,psd)
    }

    async logout(){
        await this.client.sessionLogout(this.session,this.session.token,this.session.refresh_token);
    }

}