import { Module, ModuleManager } from "../../API/Module";
import { OverrideIndexSecurityRoute } from "./routes/override_index";
import { LoginRoute } from "./routes/login";
import fs from "fs";
import path from "path";

class BaseModule extends Module
{
    constructor()
    {
        super("Basic Authentication", fs.readFileSync(path.resolve(__dirname, "./version.txt")).toString("utf-8"));

        this.RegisterRoute(new OverrideIndexSecurityRoute());
        this.RegisterRoute(new LoginRoute());
    }
}

ModuleManager.RegisterModule(new BaseModule());