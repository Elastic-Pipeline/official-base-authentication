import { Form, FormFieldBase, FormMethod } from "../../../API/RenderBits/FormFactory";
import { Route } from "../../../API/Routing/Routing";
import * as Basic from '../../../AppModules/GlobalPages/forms/BasicForms';
import * as Bootstrap4 from "../../official-bootstrap-forms/forms/Bootstrap4Forms";

export class RegistrationForm extends Form
{
    private username: FormFieldBase;
    private email: FormFieldBase;
    private password: FormFieldBase;

    constructor(_route: Route)
    {
        super('registration', _route, FormMethod.POST);

        this.username = this.AddField(new Bootstrap4.TextFormField("username", true, "Username"));
        this.email = this.AddField(new Bootstrap4.TextFormField("email", true, "Email"));
        this.password = this.AddField(new Bootstrap4.PasswordFormField("password", true).SetLabel('Password'));
        this.AddField(new Bootstrap4.PasswordFormField("confirm_password", true, 'password').SetLabel('Confirm Password'));
        this.AddField(new Basic.CaptchaV1FormField("captcha"));
        this.AddField(new Bootstrap4.SubmitFormField("submit", "Register"));
    }

    public GetUserName() : string
    {
        return this.username.GetValue();
    }

    public GetEmail() : string
    {
        return this.email.GetValue();
    }

    public GetPassword() : string
    {
        return this.password.GetValue();
    }
}