import path from "path";
import sqlite from "sqlite3";
import { Logger } from "../../../API/Logging";

export abstract class DataStoreInterface
{
    constructor(){}
    public abstract Exec(_string: string, _values: any[]) : void;
}

export class DataStore
{
    private static dataStoreInterface: DataStoreInterface|undefined = undefined; 

    public static GetDataStore() : DataStoreInterface|undefined
    {
        return this.dataStoreInterface;
    }

    public static SetDataStore(_interface: DataStoreInterface|undefined)
    {
        this.dataStoreInterface = _interface;
    }
}

export class SqliteDataStore extends DataStoreInterface
{
    private db: sqlite.Database;
    private isReady: boolean = true; // Most likely bad, revisit later?

    constructor(_dataFolder: string)
    {
        super();

        this.db = new sqlite.Database(path.resolve(_dataFolder, 'data/sqlite.db'), (err) => {
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