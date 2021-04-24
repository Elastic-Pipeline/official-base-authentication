import { Basic, Form, FormMethod } from "../../../API/FormFactory";
import { Route } from "../../../API/Routing";
import { Bootstrap4 } from "../../@official-bootstrap-forms/forms/Bootstrap4Forms";

export class RegistrationForm extends Form
{
    constructor(_route: Route)
    {
        super('registration', _route, FormMethod.POST);
        
        this.AddField(new Bootstrap4.TextFormField("username"));
        this.AddField(new Bootstrap4.TextFormField("email"));
        this.AddField(new Bootstrap4.PasswordFormField("password"));
        this.AddField(new Bootstrap4.PasswordFormField("confirm_password", true, 'password'));
        this.AddField(new Basic.CaptchaV1FormField("captcha"));
        this.AddField(new Bootstrap4.SubmitFormField("submit", "Register"));
    }
}