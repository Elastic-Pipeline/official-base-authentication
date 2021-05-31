import { Application, Request, Response } from "express";
import { LiteralUnion } from "../../../API/Common/LiteralUnion";
import { RouteManager } from "../../../API/Routing/RouteManager";
import { Route } from "../../../API/Routing/Routing";
import { UserBaseManager } from "./UserBase";

export type FirewallFunc = (..._args: any[]) => Promise<void>;

export class FirewallBase
{
    private type : string;
    private emitter : Map<string, FirewallFunc> = new Map();

    constructor()
    {
        this.type = this.constructor.name;
    }

    public GetType() : string
    {
        return this.type;
    }

    protected on(_eventName: LiteralUnion<'enter'>, _func: FirewallFunc) : void
    {
        this.emitter.set(_eventName, _func);
    }

    public async call(_eventName: string, ..._args: any[]) : Promise<void>
    {
        const func = this.emitter.get(_eventName);
        if (func == undefined)
            return;
        await func(..._args);
    }
}

export abstract class FirewallManager
{
    private static currentFirewallBase: FirewallBase = new FirewallBase();

    public static GetFirewall() : FirewallBase
    {
        return this.currentFirewallBase;
    }

    public static SetFirewall(_firewall : FirewallBase) : void
    {
        this.currentFirewallBase = _firewall;
    }

    public static Call(_eventName : string, ..._args: any) : void
    {
        this.currentFirewallBase.call(_eventName, ..._args);
    }
}

export class BasicFirewall extends FirewallBase
{
    constructor()
    {
        super();
        this.on('enter', async (_app : Application, req : Request, res : Response) => {
            const url = Route.SanitizeURL(req.url);
            
            const whitelistedURLs = [RouteManager.GetRouteLabel('license'), RouteManager.GetRouteLabel('register')];
            const loginURL = RouteManager.GetRouteLabel('login');

            const usr = await UserBaseManager.GetUser(req);
            
            var loggedOut = false;
            if (usr == undefined)
            {
                loggedOut = true;
                UserBaseManager.Logout(req, res);
            }
            else
            {
                _app.locals.user = usr;
            }

            if (loggedOut && (url != loginURL && !url.startsWith('/static') && !url.endsWith("favicon.ico") && !whitelistedURLs.includes(url)))
            {
                return res.redirect(loginURL);
            }
        });
    }
}