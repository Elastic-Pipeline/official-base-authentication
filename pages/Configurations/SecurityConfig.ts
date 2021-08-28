import { NextFunction, Request, Response } from "express";
import { ConfigurationBasePage } from "../../../official-configuration-page/classes/ConfigurationPage";
import { FirewallManager } from "../../classes/FirewallBase";
import { UserBaseController, UserBaseManager } from "../../classes/UserBase";

export class ConfigurationSecurity extends ConfigurationBasePage
{
    constructor()
    {
        super("Security Configuration", "/configuration/security", 'configuration/security');
        this.SetDescription("Global Security is setup here.");
    }

    public async RouteFunction(req: Request, res: Response, next: NextFunction)
    {
        return res.json({ 'UserBaseControllers': UserBaseManager.GetUserBaseControllers(), 'Firewalls': FirewallManager.GetFirewalls() });
    }
}
