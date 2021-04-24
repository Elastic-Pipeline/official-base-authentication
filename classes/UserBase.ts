import crypto from "crypto";
import { Form } from "../../../API/FormFactory";
import { Route } from "../../../API/Routing";
import { RegistrationForm } from "../forms/registrationForm";

export abstract class UserBase
{
    private id:number           = -1;
    private username: string = "";
    private email:string        = "";
    private password:string     = ""; 

    constructor()
    {
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
    public SetUsername(_value: string) 
    {
        this.username = _value;
    }

    // Get the User's Email.
    public GetEmail() : string 
    {
        return this.email;
    }
    // Set the User's Email.
    public SetEmail(_value: string) 
    {
        this.email = _value;
    }
    
    // Grab the encrypted password.
    public GetPassword() : string 
    {
        return this.password;
    }
    // Sets the User's password. (This will run the Encrypt function to encrypt your password.)
    public SetPassword(_value: string) 
    {
        this.password = this.Encrypt(_value);
    }

    public abstract LoginById(_id:number) : boolean;
    public abstract Login(_accessIdentifier:string, _password:string) : boolean;
    public abstract Encrypt(_password:string) : string;
    public abstract GenerateRegisterForm(_route: Route) : Form;
    public abstract Register() : boolean;
}

export class BasicUser extends UserBase
{
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