import { final } from "../../../API/Common/FinalDecoration";
import { LiteralUnion } from "../../../API/Common/LiteralUnion";

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
    private static currentFirewallBase: FirewallBase|undefined;
    private static firewalls: Map<string, FirewallBase> = new Map();

    public static GetFirewall() : FirewallBase|undefined
    {
        return this.currentFirewallBase;
    }

    public static RegisterFirewall(_firewall : FirewallBase) : void
    {
        this.firewalls.set(_firewall.GetType(),_firewall);
    }

    public static SetFirewall(_firewall : FirewallBase|string|undefined) : void
    {
        if (_firewall == undefined)
        {
            this.currentFirewallBase = undefined;
            return;
        }

        if (_firewall instanceof FirewallBase)
        {
            if (!this.firewalls.has(_firewall.GetType()))
            {
                this.RegisterFirewall(_firewall);
            }
            this.currentFirewallBase = _firewall;
        }
        else
        {
            if (this.firewalls.has(_firewall))
            {
                this.currentFirewallBase = this.firewalls.get(_firewall);
            }
        }
    }

    public static GetFirewalls() : Map<string, FirewallBase>
    {
        return this.firewalls;
    }

    public static async Call(_eventName : FirewallEvents, ..._args: any) : Promise<void>
    {
        if (this.currentFirewallBase == undefined)
            return;

        await this.currentFirewallBase.Call(_eventName, ..._args);
    }
}
