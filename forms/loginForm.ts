import { Basic, Form, FormMethod } from "../../../API/FormFactory";
import { Route } from "../../../API/Routing";
import { Bootstrap4 } from "../../official-bootstrap-forms/forms/Bootstrap4Forms";


export class LoginForm extends Form
{
    constructor(_route: Route)
    {
        super('login', _route, FormMethod.POST);
        
        this.AddField(new Bootstrap4.TextFormField("accessIdentifer").SetLabel("Username/Email"));
        this.AddField(new Bootstrap4.PasswordFormField("password").SetLabel("Password"));
        this.AddField(new Bootstrap4.CheckboxFormField("rememberMe", false).SetLabel("Remember Me"));
        this.AddField(new Bootstrap4.SubmitFormField("submit", "Login"));
        this.AddField(new Basic.CaptchaV1FormField("captcha"));
    }
}