
import { Request, Response } from "express";
import { Form } from "../../../API/RenderBits/FormFactory";
import { Route } from "../../../API/Routing/Routing";
import { DataStoreObject } from "./DataStore";

export class UserBase implements DataStoreObject
{
    id:number                   = -1;
    private type: string        = ""; // This forces Typescript to recoginize the differences.
    private username: string    = "";
    private email:string        = "";
    private password:string     = "";

    constructor()
    {
        this.type = this.constructor.name;
    }

    public IsValid() : boolean
    {
        return this.GetId() > 0;
    }

    public GetType() : string
    {
        return this.type;
    }

    public SetId(_id: number) : void
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
    public async Commit(): Promise<boolean> { return false; }
    // Destroys the data from the datastore.
    public async Destroy(): Promise<boolean> { return false; }
}

export class UserBaseController
{
    private userBase: typeof UserBase;
    private name: string;

    protected allowRegistration: boolean = true;
    protected allowForgotInfo: boolean = true;

    constructor(_target: typeof UserBase)
    {
        this.userBase = _target;
        this.name = this.constructor.name;
    }

    public Initialize() : void {};

    public GetName() : string
    {
        return this.name;
    }

    public IsRegistrationAllowed() : boolean
    {
        return this.allowRegistration;
    }

    public IsForgotInfoAllowed() : boolean
    {
        return this.allowForgotInfo;
    }

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
    private static currentUserBaseController: UserBaseController|undefined;
    private static userBaseControllers: Map<string, UserBaseController> = new Map();

    public static Logout(_request: Request, _response: Response) : void
    {
        // Clean out all cookies...
        const cookie = _request.cookies;
        for (var prop in cookie)
        {
            if (!cookie.hasOwnProperty(prop))
            {
                continue;
            }
            _response.clearCookie(prop);
        }
    }

    public static async GetUserByAccessIdentifier(_accessIdentifier: string, _password: string) : Promise<UserBase|undefined>
    {
        const userT = this.NewUser();
        if (userT == undefined)
            return undefined;

        if ((await userT.Login(_accessIdentifier, _password)) == false)
            return undefined;

        return userT;
    }

    public static NewUser() : UserBase|null
    {
        if (this.GetUserBase() == null)
            throw new Error("No active Current User Base was Set!");
        return newObject<UserBase>(this.GetUserBase() as typeof UserBase);
    }
    public static async GetUserId(_id: number ) : Promise<UserBase|undefined>
    {
        const userT = this.NewUser();
        if (userT == null)
            return undefined;

        if ((await userT.LoginById(_id)) == false)
            return undefined;

        console.log("Found User ", userT.GetUsername(), userT.GetId());

        return userT;
    }

    public static async GetUser(_request: Request ) : Promise<UserBase|undefined>
    {
        const sessionID = _request.cookies['session'];
        if (sessionID == undefined)
            return undefined;

        const userT = this.NewUser();
        if (userT == null)
            return undefined;

        if ((await userT.LoginById(sessionID)) == false)
            return undefined;

        return userT;
    }

    public static RegisterUserBase(_userbaseController: UserBaseController) : void
    {
        this.userBaseControllers.set(_userbaseController.GetName(), _userbaseController);
    }

    public static GetUserBaseController() : UserBaseController|undefined
    {
        return this.currentUserBaseController;
    }
    public static GetUserBase() : typeof UserBase|undefined
    {
        return this.GetUserBaseController()?.GetUserBase() || undefined;
    }

    public static SetUserBaseController(_controller: UserBaseController|string|undefined) : void
    {
        if (_controller == undefined)
        {
            this.currentUserBaseController = undefined;
            return;
        }

        if (_controller instanceof UserBaseController)
        {
            if (!this.userBaseControllers.has(_controller.GetName()))
            {
                this.RegisterUserBase(_controller);
            }

            this.currentUserBaseController = _controller;
        }
        else
        {
            if (this.userBaseControllers.has(_controller))
                this.currentUserBaseController = this.userBaseControllers.get(_controller);
        }

        if (this.currentUserBaseController != undefined)
        {
            UserBaseManager.GetUserBaseController()?.Initialize();
        }
    }

    public static GetUserBaseControllers() : Map<string, UserBaseController>
    {
        return this.userBaseControllers;
    }

    public static CanForget() : boolean
    {
        return this.GetUserBaseController()?.IsForgotInfoAllowed() || false;
    }

    public static CanRegister() : boolean
    {
        return this.GetUserBaseController()?.IsRegistrationAllowed() || false;
    }
}
