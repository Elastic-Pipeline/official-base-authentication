import { AttachmentAppIntegration, Module, ModuleManager } from "../../API/Modules/Module";
import { LoginRoute } from "./routes/login";
import session from 'express-session';
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { IsHTTPS, NextFunction, Request, Response } from "../../API/internal/statics";
import { UserBaseManager } from "./classes/UserBase";
import { DataStore } from "./classes/DataStore";
import { FirewallManager } from "./classes/FirewallBase";
import { ConfigurationPage } from "../official-configuaration-page/pages/ConfigurationIndex";
import { ConfigurationSecurity } from "./pages/Configurations/SecurityConfig";
import { SqliteDataStore } from "./classes/Usage/SqliteDataBase";
import { BasicFirewall } from "./classes/Usage/BasicFirewall";
import { BasicUserController } from "./classes/Usage/BasicUserBase";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

const secretSessionToken = crypto.randomBytes(32).toString('base64');
export function GetSecretSessionToken() { return secretSessionToken; }

class BaseModule extends Module
{
    constructor()
    {
        super("Base Authentication", fs.readFileSync(path.resolve(__dirname, "./version.txt")).toString("utf-8"));

        const dataStoreInterface = new SqliteDataStore(path.resolve(__dirname, 'data'));
        DataStore.RegisterInterface(dataStoreInterface);
        const firewallInterface = new BasicFirewall();
        FirewallManager.RegisterFirewall(firewallInterface);
        const userBaseInterface = new BasicUserController();
        UserBaseManager.RegisterUserBase(userBaseInterface);

        this.config.init("dataStoreInterface", dataStoreInterface.GetName());
        this.config.init("firewallInterface", firewallInterface.GetType());
        this.config.init("userBaseInterface", userBaseInterface.GetName());
        this.config.init("allowForget", true);
        this.config.init("allowRegistration", true);

        this.RegisterAssetFolder(__dirname + '/assets');

        if (ConfigurationPage)
            ConfigurationPage.AddSubPage(new ConfigurationSecurity());

        this.RegisterAppIntegration((_app) => {
            const dataStoreInterface: string | null = this.config.get('dataStoreInterface', null) as string;
            const firewallInterface: string | null = this.config.get('firewallInterface', null) as string;
            const userBaseInterface: string | null = this.config.get('userBaseInterface', null) as string;
            const allowForget: boolean = this.config.get('allowForget', false) as boolean;
            const allowRegistration: boolean = this.config.get('allowRegistration', false) as boolean;
            if (dataStoreInterface != null)
            {
                DataStore.SetDataStore(dataStoreInterface);
            }
            if (firewallInterface != null)
            {
                FirewallManager.SetFirewall(firewallInterface);
            }
            if (userBaseInterface != null)
            {
                UserBaseManager.SetUserBaseController(userBaseInterface);
            }

            _app.locals.canForget = allowForget && UserBaseManager.CanForget();
            _app.locals.canRegister = allowRegistration && UserBaseManager.CanRegister();

            _app.use(session({
                secret: GetSecretSessionToken(),
                name: "sid",
                resave: false,
                saveUninitialized: false,
                cookie: {
                    maxAge: 2 * HOUR,
                    sameSite: 'strict',
                    secure: IsHTTPS()
                }
            }));

            _app.use(async (req: Request, res: Response, next: NextFunction) =>
            {
                // const firewall = FirewallManager.GetFirewall();
                // if (firewall == undefined)
                //     return next();
                // console.log("Firewall Taking action.")

                // Express doesn't have a clear way to handle asynchronise error calls... - This is dumb.
                // if (err)
                // {
                //     console.log("Error Firewall Triggered.");
                //     await firewall.Call('error', _app, req, res, err);
                //     return next();
                // }
                await FirewallManager.Call('enter', _app, req, res);

                if (res.statusMessage == undefined)
                {
                    return next();
                }
            });
        }, AttachmentAppIntegration.PRE);

        this.RegisterRoute(new LoginRoute());
    }
}

ModuleManager.RegisterModule(new BaseModule());