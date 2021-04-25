import { Basic, Form, FormFieldBase, FormMethod } from "../../../API/FormFactory";
import { Route } from "../../../API/Routing";
import { Bootstrap4 } from "../../official-bootstrap-forms/forms/Bootstrap4Forms";


export class LoginForm extends Form
{
    private accessIdentifer: FormFieldBase;
    private password: FormFieldBase;
    private rememberMe: FormFieldBase;


    constructor(_route: Route)
    {
        super('login', _route, FormMethod.POST);
        
        this.accessIdentifer    =   this.AddField(new Bootstrap4.TextFormField("accessIdentifer").SetLabel("Username/Email"));
        this.password           =   this.AddField(new Bootstrap4.PasswordFormField("password").SetLabel("Password"));
        this.rememberMe         =   this.AddField(new Bootstrap4.CheckboxFormField("rememberMe", false).SetLabel("Remember Me"));
                                    this.AddField(new Bootstrap4.SubmitFormField("submit", "Login"));
                                    this.AddField(new Basic.CaptchaV1FormField("captcha"));
    }

    public GetAccessIdentifierField() : FormFieldBase
    {
        return this.accessIdentifer;
    }
    
    public GetPasswordField() : FormFieldBase
    {
        return this.password;
    }
    
    public GetRememberMeField() : FormFieldBase
    {
        return this.rememberMe;
    }
}