import { AttachmentAppIntegration, Module, ModuleManager } from "../../API/Modules/Module";
import { LoginRoute } from "./routes/login";
import session from 'express-session';
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { InDevelopment } from "../../API/internal/statics";
import { RouteManager } from "../../API/Routing/RouteManager";
import { Route } from "../../API/Routing/Routing";
import { BasicUser, BasicUserController, UserBaseManager } from "./classes/UserBase";
import { DataStore, SqliteDataStore } from "./classes/DataStore";

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

        this.RegisterAppIntegration((_app) => {
            _app.use(
                session({
                    secret: GetSecretSessionToken(),
                    name: "sid",
                    resave: false,
                    saveUninitialized: false,
                    cookie: {
                        maxAge: 2 * HOUR,
                        sameSite: 'strict',
                        secure: !InDevelopment()
                    }
                })
            );
            
            _app.use(async (req, res, next) =>
            {
                const url = Route.SanitizeURL(req.url);

                const whitelistedURLs = [RouteManager.GetRouteLabel('license'), RouteManager.GetRouteLabel('register')];
                const loginURL = RouteManager.GetRouteLabel('login');

                const usr = await UserBaseManager.GetUser(req);
                
                var loggedOut = false;
                if (usr == undefined)
                {
                    loggedOut = true;
                }
                else
                {
                    _app.locals.user = usr;
                }

                if (loggedOut && (url != loginURL && !url.startsWith('/static') && !url.endsWith("favicon.ico") && !whitelistedURLs.includes(url)))
                {
                    return res.redirect(loginURL);
                }

                return next();
            });
        }, AttachmentAppIntegration.PRE);

        this.RegisterRoute(new LoginRoute());
    }
}

ModuleManager.RegisterModule(new BaseModule());