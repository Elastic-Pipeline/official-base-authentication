import crypto from "crypto";
import { Request, Response } from "express";
import { Form } from "../../../API/RenderBits/FormFactory";
import { Route } from "../../../API/Routing/Routing";
import { RegistrationForm } from "../forms/registrationForm";
import { DataStore, DataStoreParameter, DataStoreTableVariable } from "./DataStore";

export class UserBase
{
    private type: string        = ""; // This forces Typescript to recoginize the differences.
    private id:number           = -1;
    private username: string    = "";
    private email:string        = "";
    private password:string     = ""; 

    constructor()
    {
        this.type = this.constructor.name;
    }

    public GetType() : string
    {
        return this.type;
    }

    protected SetId(_id: number) : void
    {
        this.id = _id;
    }

    // Grab the User's Unique Identifier that is auto generated on the creation of a new User.
    public GetId() : number
    {
        return this.id;
    }

    // Get the User's name.
    public GetUsername() : string 
    {
        return this.username;
    }
    // Set the User's name.
    public SetUsername(_value: string) : void
    {
        this.username = _value;
    }

    // Get the User's Email.
    public GetEmail() : string 
    {
        return this.email;
    }
    // Set the User's Email.
    public SetEmail(_value: string) : void
    {
        this.email = _value;
    }
    
    // Grab the encrypted password.
    public GetPassword() : string 
    {
        return this.password;
    }
    // Sets the User's password. (This will run the Encrypt function to encrypt your password.)
    public SetPassword(_value: string) : void
    {
        this.password = this.Encrypt(_value);
    }
    
    
    // Force Login
    public async LoginById(_id:number) : Promise<boolean>  { return false; }
    // Takes any AccessIdentifier (Username, Email, etc) and password from the user.
    public async Login(_accessIdentifier:string, _password:string) : Promise<boolean> { return false; };
    // Encryption Method...
    public Encrypt(_password:string) : string { return _password; }
    // The form that would be shown to the user.
    public GenerateRegisterForm(_route: Route, _response: Response) : Form|undefined { return undefined; }
    // Takes all the information from this class and submits it to the data store.
    public async Submit() : Promise<boolean> { return false; }
}

export class UserBaseController
{    
    private userBase: typeof UserBase;

    constructor(_type: typeof UserBase)
    {
        this.userBase = _type;
    }

    public Initialize() : void {};

    public GetUserBase() : typeof UserBase
    {
        return this.userBase;
    }
}

function newObject<T>(_type: new(..._args: any[]) => T ) : T
{
    return new _type();
}

export class UserBaseManager
{
    private static currentUserBaseController: UserBaseController = new UserBaseController(UserBase);
    private static userBaseControllers: UserBaseController[] = new Array();

    public static async GetUserByAccessIdentifier(_accessIdentifier: string, _password: string) : Promise<UserBase|undefined>
    {
        const userT = this.NewUser();
        if (userT == undefined)
        {
            return undefined;
        }
        console.log("[Before Login]", userT);
        if ((await userT.Login(_accessIdentifier, _password)) == false)
        {
            return undefined;
        }
        console.log("[After Login]", userT);

        return userT;
    } 

    public static NewUser() : UserBase|null
    {
        if (this.GetUserBase() == null)
        {
            throw new Error("No active Current User Base was Set!");
            return null;
        }
        return newObject<UserBase>(this.GetUserBase() as typeof UserBase);
    } 
    public static async GetUser(_request: Request ) : Promise<UserBase|undefined>
    {
        const sessionID = _request.cookies['session'];
        if (sessionID == undefined)
            return undefined;
        
        const userT = this.NewUser();
        if (userT == null)
            return undefined;

        await userT.LoginById(sessionID);
        return userT;
    }

    public static RegisterUserBase(_userbaseController: UserBaseController) : void
    {
        _userbaseController.Initialize();
        this.userBaseControllers.push(_userbaseController);
    }

    public static GetUserBaseController() : UserBaseController
    {
        return this.currentUserBaseController;
    }
    public static GetUserBase() : typeof UserBase
    {
        return this.GetUserBaseController().GetUserBase();
    }

    public static SetUserBaseController(_userbase: UserBaseController) : void
    {
        if (!this.userBaseControllers.includes(_userbase))
        {
            this.RegisterUserBase(_userbase);
        }

        this.currentUserBaseController = _userbase;
    }
}

export class BasicUser extends UserBase
{
    constructor()
    {
        super();
    }
    
    public async LoginById(_id: number): Promise<boolean> 
    {
        console.log("Logging in by ID: ", _id);
        const rows = await DataStore.FetchFromTable("users", ["*"], [`id=\"${_id}\"`], [], "LIMIT 1")
        if (rows.length == 0)
            return false;

        const userData = rows[0];

        this.SetId(userData.id);
        this.SetUsername(userData.username);
        this.SetPassword(userData.password);

        return true;
    }
    public async Login(_accessIdentifier: string, _password: string): Promise<boolean> 
    {
        _password = this.Encrypt(_password);
        const accessIdentifier: string = '' + _accessIdentifier;
        const password: string = '' + _password;
        
        const rows = await DataStore.FetchFromTable("users", ["*"], [`username=\"${accessIdentifier}\"`, `password=\"${password}\"`], [], "LIMIT 1")
        if (rows.length == 0)
            return false;

        const userData = rows[0];
        
        this.SetId(userData.id);
        this.SetUsername(userData.username);
        this.SetPassword(userData.password);

        return true;
    }
    public Encrypt(_password: string): string 
    {
        return crypto.createHash('sha256').update(_password).digest('base64');
    }
    public GenerateRegisterForm(_route: Route, _response: Response): Form|undefined
    {
        return Form.CreateForm(new RegistrationForm(_route), _response);
    }
    public async Submit(): Promise<boolean> 
    {
        var success = false;
        if (this.GetId() == -1)
        {
            success = await DataStore.InsertToTable("users", 
                new DataStoreParameter("username", this.GetUsername()),
                new DataStoreParameter("password", this.GetPassword()),
                new DataStoreParameter("email", this.GetEmail()),
            );

            this.SetId(await DataStore.GetLastInsertID("users"));
        }
        else
        {
            success = await DataStore.UpdateTable("users", [`\`ID\`=${this.GetId()}`], new DataStoreParameter("username", this.GetUsername()), new DataStoreParameter("password", this.GetPassword()), new DataStoreParameter("email", this.GetEmail()))
        }
        
        return success;
    }
}

export class BasicUserController extends UserBaseController
{
    constructor()
    {
        super(BasicUser);
    }
    public async Initialize() : Promise<void> 
    {
        await DataStore.DeleteTable("users");
        await DataStore.CreateTable("users", 
            new DataStoreTableVariable("id", "INTEGER", "PRIMARY KEY AUTOINCREMENT NOT NULL"), 
            new DataStoreTableVariable("username", "VARCHAR(35)", "NOT NULL"), 
            new DataStoreTableVariable("password", "VARCHAR(512)", "NOT NULL"), 
            new DataStoreTableVariable("email", "VARCHAR(64)", "NOT NULL"), 
            new DataStoreTableVariable("creationDate", "TIMESTAMP", "DEFAULT CURRENT_TIMESTAMP NOT NULL")
        );

        const testUser = UserBaseManager.NewUser() as BasicUser;
        testUser.SetUsername("Test User");
        testUser.SetPassword("Test");
        testUser.SetEmail("test@email.com");
        await testUser.Submit();
        testUser.SetUsername("test");
        testUser.SetPassword("test");
        await testUser.Submit();

        const users = await DataStore.FetchFromTable("users", ["*"]);
        console.log(__filename, users);
    }
}