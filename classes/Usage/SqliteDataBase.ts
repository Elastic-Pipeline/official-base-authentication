import { final } from "../../../../API/Common/FinalDecoration";
import { Logger } from "../../../../API/Common/Logging";
import { DataStoreInterface, DataStoreParameter, DataStoreTableVariable } from "../DataStore";
import sqlite from "sqlite3";
import { isDirectory, mkdirs } from "../../../../API/internal/statics";
import path from "path";

@final
export class SqliteDataStore extends DataStoreInterface
{
    private db: sqlite.Database | null = null;
    private dataFolder: string;

    constructor(_dataFolder: string)
    {
        super("SQLite");

        this.dataFolder = _dataFolder;

    }
    public Init(): void
    {
        if (!isDirectory(this.dataFolder))
            mkdirs(this.dataFolder);

        this.db = new sqlite.Database(path.resolve(this.dataFolder, 'sqlite.db'), sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err) => {
            if (err)
            {
                this.isReady = false;
                Logger.error("Sqlite Exception ::>", err);
                return;
            }
            Logger.debug("<:: Sqlite is Ready ::>");
            this.isReady = true;
        });
    }

    public AllSync(_string: string, _values: any[]) : Promise<any[]>
    {
        if (this.db == null || !this.isReady)
            return new Promise<any[]>((resolve, reject) => { reject("Execution isn't ready yet!"); });
        return new Promise<any[]>((resolve, reject) => {
            this.db?.all(_string, _values, (err: Error, rows: any[]) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);

                return resolve(rows);
            });
        });
    }

    public ExecSync(_string: string, _values: any[]): Promise<void>
    {
        if (!this.isReady)
            return new Promise<void>((resolve, reject) => { reject("Execution isn't ready yet!"); });
        return new Promise<void>((resolve, reject) => {
            this.db?.run(_string, _values, (err: Error) => {
                if (err)
                    return reject(err + ` - ${_string} (${_values})`);

                return resolve();
            });
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
            return await this.AllSync(`SELECT ${_items.join(',')} FROM \`${_tableName}\` ${whereStr} ${_postfix}`, _params);
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
        var whereStr: string = "";
        if (_where.length > 0)
        {
            whereStr = "WHERE " + _where.join(' && ');
        }

        try
        {
            await this.ExecSync(`DELETE FROM \`${_tableName}\` ${whereStr}`, []);
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
            await this.ExecSync(`DROP TABLE IF EXISTS \`${_tableName}\``, []);
            return true;
        }
        catch(err)
        {
            Logger.error(`Delete Table: ${_tableName} - Exception ::> ${err}`);
        }

        return false;
    }
}