import { NextFunction, Request, Response } from "express";
import { ConfigurationBasePage } from "../../../official-configuration-page/classes/ConfigurationPage";

export module Configuration
{
    export class UserManagement extends ConfigurationBasePage
    {
        constructor()
        {
            super("Manage Users", "manage/users", false);
            this.SetDescription("Manage Users by adding, removing, and editing their personal information.");
        }

        public async RouteFunction(req: Request, res: Response, next: NextFunction)
        {
            return res.send("Okay!");
        }
    }
}