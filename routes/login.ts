import { Route, RouteType } from "../../../API/Routing";
import { LoginForm } from "../forms/loginForm";

export class LoginRoute extends Route
{
    constructor()
    {
        super("/");

        this.CustomRoute(RouteType.GET | RouteType.POST, "login", (req, res, next) => 
        {
            const loginForm = new LoginForm(this);
            if (loginForm.Verify(req))
            {
                console.log("Verified");
            }

            res.status(200).render('views/login.ejs', { login_form: loginForm.View() });
        }, 'login');

        this.CustomRoute(RouteType.GET | RouteType.POST, "register", (req, res, next) => 
        {
            res.status(200);
        }, 'register');
    }
}