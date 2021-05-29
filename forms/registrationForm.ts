import { Basic, Form, FormFieldBase, FormMethod } from "../../../API/RenderBits/FormFactory";
import { Route } from "../../../API/Routing";
import { Bootstrap4 } from "../../official-bootstrap-forms/forms/Bootstrap4Forms";

export class RegistrationForm extends Form
{
    private username: FormFieldBase;
    private email: FormFieldBase;
    private password: FormFieldBase;

    constructor(_route: Route)
    {
        super('registration', _route, FormMethod.POST);
        
        this.username = this.AddField(new Bootstrap4.TextFormField("username", true));
        this.email = this.AddField(new Bootstrap4.TextFormField("email", true));
        this.password = this.AddField(new Bootstrap4.PasswordFormField("password", true));
        this.AddField(new Bootstrap4.PasswordFormField("confirm_password", true, 'password'));
        this.AddField(new Basic.CaptchaV1FormField("captcha"));
        this.AddField(new Bootstrap4.SubmitFormField("submit", "Register"));
    }
}