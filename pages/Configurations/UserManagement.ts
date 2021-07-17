import { NextFunction, Request, Response } from "express";
import { ConfigurationBasePage } from "../../../official-configuaration-page/classes/ConfigurationPage";

export class ConfigurationUserManagement extends ConfigurationBasePage
{
    constructor()
    {
        super("Manage Users", "/configuration/manage-users", 'configuration/manage-users');
        this.SetDescription("Global Security is setup here.");
    }

    public async RouteFunction(req: Request, res: Response, next: NextFunction)
    {
        return res.send("Okay!");
    }
}
