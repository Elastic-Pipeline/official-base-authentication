import { Application, Request, Response } from "express";
import { final } from "../../../API/Common/FinalDecoration";
import { LiteralUnion } from "../../../API/Common/LiteralUnion";
import { RouteManager } from "../../../API/Routing/RouteManager";
import { Route } from "../../../API/Routing/Routing";
import { UserBaseManager } from "./UserBase";

export type FirewallFunc = (..._args: any[]) => Promise<void>;

export type FirewallEvents = LiteralUnion<'enter'|'error'>;

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

    protected On(_eventName: FirewallEvents, _func: FirewallFunc) : void
    {
        this.emitter.set(_eventName, _func);
    }

    public async Call(_eventName: FirewallEvents, ..._args: any[]) : Promise<void>
    {
        const func = this.emitter.get(_eventName);
        if (func == undefined)
            return;
        await func(..._args);
    }
}

@final
export class FirewallManager
{
    private static currentFirewallBase: FirewallBase = new FirewallBase();
    private static firewalls: FirewallBase[] = [];

    public static GetFirewall() : FirewallBase
    {
        return this.currentFirewallBase;
    }

    public static RegisterFirewall(_firewall : FirewallBase) : void
    {
        this.firewalls.push(_firewall);
    }

    public static SetFirewall(_firewall : FirewallBase) : void
    {
        if (!this.firewalls.includes(_firewall))
        {
            this.RegisterFirewall(_firewall);
        }
        this.currentFirewallBase = _firewall;
    }

    public static GetFirewalls() : FirewallBase[]
    {
        return this.firewalls;
    }

    public static Call(_eventName : FirewallEvents, ..._args: any) : void
    {
        this.currentFirewallBase.Call(_eventName, ..._args);
    }
}
