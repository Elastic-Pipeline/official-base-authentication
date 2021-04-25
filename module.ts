import { Module, ModuleManager } from "../../API/Module";
import { OverrideIndexSecurityRoute } from "./routes/override_index";
import { LoginRoute } from "./routes/login";
import session from 'express-session';
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { InDevelopment } from "../../API/internal/statics";

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
        });

        this.RegisterRoute(new OverrideIndexSecurityRoute());
        this.RegisterRoute(new LoginRoute());
    }
}

ModuleManager.RegisterModule(new BaseModule());