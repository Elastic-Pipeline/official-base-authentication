import { Logger } from "../../../API/Common/Logging";
import { final } from "../../../API/Common/FinalDecoration";

export type DataStoreFunc = (err: Error, ..._any: any[]) => void;
export type DataStoreTableVariableModifiers = {
    PRIMARY_KEY?:           boolean,
    UNIQUE?:                boolean,
    DEFAULT?:               string,
    ON_DELETE?:             string,
    ON_UPDATE?:             string,
    AUTO_INCREMENT?:        boolean,
    NOT_NULL?:              boolean,
    COMMENT?:               string,
}

export enum DataStoreDataTypes
{
    TEXT        = "TEXT",
    JSON        = "TEXT",
    INTEGER     = "INTEGER",
    TIMESTAMP   = "TIMESTAMP"
}

export interface DataStoreObject
{
    id: number;
    SetId(_id: number) : void;
    GetId() : number;
    Commit() : Promise<boolean>;
    Destroy() : Promise<boolean>;
}

export class DataStoreTableVariable
{
    private name: string;
    private type: string;
    private varType: string;
    protected modifiers: DataStoreTableVariableModifiers;
    constructor(_name: string, _varType: string | DataStoreDataTypes, _modifiers: DataStoreTableVariableModifiers = {})
    {
        this.name = _name;
        this.type = this.constructor.name;
        this.varType = _varType;
        this.modifiers = _modifiers;
    }
    public GetName() : string
    {
        return this.name;
    }
    public GetType() : string
    {
        return this.type;
    }
    public GetVarType() : string
    {
        return this.varType;
    }
    public GetModifiers() : DataStoreTableVariableModifiers
    {
        return this.modifiers;
    }

    public DisplayModifiers() : string
    {
        var ret: string[] = [];

        // Todo :: Dialect Mappings.
        if (this.modifiers.PRIMARY_KEY)
            ret.push("PRIMARY KEY");
        if (this.modifiers.UNIQUE)
            ret.push("UNIQUE");
        if (this.modifiers.DEFAULT)
            ret.push(`DEFAULT ${this.modifiers.DEFAULT}`);
        if (this.modifiers.AUTO_INCREMENT)
            ret.push("AUTOINCREMENT"); // Sqlite Specific, need to modify this for other DataStores.
        else if (this.modifiers.NOT_NULL) // Sqlite Specifically, cannot have Not null and Autoincrement at the same time - which makes sense.
            ret.push("NOT NULL");
        if (this.modifiers.ON_UPDATE)
            ret.push(`ON UPDATE ${this.modifiers.ON_UPDATE}`);
        if (this.modifiers.ON_DELETE)
            ret.push(`ON DELETE ${this.modifiers.ON_DELETE}`);
        if (this.modifiers.COMMENT)
            ret.push(`COMMENT ${this.modifiers.COMMENT}`);
        return ret.join(" ");
    }

    public toString() : string
    {
        return `\`${this.name}\` ${this.varType} ${this.DisplayModifiers()}`;
    }
}

export class DataStoreParameter
{
    private name: string;
    private value: any;
    constructor(_name: string, _value: any)
    {
        this.name = _name;
        if (typeof(_value) == 'object')
            _value = JSON.stringify(_value); // We want to make objects always stringified in json. Type-safety
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
    protected isReady: boolean = true;

    protected name: string  = "";
    constructor(_name: string)
    {
        this.name = _name;
        this.type = this.constructor.name;
    }

    public GetName() : string
    {
        return this.name;
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

@final
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
        if (_interface == undefined)
            return;

        if (!this.dataStoreInterfaces.includes(_interface))
            this.RegisterInterface(_interface);

        this.currentDataStore = _interface;
    }

    public static async CreateTable(_tableName: string, ..._variables: DataStoreTableVariable[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;

        try
        {
            return dataStore.CreateTable(_tableName, ..._variables);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {CreateTable} ::>", err);
        }
        return false;
    }
    public static async FetchFromTable(_tableName: string, _items: string[] = ['*'], _where: string[] = [], _params: any[] = [], _postfix: string = ""): Promise<any[]>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return [];

        try
        {
            return dataStore.FetchFromTable(_tableName, _items, _where, _params, _postfix);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {FetchFromTable} ::>", err);
        }
        return [];
    }
    public static async InsertToTable(_tableName: string, ..._parameters: DataStoreParameter[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;

        try
        {
            return dataStore.InsertToTable(_tableName, ..._parameters);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {InsertToTable} ::>", err);
        }
        return false;
    }
    public static async GetLastInsertID(_tableName: string) : Promise<number>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return -1;

        try
        {
            return dataStore.GetLastInsertID(_tableName);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {GetLastInsertID} ::>", err);
        }
        return -1;
    }
    public static async UpdateTable(_tableName: string, _where: string[], ..._parameters: DataStoreParameter[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;

        try
        {
            return dataStore.UpdateTable(_tableName, _where, ..._parameters);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {UpdateTable} ::>", err);
        }
        return false;
    }
    public static async RemoveRowFromTable(_tableName: string, _where: string[]) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;

        try
        {
            return dataStore.RemoveRowFromTable(_tableName, _where);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {RemoveRowFromTable} ::>", err);
        }
        return false;
    }
    public static async DeleteTable(_tableName: string) : Promise<boolean>
    {
        const dataStore = this.GetDataStore();
        if (dataStore == undefined)
            return false;

        try
        {
            return dataStore.DeleteTable(_tableName);
        }
        catch(err)
        {
            Logger.error("Data Store Exception ["+ this.GetDataStore()?.GetType() +"] {DeleteTable} ::>", err);
        }
        return false;
    }
}
