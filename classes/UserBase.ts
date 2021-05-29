import crypto from "crypto";
import { Request, Response } from "express";
import { Form } from "../../../API/RenderBits/FormFactory";
import { Route } from "../../../API/Routing";
import { RegistrationForm } from "../forms/registrationForm";

export class UserBase
{
    private type: string = ""; 
    private id:number           = -1;
    private username: string = "";
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
    public LoginById(_id:number) : boolean { return false; }
    // Takes any AccessIdentifier (Username, Email, etc) and password from the user.
    public Login(_accessIdentifier:string, _password:string) : boolean { return false; };
    // Encryption Method...
    public Encrypt(_password:string) : string { return _password; }
    // The form that would be shown to the user.
    public GenerateRegisterForm(_route: Route) : Form|undefined { return undefined; }
    // Takes all the information from this class and submits it to the data store.
    public Register() : boolean { return false; }
}

function newObject<T>(_type: new(..._args: any[]) => T ) : T
{
    return new _type();
}

export class UserBaseManager
{
    private static currentUserBase: typeof UserBase|null = null;
    private static userbases: UserBase[] = new Array();

    public static GetUserByAccessIdentifier(_accessIdentifier: string, _password: string) : UserBase|undefined
    {
        const userT = this.NewUser();
        if (userT == undefined)
        {
            return undefined;
        }
        userT.Login(_accessIdentifier, _password);

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
    public static GetUser(_request: Request ) : UserBase|undefined
    {
        const sessionID = _request.cookies['session'];
        if (sessionID == undefined)
            return undefined;
        
        const userT = this.NewUser();
        if (userT == null)
            return undefined;

        userT.LoginById(sessionID);
        return userT;
    } 


    public static RegisterUserBase(_userbase: UserBase) : void
    {
        this.userbases.push(_userbase);
    }

    public static GetUserBase() : typeof UserBase|null
    {
        return this.currentUserBase;
    }

    public static SetUserBase(_userbase: typeof UserBase|null) : void
    {
        this.currentUserBase = _userbase;
    }
}

export class BasicUser extends UserBase
{
    public myVar: string = "Hello World"; 

    constructor()
    {
        super();
    }
    
    public LoginById(_id: number): boolean 
    {
        return true;
    }
    public Login(_accessIdentifier: string, _password: string): boolean 
    {
        _password = this.Encrypt(_password);
        const accessIdentifier = '' + _accessIdentifier;
        const password = '' + _password;
        // Not exactly just yet...
        this.SetId(1);
        this.SetUsername(accessIdentifier);
        this.SetPassword(password);
        return true;
    }
    public Encrypt(_password: string): string 
    {
        return crypto.createHash('sha256').update(_password).digest('base64');
    }
    public GenerateRegisterForm(_route: Route): Form 
    {
        return new RegistrationForm(_route);
    }
    public Register(): boolean 
    {
        return true;
    }
}