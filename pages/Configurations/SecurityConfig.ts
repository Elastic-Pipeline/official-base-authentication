import { NextFunction, Request, Response } from "express";
import { FormType } from "../../../../API/RenderBits/FormFactory";
import { ConfigurationBasePage, EditableConfiguration } from "../../../official-configuration-page/classes/ConfigurationPage";
import { DataStore } from "../../classes/DataStore";
import { FirewallManager } from "../../classes/FirewallBase";
import { UserBaseManager } from "../../classes/UserBase";


export module Configuration
{
    export class Security extends ConfigurationBasePage
    {
        constructor()
        {
            super("Security Configuration", 'manage', false);
            this.SetDescription("Global Security is setup here.");
            const datastores = Array.from(DataStore.GetAllInterfaces().keys());
            const userbases = Array.from(UserBaseManager.GetUserBaseControllers().keys());
            const firewalls = Array.from(FirewallManager.GetFirewalls().keys());
            this.AddConfiguration("Global", new EditableConfiguration("DataStore", "Enables the different various DataStores available for the software to handle databasing.", DataStore.GetDataStore()?.GetName() || "None", FormType.CHOICES_SELECT_DROPDOWN, datastores));
            this.AddConfiguration("Global", new EditableConfiguration("UserBase Controller", "Selects the different UserBase Controller that would be use for the software to handle the user-management.", UserBaseManager.GetUserBase()?.name || "None", FormType.CHOICES_SELECT_DROPDOWN, userbases));
            this.AddConfiguration("Global", new EditableConfiguration("Firewall", "Selects the different UserBase Controller that would be use for the software to handle the user-management.", FirewallManager.GetFirewall()?.GetType(), FormType.CHOICES_SELECT_DROPDOWN, firewalls));
        }

        public async RouteFunction(req: Request, res: Response, next: NextFunction)
        {
            return res.json({
                'All' : { 'UserBaseControllers': UserBaseManager.GetUserBaseControllers(), 'Firewalls': FirewallManager.GetFirewalls(), 'DataStores' : DataStore.GetAllInterfaces() },
                'Active' : { 'UserBaseController': UserBaseManager.GetUserBaseController(), 'UserBase': UserBaseManager.GetUserBase(), 'Firewall' : FirewallManager.GetFirewall(), 'DataStore' : DataStore.GetDataStore() }
            });
        }
    }
}