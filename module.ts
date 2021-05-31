import { AttachmentAppIntegration, Module, ModuleManager } from "../../API/Modules/Module";
import { LoginRoute } from "./routes/login";
import session from 'express-session';
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { IsHTTPS } from "../../API/internal/statics";
import { BasicUserController, UserBaseManager } from "./classes/UserBase";
import { DataStore, SqliteDataStore } from "./classes/DataStore";
import { BasicFirewall, FirewallManager } from "./classes/FirewallBase";

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

        UserBaseManager.SetUserBaseController(new BasicUserController);

        FirewallManager.SetFirewall(new BasicFirewall);

        this.RegisterAppIntegration((_app) => {
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

            _app.use(async (req, res, next) =>
            {
                const firewall = FirewallManager.GetFirewall();
                if (firewall == undefined)
                    return next();

                await firewall.call('enter', _app, req, res);

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