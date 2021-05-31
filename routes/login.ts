import { Form } from "../../../API/RenderBits/FormFactory";
import { RouteManager } from "../../../API/Routing/RouteManager";
import { Route, RouteType, ROUTE_FIRST } from "../../../API/Routing/Routing";
import { UserBaseManager } from "../classes/UserBase";
import { LoginForm } from "../forms/loginForm";
import { RegistrationForm } from "../forms/registrationForm";

export class LoginRoute extends Route
{
    constructor()
    {
        super("/");

        this.CustomRoute(RouteType.GET | RouteType.POST, "login", async (req, res, next) : Promise<void> =>
        {
            const loginForm = Form.CreateForm(new LoginForm(this), res) as LoginForm;
            if (loginForm.Verify(req))
            {
                const user = await loginForm.GetUser();
                if (user != undefined)
                {
                    res.cookie('session', user.GetId()); // Temporary thing; we just want to see, if we can pick it up later...
                    return res.redirect(RouteManager.GetRouteLabel('index'));
                }
                Route.Notify(res, "error", "Username/Email or Password wasn't correct!");
            }
            else
            {
                const errors = loginForm.GetErrors(req);
                for (let index = 0; index < errors.length; index++) {
                    const element = errors[index];
                    Route.Notify(res, "error", "Field Error :: " + element.message);
                }
            }

            return res.render('views/login.ejs', { login_form: loginForm.View() });
        }, 'login', ROUTE_FIRST);

        this.CustomRoute(RouteType.GET | RouteType.POST, "register", async (req, res, next) =>
        {
            const user = UserBaseManager.NewUser();
            if (user == null)
                throw new Error("No Possible User to register!");

            const registerForm = user.GenerateRegisterForm(this, res) as RegistrationForm;
            if (registerForm == undefined)
                throw new Error("No Register Form!");

            if (registerForm.Verify(req))
            {
                user.SetUsername(registerForm.GetUserName());
                user.SetPassword(registerForm.GetPassword());
                user.SetEmail(registerForm.GetEmail());
                if (await user.Submit())
                {
                    res.cookie('session', user.GetId()); // Temporary thing; we just want to see, if we can pick it up later...
                    return res.redirect(RouteManager.GetRouteLabel('index'));
                }
                else
                {
                    // Send Error to user...
                }
            }
            else
            {
                // Grab Errors, and send to user.
            }

            return res.status(200).render('views/login.ejs', { login_form: registerForm.View() });
        }, 'register');

        this.Get("logout", async (req, res, next) =>
        {
            UserBaseManager.Logout(req, res);

            // Redirect to home; which should take you back to login (if enabled)
            res.redirect(RouteManager.GetRouteLabel('index'));
        }, 'logout');
    }
}