import { mkdirSync } from "node:fs";
import path from "path";
import sqlite from "sqlite3";
import { isDirectory, mkdirs } from "../../../API/internal/statics";
import { Logger } from "../../../API/Common/Logging";

export type DataStoreFunc = (err: Error, ..._any: any[]) => void;

export class DataStoreTableVariable
{
    private name: string;
    private type: string;
    private postFix: string;
    constructor(_name: string, _type: string, _postFix: string = "")
    {
        this.name = _name;
        this.type = _type;
        this.postFix = _postFix;
    }
    public GetName() : string
    {
        return this.name;
    }
    public GetType() : string
    {
        return this.type;
    }
    public GetPostFix() : string
    {
        return this.postFix;
    }

    public toString() : string
    {
        return `\`${this.name}\` ${this.type} ${this.postFix}`;
    }
}

export class DataStoreParameter
{
    private name: string;
    private value: any;
    constructor(_name: string, _value: any)
    {
        this.name = _name;
        this.value = _value;
    }
    public GetName() : string
    {
        return this.name;
    }
    public GetValue() : any
    {
        return this.value;
    }

    public toString() : string
    {
        return `?`;
    }
}

export abstract class DataStoreInterface
{
    private type: string    = "";

    protected name: string  = "";
    constructor(_name: string)
    {
        this.name = _name;
        this.type = this.constructor.name;
    }

    public GetType() : string
    {
        return this.type;
    }

    public abstract CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]) : Promise<boolean>;
    public abstract FetchFromTable(_tableName: string, _items: string[], _where: string[], _params: any[], _postfix: string): Promise<any[]>;
    public abstract InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]) : Promise<boolean>;
    public abstract GetLastInsertID(_tableName: string) : Promise<number>;
    public abstract UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]) : Promise<boolean>;
    public abstract RemoveRowFromTable(_tableName: string, _where: string[]) : Promise<boolean>;
    public abstract DeleteTable(_tableName: string) : Promise<boolean>;
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

    public static async CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;
        
        return dataStore.CreateTable(_tableName, ..._variables);
    }
    public static async FetchFromTable(_tableName: string, _items: string[] = ['*'], _where: string[] = [], _params: any[] = [], _postfix: string = ""): Promise<any[]> 
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return [];
        
        return dataStore.FetchFromTable(_tableName, _items, _where, _params, _postfix);
    }
    public static async InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;
        
        return dataStore.InsertToTable(_tableName, ..._parameters);
    }
    public static async GetLastInsertID(_tableName: string) : Promise<number>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return -1;
        
        return dataStore.GetLastInsertID(_tableName);
    }
    public static async UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;
        
        return dataStore.UpdateTable(_tableName, _where, ..._parameters);
    }
    public static async RemoveRowFromTable(_tableName: string, _where: string[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;
        
        return dataStore.RemoveRowFromTable(_tableName, _where);
    }
    public static async DeleteTable(_tableName: string) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;
        
        return dataStore.DeleteTable(_tableName);
    }
}

export class SqliteDataStore extends DataStoreInterface
{
    private db: sqlite.Database;
    private isReady: boolean = true; // Most likely bad, revisit later?

    constructor(_dataFolder: string)
    {
        super("SQLite");

        if (!isDirectory(_dataFolder))
            mkdirs(_dataFolder);

        this.db = new sqlite.Database(path.resolve(_dataFolder, 'sqlite.db'), sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
            if (err)
            {
                this.isReady = false;
                Logger.error("Sqlite Exception ::>", err);
                return;
            }
        });
    }

    public async AllSync(_string: string, _values: any[]) : Promise<any[]>
    {
        return new Promise<any[]>((resolve, reject) => {
            this.db.all(_string, _values, (err: Error, rows: any[]) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);

                return resolve(rows);
            });
        });
    }

    public ExecSync(_string: string, _values: any[]): Promise<void> 
    {
        return new Promise<void>((resolve, reject) => {
            this.Exec(_string, _values, (err) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);

                return resolve();
            });
        });
    }
    public Exec(_string: string, _values: any[], _cb: DataStoreFunc): void 
    {
        if (!this.isReady)
            return;

        this.db.run(_string, _values, (err: Error) => {
            if (err)
            {
                Logger.error("Sqlite Exec Exception ::>", err, `- ${_string} (${_values})`);
                return;
            }
            _cb(err);
        });
    }
    
    public async CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]): Promise<boolean> 
    {
        if (_variables.length == 0)
        {
            Logger.error(`Creating Table: ${_tableName} - Failed, needs variables.`);
            return false;
        }
        try
        {
            await this.ExecSync(`CREATE TABLE IF NOT EXISTS \`${_tableName}\` ( ${_variables.join(',')} )`, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Creating Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }

    public async FetchFromTable(_tableName: string, _items: string[], _where: string[], _params: any[] = [], _postfix: string = ""): Promise<any[]> 
    {
        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' AND ');
        }

        try
        {
            const rows = await this.AllSync(`SELECT ${_items.join(',')} FROM \`${_tableName}\` ${whereStr} ${_postfix}`, _params);
            return rows;
        }
        catch(err)
        {
            Logger.error(`Fetching from Table: ${_tableName} - Exception ::> ${err}`);
        }

        return [];
    }

    public async InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]): Promise<boolean> 
    {
        var variableNames: string[] = [];
        var variableValues: any[] = [];
        for (let index = 0; index < _parameters.length; index++) {
            const variable = _parameters[index];
            variableNames.push(`\`${variable.GetName()}\``);
            variableValues.push(variable.GetValue());
        }

        try
        {
            await this.ExecSync(`INSERT INTO \`${_tableName}\` ( ${variableNames.join(',')} ) VALUES ( ${_parameters.join(',')} )`, variableValues);
            return true;
        }
        catch(err)
        {
            Logger.error(`Inserting into Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }

    public async GetLastInsertID(_tableName: string) : Promise<number>
    {
        try
        {
            const rows = await this.AllSync(`SELECT last_insert_rowid();`, []);
            return rows[0]['last_insert_rowid()'];
        }
        catch(err)
        {
            Logger.error(`Last Insert ID: ${_tableName} - Exception ::> ${err}`);
        }

        return -1;
    }

    public async UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]): Promise<boolean> 
    {
        var variableNames: string[] = [];
        var variableValues: any[] = [];
        for (let index = 0; index < _parameters.length; index++) {
            const variable = _parameters[index];
            variableNames.push(`\`${variable.GetName()}\` = ?`);
            variableValues.push(variable.GetValue());
        }

        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' && ');
        }

        try
        {
            await this.ExecSync(`UPDATE \`${_tableName}\` SET ${variableNames.join(',')} ${whereStr}`, variableValues);
            return true;
        }
        catch(err)
        {
            Logger.error(`Update Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }

    public async RemoveRowFromTable(_tableName: string, _where: string[]): Promise<boolean> 
    {
        try
        {
            await this.ExecSync(`DROP TABLE \`${_tableName}\``, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Remove Row From Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }

    public async DeleteTable(_tableName: string): Promise<boolean> 
    {
        try
        {
            await this.ExecSync(`DROP TABLE \`${_tableName}\``, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Delete Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
}