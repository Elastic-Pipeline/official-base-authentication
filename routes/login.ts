import { Form } from "../../../API/FormFactory";
import { RouteManager } from "../../../API/internal/RouteManager";
import { Logger } from "../../../API/Logging";
import { Route, RouteType } from "../../../API/Routing";
import { LoginForm } from "../forms/loginForm";

export class LoginRoute extends Route
{
    constructor()
    {
        super("/");

        this.CustomRoute(RouteType.GET | RouteType.POST, "login", (req, res, next) => 
        {
            const loginForm = Form.CreateForm(new LoginForm(this), res);
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

        this.Get("logout", (req, res, next) => 
        {
            res.redirect(RouteManager.GetRouteLabel('home'));
            req.session.destroy((err) => {
                Logger.error("Session cookie Destruction Error:", err);
            });
        }, 'logout');
    }
}