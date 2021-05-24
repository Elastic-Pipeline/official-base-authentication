import { mkdirSync } from "node:fs";
import path from "path";
import sqlite from "sqlite3";
import { isDirectory, mkdirs } from "../../../API/internal/statics";
import { Logger } from "../../../API/Logging";

export abstract class DataStoreInterface
{
    protected name: string = "";
    constructor(){}
    public abstract Exec(_string: string, _values: any[]) : void;
}

export class DataStore
{
    private static currentDataStore: DataStoreInterface|undefined = undefined;
    private static dataStoreInterfaces: Array<DataStoreInterface> = new Array();

    public static GetAllInterfaces() : DataStoreInterface[]
    {
        return this.dataStoreInterfaces;
    }

    public static RegisterInterface(_dataStoreInterface: DataStoreInterface) : void
    {
        this.dataStoreInterfaces.push(_dataStoreInterface);
    }

    public static GetDataStore() : DataStoreInterface|undefined
    {
        return this.currentDataStore;
    }

    public static SetDataStore(_interface: DataStoreInterface|undefined)
    {
        this.currentDataStore = _interface;
    }
}

export class SqliteDataStore extends DataStoreInterface
{
    private db: sqlite.Database;
    private isReady: boolean = true; // Most likely bad, revisit later?

    constructor(_dataFolder: string)
    {
        super();
        this.name = "SQLite";
        if (!isDirectory(_dataFolder))
        {
            mkdirs(_dataFolder);
        }
        this.db = new sqlite.Database(path.resolve(_dataFolder, 'sqlite.db'), sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
            if (err)
            {
                this.isReady = false;
                Logger.error("Sqlite Exception ::>", err);
                return;
            }
        });
    }

    public Exec(_string: string, _values: any[]): void 
    {
        if (this.isReady)
        {
            this.db.prepare(_string, _values, (state: sqlite.Statement|undefined, err: Error|undefined) => {
                if (err)
                {
                    Logger.error("Sqlite Exec Exception ::>", err);
                    return;
                }
            });
        }
    }
}