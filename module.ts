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
        DataStore.SetDataStore(dataStoreInterface);
        FirewallManager.SetFirewall(new BasicFirewall());

        this.RegisterAssetFolder(__dirname + '/assets');

        if (ConfigurationPage)
            ConfigurationPage.AddSubPage(new ConfigurationSecurity());

        this.RegisterAppIntegration((_app) => {
            UserBaseManager.SetUserBaseController(new BasicUserController()); // We want this to run after all modules are loaded.

            _app.locals.canForget = UserBaseManager.CanForget();
            _app.locals.canRegister = UserBaseManager.CanRegister();

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
                const firewall = FirewallManager.GetFirewall();
                if (firewall == undefined)
                    return next();

                // Express doesn't have a clear way to handle asynchronise error calls... - This is dumb.
                // if (err)
                // {
                //     console.log("Error Firewall Triggered.");
                //     await firewall.Call('error', _app, req, res, err);
                //     return next();
                // }
                await firewall.Call('enter', _app, req, res);

                if (res.statusMessage == undefined)
                {
                    return next();
                }
            });
        }, AttachmentAppIntegration.PRE);

        this.RegisterAppIntegration((_app) => {
            // After we are done loading, we want to load the userbase.
            UserBaseManager.GetUserBaseController().Initialize();
        }, AttachmentAppIntegration.POST);

        this.RegisterRoute(new LoginRoute());
    }
}

ModuleManager.RegisterModule(new BaseModule());